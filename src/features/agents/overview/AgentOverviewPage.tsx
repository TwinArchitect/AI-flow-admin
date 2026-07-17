/**
 * AgentOverviewPage — 智能体对话首页
 *
 * 迁移映射（原型 → 目标）：
 *   bg-brand-* → bg-primary / text-primary
 *   bg-white dark:bg-slate-900 → bg-background
 *   text-slate-800 dark:text-slate-200 → text-foreground
 *   text-slate-500/400 → text-muted-foreground
 *   text-slate-300 → text-fg-subtle
 *   border-slate-100/200 dark:border-slate-800 → border-border
 *   bg-slate-50 → bg-muted / bg-accent
 *   bg-slate-100 → bg-accent
 *   hover:bg-slate-50 dark:hover:bg-slate-800 → hover:bg-accent
 *   motion/react → framer-motion
 *   rounded-full（非圆形）→ rounded-xl / rounded-2xl
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Sparkles,
  MessageSquare,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { OverviewUiMessage, MessageBlock } from '@/types';
import { ChatInputArea } from './components/ChatInputBar';
import { MessageContentView } from './components/MessageContentView';
import { AgentPickerModal, type SelectedPublishedAgent } from './components/AgentPickerModal';
import { ModelSelect } from './components/ModelSelect';
import { matchTestAgent } from './data/testAgents';
import type { TestAgentPreset } from './data/testAgents';
import { formatChatTime, defaultGroupName, buildStoppedBlock } from './utils/overviewMessages';
import { parseStringToBlocks, blocksToPlainText } from './utils/blockHelpers';
import type { AgentOpenChatGroup } from '@/types';

const PINNED_TEST_AGENTS_STORAGE_KEY = 'agent_overview_show_test_shortcuts';

export function AgentOverviewPage() {
  /* ─── 状态 ─── */
  const [groups, setGroups] = useState<AgentOpenChatGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<OverviewUiMessage[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [messagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [selectedPublishedAgent, setSelectedPublishedAgent] = useState<SelectedPublishedAgent | null>(null);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [showPinnedTestAgents] = useState(
    () => localStorage.getItem(PINNED_TEST_AGENTS_STORAGE_KEY) === '1'
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const streamingAssistantIdRef = useRef<string | null>(null);

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null;
  const hasMessages = messages.length > 0;

  /* ─── 滚动到底部 ─── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  /* ─── 清理 ─── */
  useEffect(() => {
    return () => { streamAbortRef.current?.abort(); };
  }, []);

  /* ─── Mock 初始数据 ─── */
  useEffect(() => {
    const mockGroups: AgentOpenChatGroup[] = [
      { id: 'g1', groupName: '新对话_14:30:22', lastQuestion: '什么是智能体', messageCount: 4 },
      { id: 'g2', groupName: '新对话_14:15:10', lastQuestion: '安全检查有哪些', messageCount: 6 },
    ];
    setGroups(mockGroups);
    setActiveGroupId('g1');
    setGroupsLoading(false);
  }, []);

  const refreshGroups = useCallback(async () => {
    // mock
    return groups;
  }, [groups]);

  const handleNewConversation = async () => {
    const id = `g-${Date.now()}`;
    const newGroup: AgentOpenChatGroup = { id, groupName: defaultGroupName() };
    setGroups((prev) => [newGroup, ...prev]);
    setActiveGroupId(id);
    setMessages([]);
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGroups((prev) => prev.filter((g) => g.id !== id));
    if (activeGroupId === id) {
      const remaining = groups.filter((g) => g.id !== id);
      setActiveGroupId(remaining[0]?.id ?? null);
      setMessages([]);
    }
  };

  const ensureActiveGroup = async (_titleHint: string): Promise<string> => {
    if (activeGroupId) return activeGroupId;
    await handleNewConversation();
    return activeGroupId ?? 'g-mock';
  };

  /* ─── 终止生成 ─── */
  const handleStopGeneration = useCallback(() => {
    if (!isSending) return;
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    const assistantId = streamingAssistantIdRef.current;
    if (assistantId) {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantId) return m;
          const hasContent = blocksToPlainText(m.blocks).trim();
          const stoppedBlock = buildStoppedBlock();
          return {
            ...m,
            blocks: hasContent ? [...m.blocks, ...stoppedBlock] : stoppedBlock,
          };
        })
      );
    }
    streamingAssistantIdRef.current = null;
    setIsSending(false);
  }, [isSending]);

  /* ─── 点赞 ─── */
  const handleLike = (backendId: string, next: number) => {
    setMessages((prev) =>
      prev.map((m) => (m.backendId === backendId ? { ...m, likes: next } : m))
    );
  };

  /* ─── 发送消息 ─── */
  const handleSendMessage = async () => {
    const question = inputValue.trim();
    if (!question || isSending) return;

    setInputValue('');
    setIsSending(true);

    const userMsg: OverviewUiMessage = {
      id: `local-u-${Date.now()}`,
      role: 'user',
      blocks: parseStringToBlocks(question, 'user'),
      timestamp: formatChatTime(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const assistantLocalId = `local-a-${Date.now()}`;
    streamingAssistantIdRef.current = assistantLocalId;
    setMessages((prev) => [
      ...prev,
      { id: assistantLocalId, role: 'assistant', blocks: [], timestamp: formatChatTime() },
    ]);

    const streamController = new AbortController();
    streamAbortRef.current = streamController;

    let assistantBlocks: MessageBlock[] = [];

    try {
      const groupId = await ensureActiveGroup(question);
      const testMatch = matchTestAgent(question);

      /* mock 延迟模拟响应 */
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      if (streamController.signal.aborted) return;

      const reply = testMatch?.intro ?? `您好！我是智能助手。关于「${question}」的问题，已为您记录并处理。\n\n**处理结果：**\n- 已接收您的问题\n- 正在分析相关数据\n- 预计处理时长约 2 分钟\n\n如需进一步帮助，请随时告诉我！`;

      assistantBlocks = parseStringToBlocks(reply, 'assistant');
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantLocalId ? { ...m, blocks: [...assistantBlocks] } : m))
      );

      await saveChatMessage({ groupId, question, answer: blocksToPlainText(assistantBlocks) });
      await refreshGroups();
    } catch {
      if (streamController.signal.aborted) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantLocalId
            ? { ...m, blocks: parseStringToBlocks('**请求失败：** 网络异常，请稍后重试', 'assistant') }
            : m
        )
      );
    } finally {
      if (streamAbortRef.current === streamController) streamAbortRef.current = null;
      streamingAssistantIdRef.current = null;
      setIsSending(false);
    }
  };

  const saveChatMessage = async (_data: { groupId: string; question: string; answer: string; agentId?: string }) => {
    // mock
  };

  /* ─── handler ─── */
  const handleSelectTestAgent = (preset: TestAgentPreset) => {
    localStorage.setItem(PINNED_TEST_AGENTS_STORAGE_KEY, '1');
    setSelectedPublishedAgent(null);
    setInputValue(preset.text);
    setAgentPickerOpen(false);
  };

  const handlePinnedTestAgentClick = (preset: TestAgentPreset) => {
    setSelectedPublishedAgent(null);
    setInputValue(preset.text);
  };

  const handleSelectPublishedAgent = (agent: SelectedPublishedAgent) => {
    localStorage.setItem(PINNED_TEST_AGENTS_STORAGE_KEY, '1');
    setSelectedPublishedAgent(agent);
    setAgentPickerOpen(false);
    toast.success(`已切换至「${agent.agentName}」`);
  };

  const inputPlaceholder = selectedPublishedAgent
    ? `向 ${selectedPublishedAgent.agentName} 提问...`
    : `发信息给 ${selectedModel}...`;

  const chatInputProps = {
    value: inputValue,
    onChange: setInputValue,
    onSend: handleSendMessage,
    onStop: handleStopGeneration,
    disabled: isSending,
    isSending,
    placeholder: inputPlaceholder,
    onOpenAgentPicker: () => setAgentPickerOpen(true),
    activeAgentLabel: selectedPublishedAgent?.agentName ?? null,
  };

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-background">
      {/* ═══ 侧边栏：对话分组 ═══ */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-full border-r border-border bg-background flex flex-col shrink-0 overflow-hidden"
          >
            {/* 侧边栏头部 */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <MessageSquare size={16} className="text-primary" />
                对话分组
              </span>
              <Button
                variant="ghost" size="xs"
                onClick={handleNewConversation}
                className="bg-primary/10 hover:bg-primary/20 text-primary font-bold gap-1 rounded-lg"
              >
                <Plus size={14} />
                新建
              </Button>
            </div>

            {/* 侧边栏列表 */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
              {groupsLoading ? (
                <div className="flex justify-center py-8 text-muted-foreground">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : groups.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8 px-2">暂无会话，点击新建开始对话</p>
              ) : (
                groups.map((group) => {
                  const isActive = group.id === activeGroupId;
                  return (
                    <div
                      key={group.id}
                      onClick={() => setActiveGroupId(group.id)}
                      className={cn(
                        'group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary'
                          : 'text-muted-foreground hover:bg-accent',
                      )}
                    >
                      <div className="flex flex-col flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 min-w-0">
                          <MessageSquare size={14} className={cn('shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                          <span className="text-xs truncate">{group.groupName}</span>
                        </div>
                        {group.lastQuestion && (
                          <span className="text-2xs text-muted-foreground truncate ml-6 mt-0.5">{group.lastQuestion}</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => handleDeleteConversation(group.id, e)}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 hover:text-destructive text-muted-foreground"
                        title="删除"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ═══ 主内容区 ═══ */}
      <div className="flex-1 flex flex-col h-full min-h-0 bg-background relative isolate">
        {/* 顶栏 */}
        <div className="h-11 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background relative z-[120]">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                'rounded-xl border shadow-sm',
                isSidebarOpen
                  ? 'border-primary text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary',
              )}
            >
              {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </Button>

            <ModelSelect value={selectedModel} onChange={setSelectedModel} />

            {/* Agent 选择器 chip — 对应原型 hidden sm:flex */}
            <div
              className={cn(
                'hidden sm:flex items-center gap-0.5 pl-2.5 pr-1 py-1 rounded-xl border text-[11px] font-bold transition-all max-w-[180px]',
                selectedPublishedAgent
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground',
              )}
            >
              <button
                type="button"
                onClick={() => setAgentPickerOpen(true)}
                className="flex items-center gap-1.5 min-w-0 hover:opacity-80 transition-opacity"
                title="选择智能体"
              >
                <Bot size={14} className="shrink-0" />
                <span className="truncate">{selectedPublishedAgent?.agentName ?? '选择智能体'}</span>
              </button>
              {selectedPublishedAgent && (
                <button
                  type="button"
                  onClick={() => setSelectedPublishedAgent(null)}
                  className="p-1 rounded-lg hover:bg-primary/20 shrink-0"
                  title="取消选择"
                >
                  <X size={12} className="opacity-60" />
                </button>
              )}
            </div>
          </div>

          <div className="text-[11px] font-mono text-muted-foreground font-bold bg-accent px-2.5 py-1 rounded-lg truncate max-w-[40%]">
            {activeGroup?.groupName ?? '新对话'}
          </div>
        </div>

        {/* 消息区域 */}
        {messagesLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : hasMessages ? (
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6 bg-background relative z-0">
            {messages.map((msg, index) => {
              const isStreamingAssistant = isSending && msg.role === 'assistant' && index === messages.length - 1;
              return (
                <div key={msg.id} className={cn('flex max-w-4xl mx-auto gap-4', msg.role === 'user' && 'flex-row-reverse')}>
                  {/* 头像 */}
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-sm',
                    msg.role === 'user'
                      ? 'bg-accent border-border'
                      : 'bg-primary border-primary/40 text-primary-foreground',
                  )}>
                    {msg.role === 'user' ? (
                      <span className="text-xs font-bold">我</span>
                    ) : (
                      <Sparkles size={15} />
                    )}
                  </div>

                  {/* 气泡 */}
                  <div className={cn('flex flex-col space-y-1 max-w-[85%]', msg.role === 'user' && 'items-end')}>
                    <div className={cn(
                      'px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-background text-foreground rounded-tl-none border border-border shadow-sm',
                    )}>
                      <MessageContentView
                        blocks={msg.blocks}
                        role={msg.role}
                        streaming={isStreamingAssistant}
                      />
                    </div>

                    {/* 底部操作栏 */}
                    <div className={cn('flex items-center gap-2 px-1', msg.role === 'user' && 'flex-row-reverse')}>
                      <span className="text-2xs text-muted-foreground font-bold">{msg.timestamp}</span>
                      {msg.role === 'assistant' && msg.backendId && (
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleLike(msg.backendId!, msg.likes === 1 ? 0 : 1)}
                            className={cn(
                              'rounded-md',
                              msg.likes === 1
                                ? 'text-success bg-success/10 hover:bg-success/20'
                                : 'text-muted-foreground hover:text-success hover:bg-accent',
                            )}
                            title={msg.likes === 1 ? '取消有帮助' : '有帮助'}
                          >
                            <ThumbsUp size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleLike(msg.backendId!, msg.likes === 2 ? 0 : 2)}
                            className={cn(
                              'rounded-md',
                              msg.likes === 2
                                ? 'text-destructive bg-destructive/10 hover:bg-destructive/20'
                                : 'text-muted-foreground hover:text-destructive hover:bg-accent',
                            )}
                            title={msg.likes === 2 ? '取消没帮助' : '没帮助'}
                          >
                            <ThumbsDown size={12} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* 空状态欢迎区 */
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center bg-background px-6 relative z-0">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl text-center space-y-12"
            >
              <h1 className="text-3xl font-medium text-foreground tracking-tight leading-normal">
                随时准备好，只等你需要
              </h1>
              <div className="relative max-w-xl mx-auto">
                <ChatInputArea
                  showPinnedTestAgents={false}
                  onSelectTestAgent={handlePinnedTestAgentClick}
                  {...chatInputProps}
                />
                <div className="absolute -inset-10 bg-primary/5 blur-[80px] -z-10 rounded-full pointer-events-none" />
              </div>
            </motion.div>
          </div>
        )}

        {/* 底部输入区（有消息时） */}
        {hasMessages && (
          <div className="px-6 py-4 border-t border-border shrink-0 bg-background relative z-[110]">
            <div className="max-w-4xl w-full mx-auto">
              <ChatInputArea
                showPinnedTestAgents={showPinnedTestAgents}
                onSelectTestAgent={handlePinnedTestAgentClick}
                {...chatInputProps}
              />
            </div>
          </div>
        )}
      </div>

      {/* 智能体选择弹窗 */}
      <AgentPickerModal
        open={agentPickerOpen}
        onClose={() => setAgentPickerOpen(false)}
        onSelectTestAgent={handleSelectTestAgent}
        onSelectPublishedAgent={handleSelectPublishedAgent}
        selectedPublishedAgentId={selectedPublishedAgent?.id}
      />
    </div>
  );
}
