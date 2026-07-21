import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  Paperclip,
  Play,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { resolveWorkflowFileType, type WorkflowDebugFile } from '../../api/workflowDebugApi';
import { useRunWorkflowStream, useUploadWorkflowDebugFile } from '../../hooks/useWorkflowRuntime';
import type {
  StartVariable,
} from '../../types';
import type { WorkflowNodeSsePayload } from '../../types/execution';
import type { WorkflowExecutionOutcome } from '../../types/execution';
import type { WorkflowDebugContext } from '../../utils/workflowDebugContext';
import {
  buildDebugVariableDefaults,
  buildWorkflowRunVariables,
  validateDebugVariables,
} from '../../utils/workflowDebugContext';

interface DebugMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: WorkflowDebugFile[];
}

interface WorkflowDebugDrawerProps {
  open: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
  context: WorkflowDebugContext;
  onExecutionReset: () => void;
  onExecutionStart: () => void;
  onExecutionFinish: (outcome: WorkflowExecutionOutcome, message?: string) => void;
  onNodeExecutionEvent: (eventName: string, payload: WorkflowNodeSsePayload) => void;
  onRunningChange: (running: boolean) => void;
}

const ALLOWED_EXTENSIONS = new Set([
  'txt', 'doc', 'docx', 'csv', 'xls', 'xlsx', 'zip', 'pdf', 'ppt', 'pptx',
  'bmp', 'mp3', 'mp4', 'flv', 'svg', 'jpg', 'jpeg', 'png',
]);

function DebugVariableField({
  variable,
  value,
  onChange,
}: {
  variable: StartVariable;
  value: string;
  onChange: (value: string) => void;
}) {
  const label = variable.description?.trim() || variable.label?.trim() || variable.key;
  return (
    <div className="space-y-2">
      <Label htmlFor={`debug-variable-${variable.id}`}>
        {label}{variable.required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {variable.valueType === 'boolean' ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={`debug-variable-${variable.id}`}><SelectValue placeholder="请选择" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">true</SelectItem>
            <SelectItem value="false">false</SelectItem>
          </SelectContent>
        </Select>
      ) : variable.valueType === 'object' || variable.valueType === 'array' ? (
        <Textarea
          id={`debug-variable-${variable.id}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-24 font-mono text-xs"
          placeholder={variable.valueType === 'array' ? '["a", "b"]' : '{"key": "value"}'}
        />
      ) : (
        <Input
          id={`debug-variable-${variable.id}`}
          type={variable.valueType === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={variable.defaultValue || '请输入'}
        />
      )}
      <p className="text-[10px] text-muted-foreground">{variable.key} · {variable.valueType}</p>
    </div>
  );
}

export function WorkflowDebugDrawer({
  open,
  onClose,
  agentId,
  agentName,
  context,
  onExecutionReset,
  onExecutionStart,
  onExecutionFinish,
  onNodeExecutionEvent,
  onRunningChange,
}: WorkflowDebugDrawerProps) {
  const runMutation = useRunWorkflowStream();
  const uploadMutation = useUploadWorkflowDebugFile();
  const [phase, setPhase] = useState<'variables' | 'chat'>('chat');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [variableError, setVariableError] = useState<string>();
  const [messages, setMessages] = useState<DebugMessage[]>([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<WorkflowDebugFile[]>([]);
  const [expanded, setExpanded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const chatGroupIdRef = useRef(`debug-${agentId}-${Date.now()}`);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRunning = runMutation.isPending;

  const resetSession = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    runMutation.reset();
    setVariableValues(buildDebugVariableDefaults(context.customStartVariables));
    setVariableError(undefined);
    setMessages([]);
    setInput('');
    setFiles([]);
    setPhase(context.needsVariableForm ? 'variables' : 'chat');
    chatGroupIdRef.current = `debug-${agentId}-${Date.now()}`;
    onExecutionReset();
  }, [agentId, context, onExecutionReset, runMutation]);

  useEffect(() => {
    if (!open) return;
    resetSession();
    setExpanded(false);
  }, [open]);

  useEffect(() => onRunningChange(isRunning), [isRunning, onRunningChange]);
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const customVariables = useMemo(
    () => buildWorkflowRunVariables(variableValues, context.customStartVariables),
    [context.customStartVariables, variableValues],
  );

  function stopRun() {
    if (!isRunning) return;
    abortRef.current?.abort();
    abortRef.current = null;
    onExecutionFinish('cancelled', '用户已中断运行');
    setMessages((current) => current.map((message, index) =>
      index === current.length - 1 && message.role === 'assistant'
        ? { ...message, content: `${message.content}${message.content ? '\n\n' : ''}（已终止生成）` }
        : message,
    ));
  }

  function closeDrawer() {
    if (isRunning) stopRun();
    onClose();
  }

  function confirmVariables() {
    const error = validateDebugVariables(context.customStartVariables, variableValues);
    if (error) {
      setVariableError(error);
      return;
    }
    setVariableError(undefined);
    setPhase('chat');
  }

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const incoming = Array.from(fileList);
    const next = [...files];

    for (const file of incoming) {
      if (next.length >= 5) {
        toast.error('最多上传 5 个文件');
        break;
      }
      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!ALLOWED_EXTENSIONS.has(extension)) {
        toast.error(`不支持的文件类型：${extension || '未知'}`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`「${file.name}」超过 50MB 限制`);
        continue;
      }
      try {
        const uploaded = await uploadMutation.mutateAsync({ file, voucherId: agentId });
        next.push(uploaded);
        setFiles([...next]);
      } catch (error) {
        toast.error('文件上传失败', { description: error instanceof Error ? error.message : '未知错误' });
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function sendMessage() {
    const content = input.trim();
    const sentFiles = [...files];
    if ((!content && sentFiles.length === 0) || isRunning) return;

    const userMessage: DebugMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      files: sentFiles,
    };
    const assistantId = `assistant-${Date.now()}`;
    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: 'assistant', content: '' },
    ]);
    setInput('');
    setFiles([]);
    onExecutionReset();
    onExecutionStart();
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await runMutation.mutateAsync({
        request: {
          appId: agentId,
          chatGroupId: chatGroupIdRef.current,
          message: [{ role: 'user', content }],
          variables: customVariables,
          files: sentFiles.map((file) => ({
            type: resolveWorkflowFileType(file.name),
            fileId: file.id,
            content: null,
          })),
          debug: true,
        },
        signal: controller.signal,
        onNodeEvent: onNodeExecutionEvent,
        onMessageDelta: (delta) => {
          setMessages((current) => current.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + delta }
              : message,
          ));
        },
      });
      setMessages((current) => current.map((message) =>
        message.id === assistantId && !message.content.trim()
          ? { ...message, content: String(result.answerText || result.outputs.answer || '（未收到回复内容）') }
          : message,
      ));
      onExecutionFinish('success');
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : '调试请求失败';
      onExecutionFinish('error', message);
      setMessages((current) => current.map((item) =>
        item.id === assistantId ? { ...item, content: `执行失败：${message}` } : item,
      ));
    } finally {
      abortRef.current = null;
    }
  }

  if (!open) return null;

  return (
    <aside className={cn(
      'absolute inset-y-0 right-0 z-40 flex flex-col border-l border-border bg-card shadow-xl',
      expanded ? 'left-4 w-auto' : 'w-[420px] max-w-[calc(100%-1rem)]',
    )}>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Play size={15} fill="currentColor" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">调试运行</h2>
            <p className="truncate text-[10px] text-muted-foreground">{agentName || agentId}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={resetSession} aria-label="重置调试会话">
            <RotateCcw size={15} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? '还原调试窗口' : '放大调试窗口'}>
            {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={closeDrawer} aria-label="关闭调试窗口">
            <X size={16} />
          </Button>
        </div>
      </header>

      {phase === 'variables' ? (
        <>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            <p className="text-xs leading-relaxed text-muted-foreground">
              开始节点配置了输入变量，调试前请填写以下参数。
            </p>
            {context.customStartVariables.map((variable) => (
              <DebugVariableField
                key={variable.id}
                variable={variable}
                value={variableValues[variable.key] ?? ''}
                onChange={(value) => {
                  setVariableValues((current) => ({ ...current, [variable.key]: value }));
                  setVariableError(undefined);
                }}
              />
            ))}
            {variableError && <p className="text-xs text-destructive">{variableError}</p>}
          </div>
          <footer className="border-t border-border p-4">
            <Button className="w-full" onClick={confirmVariables}>确认并开始调试</Button>
          </footer>
        </>
      ) : (
        <>
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full min-h-48 items-center justify-center text-xs text-muted-foreground">
                在下方输入问题，开始调试对话
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className={cn('flex gap-2.5', message.role === 'user' && 'flex-row-reverse')}>
                <span className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold',
                  message.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground',
                )}>
                  {message.role === 'user' ? '我' : <Sparkles size={13} />}
                </span>
                <div className={cn(
                  'max-w-[85%] space-y-2 rounded-md border px-3 py-2 text-xs leading-relaxed',
                  message.role === 'user'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-muted/60 text-foreground',
                )}>
                  {message.files?.map((file) => (
                    <div key={file.id} className="flex items-center gap-1.5"><FileText size={13} /><span className="truncate">{file.name}</span></div>
                  ))}
                  <p className="whitespace-pre-wrap break-words">
                    {message.content || (isRunning && message.role === 'assistant' ? '正在生成…' : '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <footer className="shrink-0 space-y-2 border-t border-border p-4">
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file) => (
                  <span key={file.id} className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                    <FileText size={11} /><span className="max-w-40 truncate">{file.name}</span>
                    <button type="button" onClick={() => setFiles((current) => current.filter((item) => item.id !== file.id))} aria-label={`移除${file.name}`}><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 rounded-md border border-border bg-background p-2 focus-within:ring-2 focus-within:ring-ring/30">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="sr-only"
                onChange={(event) => void uploadFiles(event.target.files)}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={uploadMutation.isPending || isRunning}
                onClick={() => fileInputRef.current?.click()}
                aria-label="上传附件"
              >
                {uploadMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
              </Button>
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                disabled={isRunning}
                rows={1}
                placeholder="输入调试问题，Enter 发送"
                className="max-h-28 min-h-9 flex-1 resize-none border-0 bg-transparent px-1 py-2 shadow-none focus-visible:ring-0"
              />
              {isRunning ? (
                <Button variant="destructive" size="icon-sm" onClick={stopRun} aria-label="终止生成">
                  <Square size={13} fill="currentColor" />
                </Button>
              ) : (
                <Button size="icon-sm" disabled={!input.trim() && files.length === 0} onClick={() => void sendMessage()} aria-label="发送调试问题">
                  <SendHorizontal size={15} />
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">支持连续调试会话，最多上传 5 个附件，单文件不超过 50MB。</p>
          </footer>
        </>
      )}
    </aside>
  );
}
