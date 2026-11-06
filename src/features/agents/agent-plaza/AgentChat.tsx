import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Paperclip,
  PanelLeft,
  Plus,
  Send,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { http } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
  AgentOpenChatGroup,
  ChatContentBlock,
  MessageBlock,
  OverviewUiMessage,
} from '@/types';
import { runConversationTurn } from '@/features/conversation-runtime/runConversationTurn';
import {
  ChatPreviewToolMonitor,
  PreviewWaitingStatus,
} from '@/features/conversation-runtime/ExecutionTraceMonitor';
import {
  removeTransientConversationBlocks,
  resolveConversationResultRichBlocks,
} from '@/features/message-render/richContent';
import {
  resolveWorkflowFileType,
  uploadWorkflowDebugFile,
  type WorkflowDebugFile,
} from '@/features/workflows/api/workflowDebugApi';
import { getAgentFileUpload } from '../api/agentApi';
import { deleteChatGroup, queryChatGroups, saveChatGroup } from '../api/chatApi';
import { prepareChatUploadFile } from '../orchestration/cameraCapture';
import { MessageContentView } from '../overview/components/MessageContentView';
import { resolveAgentUploadGuide, validateAgentPhoto } from '../overview/agentFileUpload';
import { appendPersistedRichBlocks } from '../overview/utils/chatContents';
import { blocksToPlainText, parseStringToBlocks } from '../overview/utils/blockHelpers';
import {
  buildGroupTitle,
  defaultGroupName,
  formatChatTime,
} from '../overview/utils/overviewMessages';
import { getSquareDetail, getSquareLabels, getSquareWelcome } from './squareApi';
import { SquareAvatar } from './SquareAvatar';
import {
  attachmentBlocks,
  restoreSquareMessages,
  saveSquareQuestion,
  type SquareChatContent,
  type SquareChatRecord,
} from './squareMessages';

export function AgentChatPage() {
  const [params] = useSearchParams();
  const agentId = params.get('agentId')?.trim() || '';
  // A different agent must start with its own history, pending uploads and stream.
  return <SquareChat key={agentId} agentId={agentId} />;
}

function SquareChat({ agentId }: { agentId: string }) {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<AgentOpenChatGroup[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<OverviewUiMessage[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(Boolean(agentId));
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(true);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<WorkflowDebugFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const stream = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const fileInput = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const skipHistory = useRef<string | null>(null);
  const detailQuery = useQuery({
    queryKey: ['square-detail', agentId],
    queryFn: ({ signal }) => getSquareDetail(agentId, signal),
    enabled: Boolean(agentId),
    retry: false,
  });
  const labelsQuery = useQuery({
    queryKey: ['square-labels'],
    queryFn: ({ signal }) => getSquareLabels(signal),
    enabled: Boolean(agentId),
    retry: false,
  });
  const welcomeQuery = useQuery({
    queryKey: ['square-welcome', agentId],
    queryFn: ({ signal }) => getSquareWelcome(agentId, signal),
    enabled: Boolean(agentId),
    retry: false,
  });
  const uploadQuery = useQuery({
    queryKey: ['square-upload', agentId],
    queryFn: () => getAgentFileUpload(agentId),
    enabled: Boolean(agentId),
    retry: false,
  });
  const detail = detailQuery.data;
  const guide = resolveAgentUploadGuide(uploadQuery.data);
  const questions = (
    welcomeQuery.data?.openingQuestions?.filter((question) => question?.trim()).length
      ? welcomeQuery.data.openingQuestions
      : (detail?.openingQuestions ?? [])
  ).filter((question) => question?.trim());

  const refreshGroups = useCallback(async () => {
    const list = ((await queryChatGroups()) ?? []).filter((group) => group.agentId === agentId);
    if (mounted.current) setGroups(list);
    return list;
  }, [agentId]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stream.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!agentId) return;
    let cancelled = false;
    void refreshGroups()
      .then((list) => {
        if (!cancelled) setGroupId(list[0]?.id ?? null);
      })
      .catch((error) => {
        if (!cancelled) setHistoryError(error instanceof Error ? error.message : '加载会话失败');
      })
      .finally(() => {
        if (!cancelled) setLoadingGroups(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId, refreshGroups]);

  useEffect(() => {
    if (!groupId) {
      setMessages([]);
      return;
    }
    if (skipHistory.current === groupId) {
      skipHistory.current = null;
      return;
    }
    const controller = new AbortController();
    setLoadingHistory(true);
    setHistoryError(null);
    setMessages([]);
    void http
      .get<SquareChatRecord[]>(`/gpt/base/chat/message/query/${encodeURIComponent(groupId)}`, {
        signal: controller.signal,
      })
      .then((response) => {
        if (!controller.signal.aborted) setMessages(restoreSquareMessages(response.data ?? []));
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setHistoryError(error instanceof Error ? error.message : '加载历史消息失败');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingHistory(false);
      });
    return () => controller.abort();
  }, [groupId]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  const newConversation = async () => {
    if (busy.current || uploading) return;
    try {
      const created = await saveChatGroup(defaultGroupName(), agentId);
      await refreshGroups();
      if (!mounted.current) return;
      skipHistory.current = created.id;
      setGroupId(created.id);
      setMessages([]);
      setFiles([]);
      setText('');
      setHistoryError(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '新建会话失败');
    }
  };

  const removeGroup = async (id: string) => {
    if (busy.current) return;
    try {
      await deleteChatGroup(id);
      const list = await refreshGroups();
      if (mounted.current && groupId === id) setGroupId(list[0]?.id ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除会话失败');
    }
  };

  const uploadFiles = async (selected: File[]) => {
    if (uploading || busy.current || !guide.enabled) return;
    setUploading(true);
    const next = [...files];
    try {
      for (const raw of selected) {
        if (next.length >= guide.maxCount) {
          toast.error(`最多上传 ${guide.maxCount} 个文件`);
          break;
        }
        try {
          const file = await prepareChatUploadFile(raw);
          const validation = validateAgentPhoto(file, guide);
          if (validation) {
            toast.error(`${file.name}：${validation}`);
            continue;
          }
          const uploaded = await uploadWorkflowDebugFile(file, agentId, 'agent-square-chat');
          next.push(uploaded);
          if (mounted.current) setFiles([...next]);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : '上传失败');
        }
      }
    } finally {
      if (mounted.current) setUploading(false);
    }
  };

  const send = async (override?: string) => {
    const question = (override ?? text).trim();
    const sentFiles = override ? [] : [...files];
    if (
      (!question && !sentFiles.length) ||
      busy.current ||
      uploading ||
      loadingGroups ||
      loadingHistory ||
      historyError ||
      !detail
    )
      return;
    busy.current = true;
    setSending(true);
    setText('');
    setFiles([]);
    const assistantId = `assistant-${Date.now()}`;
    setMessages((previous) => [
      ...previous.map((message) => ({
        ...message,
        blocks: removeTransientConversationBlocks(message.blocks),
      })),
      {
        id: `user-${Date.now()}`,
        role: 'user',
        blocks: [
          ...attachmentBlocks(sentFiles),
          ...(question ? parseStringToBlocks(question, 'user') : []),
        ],
        timestamp: formatChatTime(),
      },
      {
        id: assistantId,
        role: 'assistant',
        blocks: [],
        timestamp: formatChatTime(),
        debugTraces: [],
      },
    ]);
    const controller = new AbortController();
    stream.current = controller;
    let finalBlocks: MessageBlock[] = [];
    let rich: ChatContentBlock[] = [];
    try {
      let currentGroupId = groupId;
      if (!currentGroupId) {
        const created = await saveChatGroup(
          buildGroupTitle(question || sentFiles[0]?.name || '附件'),
          agentId
        );
        currentGroupId = created.id;
        if (!mounted.current || controller.signal.aborted) return;
        skipHistory.current = currentGroupId;
        setGroupId(currentGroupId);
        await refreshGroups();
      }
      const started = Date.now();
      const result = await runConversationTurn({
        request: {
          appId: agentId,
          chatGroupId: currentGroupId,
          fromSquare: true,
          message: [{ role: 'user', content: question }],
          debug: true,
          files: sentFiles.map((file) => ({
            fileId: file.id,
            type: resolveWorkflowFileType(file.name),
            content: null,
          })),
        },
        signal: controller.signal,
        onBlocks: (blocks) => {
          finalBlocks = blocks;
          rich = appendPersistedRichBlocks(rich, blocks);
          if (mounted.current)
            setMessages((previous) =>
              previous.map((message) =>
                message.id === assistantId ? { ...message, blocks: [...blocks] } : message
              )
            );
        },
        onTraces: (traces) => {
          if (mounted.current)
            setMessages((previous) =>
              previous.map((message) =>
                message.id === assistantId ? { ...message, debugTraces: traces } : message
              )
            );
        },
      });
      rich = appendPersistedRichBlocks(rich, resolveConversationResultRichBlocks(result.result));
      finalBlocks = result.blocks;
      const contents: SquareChatContent[] = [
        ...rich,
        ...sentFiles.map((file) => ({
          type: 'attachment' as const,
          data: { fileId: file.id, fileName: file.name },
        })),
      ];
      if (blocksToPlainText(finalBlocks).trim() || rich.length) {
        try {
          await http.post('/gpt/base/chat/message/save', {
            groupId: currentGroupId,
            agentId,
            question: saveSquareQuestion(question, sentFiles),
            answer: blocksToPlainText(finalBlocks) || '（无文本回复）',
            contents,
            responseTime: Date.now() - started,
          });
        } catch (error) {
          toast.error(error instanceof Error ? `会话保存失败：${error.message}` : '会话保存失败');
        }
      }
      await refreshGroups();
    } catch (error) {
      const stopped = controller.signal.aborted;
      const message = stopped
        ? '*（已终止生成）*'
        : `请求失败：${error instanceof Error ? error.message : '请稍后重试'}`;
      if (mounted.current)
        setMessages((previous) =>
          previous.map((item) =>
            item.id === assistantId
              ? { ...item, blocks: [...finalBlocks, ...parseStringToBlocks(message, 'assistant')] }
              : item
          )
        );
    } finally {
      busy.current = false;
      if (mounted.current) setSending(false);
      if (stream.current === controller) stream.current = null;
    }
  };

  if (!agentId || detailQuery.isError)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p role="alert" className="text-sm text-muted-foreground">
          {!agentId
            ? '缺少智能体 ID，请从智能体广场进入'
            : detailQuery.error?.message || '加载广场详情失败'}
        </p>
        <Button variant="outline" onClick={() => navigate('/agents/AgentPlaza')}>
          返回智能体广场
        </Button>
      </div>
    );
  if (detailQuery.isPending)
    return (
      <div
        role="status"
        className="flex h-full items-center justify-center gap-2 text-muted-foreground"
      >
        <Loader2 className="animate-spin" size={20} />
        加载智能体…
      </div>
    );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="flex shrink-0 flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="返回智能体广场"
          onClick={() => navigate('/agents/AgentPlaza')}
        >
          <ArrowLeft />
        </Button>
        {detail && <SquareAvatar agent={detail} />}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold">
            {detail?.agentName || '未命名智能体'}
          </h1>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {detail?.remark || '暂无简介'}
          </p>
        </div>
        <Badge variant="secondary">
          {labelsQuery.data?.find((label) => label.id === detail?.squareLabelId)?.name || '广场'}
        </Badge>
        <div className="text-right text-2xs leading-5 text-muted-foreground">
          <p>上架 {detail?.squareTime?.replace('T', ' ').slice(0, 16) || '-'}</p>
          <p>使用 {detail?.useCount ?? 0} 次</p>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
        {sidebar && (
          <aside className="flex w-48 shrink-0 flex-col border-r border-border bg-muted/25 lg:w-56">
            <div className="flex items-center justify-between border-b border-border p-3">
              <span className="text-xs font-semibold">会话记录</span>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="新建会话"
                disabled={sending || uploading || loadingGroups}
                onClick={() => void newConversation()}
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              {loadingGroups ? (
                <p role="status" className="p-3 text-xs text-muted-foreground">
                  加载会话…
                </p>
              ) : groups.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground">暂无会话</p>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className={cn(
                      'group flex items-center rounded-lg',
                      groupId === group.id ? 'bg-primary/10 text-primary-text' : 'hover:bg-accent'
                    )}
                  >
                    <button
                      type="button"
                      disabled={sending || uploading}
                      onClick={() => {
                        setGroupId(group.id);
                        setFiles([]);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 px-3 py-3 text-left text-xs"
                    >
                      <MessageSquare size={14} className="shrink-0" />
                      <span className="truncate">{group.groupName}</span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={sending}
                      aria-label={`删除会话 ${group.groupName}`}
                      onClick={() => void removeGroup(group.id)}
                      className="mr-1 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={sidebar ? '收起会话记录' : '展开会话记录'}
              onClick={() => setSidebar(!sidebar)}
            >
              <PanelLeft size={17} />
            </Button>
            <span className="truncate text-xs text-muted-foreground">
              {groups.find((group) => group.id === groupId)?.groupName || '新对话'}
            </span>
            <Button
              className="ml-auto"
              variant="ghost"
              size="sm"
              disabled={sending || uploading || loadingGroups}
              onClick={() => void newConversation()}
            >
              <Plus size={14} />
              新建会话
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {loadingHistory ? (
              <div role="status" className="flex justify-center p-8">
                <Loader2 size={22} className="animate-spin text-muted-foreground" />
              </div>
            ) : historyError ? (
              <p role="alert" className="py-8 text-center text-sm text-destructive">
                {historyError}
              </p>
            ) : !messages.length ? (
              <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center gap-6 py-8">
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold">{detail?.agentName || '智能体'}</h2>
                  {detail?.welcomeText ? (
                    <MessageContentView
                      blocks={parseStringToBlocks(detail.welcomeText, 'assistant')}
                      role="assistant"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">你好，有什么可以帮你？</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {questions.map((question, index) => (
                    <Button
                      key={`${index}-${question}`}
                      variant="outline"
                      size="sm"
                      className="h-auto whitespace-normal text-left"
                      disabled={sending || loadingGroups}
                      onClick={() => void send(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-4xl space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={cn('flex flex-col gap-2', message.role === 'user' && 'items-end')}
                  >
                    <span className="text-2xs text-muted-foreground">
                      {message.role === 'user' ? '我' : detail?.agentName} · {message.timestamp}
                    </span>
                    {message.role === 'assistant' && Boolean(message.debugTraces?.length) && (
                      <ChatPreviewToolMonitor traces={message.debugTraces ?? []} compact />
                    )}
                    <div
                      className={cn(
                        'max-w-full rounded-xl px-4 py-3 text-sm md:max-w-[90%]',
                        message.role === 'user'
                          ? 'bg-primary/10 text-foreground'
                          : 'w-full border border-border bg-background'
                      )}
                    >
                      {sending && index === messages.length - 1 && !message.blocks.length ? (
                        <PreviewWaitingStatus active traces={message.debugTraces ?? []} />
                      ) : (
                        <MessageContentView
                          blocks={message.blocks}
                          role={message.role}
                          streaming={sending && index === messages.length - 1}
                          onSuggestedQuestionClick={(question) => void send(question)}
                        />
                      )}
                    </div>
                  </div>
                ))}
                <div ref={end} />
              </div>
            )}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="shrink-0 space-y-2 border-t border-border p-4"
          >
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file) => (
                  <span
                    key={file.id}
                    className="flex max-w-full items-center gap-2 rounded-lg bg-muted px-2 py-1 text-xs"
                  >
                    <Paperclip size={12} />
                    <span className="max-w-40 truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`移除附件 ${file.name}`}
                      disabled={sending || uploading}
                      onClick={() => setFiles(files.filter((item) => item.id !== file.id))}
                    >
                      <X size={12} />
                    </Button>
                  </span>
                ))}
              </div>
            )}
            <Textarea
              aria-label="输入消息"
              placeholder="输入消息，Enter 发送，Shift+Enter 换行"
              value={text}
              disabled={sending || !detail || Boolean(historyError)}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void send();
                }
              }}
              className="max-h-36 min-h-20 resize-none"
            />
            <div className="flex items-center gap-2">
              {guide.enabled && (
                <>
                  <input
                    ref={fileInput}
                    type="file"
                    multiple
                    accept={guide.types}
                    className="hidden"
                    onChange={(event) => {
                      const selected = Array.from(event.target.files ?? []);
                      event.target.value = '';
                      void uploadFiles(selected);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={uploading || sending}
                    onClick={() => fileInput.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Paperclip size={15} />
                    )}
                    {uploading ? '上传中…' : '上传附件'}
                  </Button>
                </>
              )}
              <span className="ml-auto text-2xs text-muted-foreground">AI 生成内容仅供参考</span>
              {sending ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => stream.current?.abort()}
                >
                  <Square size={13} />
                  停止
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    uploading ||
                    loadingHistory ||
                    loadingGroups ||
                    Boolean(historyError) ||
                    (!text.trim() && !files.length)
                  }
                >
                  <Send size={14} />
                  发送
                </Button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
