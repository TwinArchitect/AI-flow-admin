import { ChevronDown, Loader2, Sparkles, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ToolCallPhase = 'start' | 'end' | 'error' | 'rejected';

export type PreviewToolCallTrace = {
  key: string;
  toolName: string;
  /** 后端若带 displayName/name，优先作展示名 */
  displayName?: string;
  invocation: number;
  phase: ToolCallPhase;
  arguments?: string;
  resultPreview?: string;
  error?: string;
  durationMs?: number;
  taskId?: string;
  updatedAt: number;
};

export type PreviewModelRequestTrace = {
  id: string;
  taskId?: string;
  at: number;
};

export type PreviewDebugTrace =
  | ({ kind: 'tool' } & PreviewToolCallTrace)
  | ({ kind: 'model_request' } & PreviewModelRequestTrace);

const PHASE_LABEL: Record<ToolCallPhase, string> = {
  start: '进行中',
  end: '成功',
  error: '失败',
  rejected: '拒绝'
};

/** 内置工具英文名 → 展示名 */
const BUILTIN_TOOL_LABELS: Record<string, string> = {
  search_knowledge: '知识库检索',
  knowledge_search: '知识库检索',
  dataset_search: '知识库检索'
};

export type ToolDisplayNameMap = Record<string, string>;

/**
 * 将 SSE toolName 解析为可读名称。
 * 兼容 http_{id} / mcp_{id} / 英文 function 名，以及外部传入的映射表。
 */
export function resolveToolDisplayName(
  toolName: string,
  nameMap?: ToolDisplayNameMap,
  displayName?: string
): { label: string; kind?: string } {
  const fromEvent = displayName?.trim();
  if (fromEvent) return { label: fromEvent };

  const raw = toolName.trim();
  if (!raw) return { label: '未知工具' };

  const mapped = nameMap?.[raw] ?? nameMap?.[raw.toLowerCase()];
  if (mapped) return { label: mapped };

  const builtin = BUILTIN_TOOL_LABELS[raw] ?? BUILTIN_TOOL_LABELS[raw.toLowerCase()];
  if (builtin) return { label: builtin, kind: '知识库' };

  const httpMatch = raw.match(/^(?:http[_-]?)(.+)$/i);
  if (httpMatch) {
    const id = httpMatch[1];
    const httpLabel = nameMap?.[`http:${id}`] ?? nameMap?.[id];
    return { label: httpLabel || raw, kind: 'HTTP' };
  }

  const mcpMatch = raw.match(/^(?:mcp[_-]?)(.+)$/i);
  if (mcpMatch) {
    const id = mcpMatch[1];
    const mcpLabel = nameMap?.[`mcp:${id}`] ?? nameMap?.[id];
    return { label: mcpLabel || raw, kind: 'MCP' };
  }

  const wfMatch = raw.match(/^(?:workflow[_-]?)(.+)$/i);
  if (wfMatch) {
    const id = wfMatch[1];
    const wfLabel = nameMap?.[`workflow:${id}`] ?? nameMap?.[id];
    return { label: wfLabel || raw, kind: '工作流' };
  }

  return { label: raw };
}

const PHASE_CLASS: Record<ToolCallPhase, string> = {
  start: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  end: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  error:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  rejected:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s || undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function normalizePhase(raw: unknown): ToolCallPhase | null {
  const v = String(raw ?? '').trim().toLowerCase();
  if (v === 'start' || v === 'end' || v === 'error' || v === 'rejected') return v;
  return null;
}

/** 从 SSE onNodeEvent payload 解析 tool_status */
export function parseToolStatusPayload(
  payload: unknown
): Omit<PreviewToolCallTrace, 'updatedAt'> | null {
  const root = asRecord(payload);
  if (!root) return null;
  const data = asRecord(root.data) ?? root;
  const phase = normalizePhase(data.phase);
  const toolName = readString(data.toolName) ?? readString(data.name);
  const invocation = readNumber(data.invocation) ?? 0;
  if (!phase || !toolName) return null;

  const taskId =
    readString(root.task_id) ??
    readString(root.taskId) ??
    readString(data.task_id) ??
    readString(data.taskId);

  const displayName =
    readString(data.displayName) ??
    readString(data.toolDisplayName) ??
    (readString(data.name) && readString(data.name) !== toolName
      ? readString(data.name)
      : undefined);

  return {
    key: `${toolName}#${invocation || 1}`,
    toolName,
    displayName,
    invocation: invocation || 1,
    phase,
    arguments: readString(data.arguments),
    resultPreview: readString(data.resultPreview),
    error: readString(data.error),
    durationMs: readNumber(data.durationMs),
    taskId
  };
}

/** 从 SSE onNodeEvent payload 解析 model_request */
export function parseModelRequestPayload(
  payload: unknown
): Omit<PreviewModelRequestTrace, 'id' | 'at'> {
  const root = asRecord(payload);
  if (!root) return {};
  const data = asRecord(root.data) ?? root;
  return {
    taskId:
      readString(root.task_id) ??
      readString(root.taskId) ??
      readString(data.task_id) ??
      readString(data.taskId)
  };
}

export function upsertDebugTrace(
  prev: PreviewDebugTrace[],
  eventName: string,
  payload: unknown
): PreviewDebugTrace[] {
  const name = eventName.trim().toLowerCase();
  if (name === 'tool_status' || name === 'toolstatus') {
    const parsed = parseToolStatusPayload(payload);
    if (!parsed) return prev;
    const nextItem: PreviewDebugTrace = {
      kind: 'tool',
      ...parsed,
      updatedAt: Date.now()
    };
    const idx = prev.findIndex((t) => t.kind === 'tool' && t.key === parsed.key);
    if (idx < 0) return [...prev, nextItem];
    const existed = prev[idx];
    if (existed.kind !== 'tool') return prev;
    const merged: PreviewDebugTrace = {
      ...existed,
      ...nextItem,
      displayName: nextItem.displayName ?? existed.displayName,
      arguments: nextItem.arguments ?? existed.arguments,
      resultPreview: nextItem.resultPreview ?? existed.resultPreview,
      error: nextItem.error ?? existed.error,
      durationMs: nextItem.durationMs ?? existed.durationMs,
      taskId: nextItem.taskId ?? existed.taskId
    };
    const copy = [...prev];
    copy[idx] = merged;
    return copy;
  }

  if (name === 'model_request' || name === 'modelrequest') {
    const parsed = parseModelRequestPayload(payload);
    return [
      ...prev,
      {
        kind: 'model_request',
        id: `mr-${Date.now()}-${prev.length}`,
        taskId: parsed.taskId,
        at: Date.now()
      }
    ];
  }

  return prev;
}

function ToolTraceDetail({
  trace,
  nameMap
}: {
  trace: PreviewToolCallTrace;
  nameMap?: ToolDisplayNameMap;
}) {
  const [open, setOpen] = useState(false);
  const hasDetail = Boolean(trace.arguments || trace.resultPreview || trace.error);
  const resolved = resolveToolDisplayName(trace.toolName, nameMap, trace.displayName);

  return (
    <div
      className={`rounded-lg border px-2.5 py-2 transition-colors ${
        trace.phase === 'start'
          ? 'border-sky-200/90 dark:border-sky-500/35 bg-sky-50/70 dark:bg-sky-500/10'
          : 'border-border/80 bg-muted/40 dark:bg-white/[0.03]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {resolved.kind && (
              <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                {resolved.kind}
              </span>
            )}
            <span className="text-[11px] font-semibold text-foreground truncate" title={trace.toolName}>
              {resolved.label}
            </span>
            <span className="text-[10px] text-muted-foreground">#{trace.invocation}</span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${PHASE_CLASS[trace.phase]}`}
            >
              {trace.phase === 'start' && <Loader2 size={10} className="animate-spin" />}
              {PHASE_LABEL[trace.phase]}
            </span>
            {trace.durationMs != null && (
              <span className="text-[10px] text-muted-foreground">{trace.durationMs}ms</span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            <span className="text-muted-foreground/80">调用工具</span>{' '}
            <code className="font-mono text-muted-foreground break-all">{trace.toolName}</code>
          </div>
          {trace.phase === 'start' && (
            <div className="pt-0.5">
              <div className="h-1 rounded-full bg-sky-100 dark:bg-sky-500/20 overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-sky-400/90 dark:bg-sky-400/70 animate-preview-progress" />
              </div>
            </div>
          )}
          {trace.error && (
            <p className="text-[10px] text-rose-600 dark:text-rose-400 leading-relaxed break-all">
              {trace.error}
            </p>
          )}
        </div>
        {hasDetail && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-muted-foreground hover:bg-muted transition-colors"
            title={open ? '收起详情' : '展开详情'}
          >
            <ChevronDown
              size={14}
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>
      {open && hasDetail && (
        <div className="mt-2 space-y-1.5 border-t border-border/60 pt-2">
          {trace.arguments && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">arguments</div>
              <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed max-h-28 overflow-y-auto">
                {trace.arguments}
              </pre>
            </div>
          )}
          {trace.resultPreview && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">resultPreview</div>
              <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed max-h-28 overflow-y-auto">
                {trace.resultPreview}
              </pre>
            </div>
          )}
          {trace.error && !trace.resultPreview && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">error</div>
              <pre className="text-[10px] font-mono text-rose-600 dark:text-rose-400 whitespace-pre-wrap break-all leading-relaxed">
                {trace.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type ChatPreviewToolMonitorProps = {
  traces: PreviewDebugTrace[];
  compact?: boolean;
  /** id / toolName → 展示名，用于把 http_xxx 等映射成业务名称 */
  toolNameMap?: ToolDisplayNameMap;
};

export function ChatPreviewToolMonitor({
  traces,
  compact,
  toolNameMap
}: ChatPreviewToolMonitorProps) {
  const [open, setOpen] = useState(true);
  if (traces.length === 0) return null;

  const toolCount = traces.filter((t) => t.kind === 'tool').length;
  const modelCount = traces.filter((t) => t.kind === 'model_request').length;
  const running = traces.some((t) => t.kind === 'tool' && t.phase === 'start');
  const failed = traces.some(
    (t) => t.kind === 'tool' && (t.phase === 'error' || t.phase === 'rejected')
  );

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        failed
          ? 'border-rose-200/80 dark:border-rose-500/30 bg-rose-50/40 dark:bg-rose-500/5'
          : running
            ? 'border-sky-200/90 dark:border-sky-500/35 bg-sky-50/50 dark:bg-sky-500/10'
            : 'border-border bg-card/80 dark:bg-slate-800/50'
      } ${compact ? 'max-w-[85%]' : ''}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-muted/50 transition-colors"
      >
        <Wrench
          size={12}
          className={`shrink-0 ${running ? 'text-sky-500 animate-pulse' : 'text-muted-foreground'}`}
        />
        <span className="text-[11px] font-semibold text-muted-foreground flex-1 min-w-0 truncate">
          {running ? '工具执行中' : '工具调用监控'}
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {modelCount > 0 ? `${modelCount} 次模型` : ''}
          {modelCount > 0 && toolCount > 0 ? ' · ' : ''}
          {toolCount > 0 ? `${toolCount} 次工具` : ''}
        </span>
        {running && <Loader2 size={11} className="animate-spin text-sky-500 shrink-0" />}
        <ChevronDown
          size={13}
          className={`text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-2.5 pb-2.5 space-y-1.5 border-t border-border/60">
          {traces.map((trace) => {
            if (trace.kind === 'model_request') {
              const modelIndex =
                traces
                  .filter((t) => t.kind === 'model_request')
                  .findIndex((t) => t.kind === 'model_request' && t.id === trace.id) + 1;
              return (
                <div
                  key={trace.id}
                  className="flex items-center gap-2 px-1 pt-1.5 text-[10px] text-muted-foreground"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  <span>模型请求 #{modelIndex}</span>
                  {trace.taskId && (
                    <span className="font-mono truncate opacity-70" title={trace.taskId}>
                      {trace.taskId}
                    </span>
                  )}
                </div>
              );
            }
            return (
              <ToolTraceDetail key={trace.key} trace={trace} nameMap={toolNameMap} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function WavyWaitingDots({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dotClass =
    size === 'sm'
      ? 'w-1 h-1 animate-preview-wave-dot'
      : 'w-1.5 h-1.5 animate-preview-wave-dot';
  const delays = ['0ms', '140ms', '280ms', '420ms', '560ms', '700ms'];

  return (
    <span
      className={`inline-flex items-end gap-[3px] ${size === 'sm' ? 'h-3' : 'h-4'}`}
      role="status"
      aria-label="智能体执行中"
    >
      {delays.map((delay) => (
        <span
          key={delay}
          className={`rounded-full bg-current ${dotClass}`}
          style={{ animationDelay: delay }}
        />
      ))}
    </span>
  );
}

type PreviewWaitingStatusProps = {
  active: boolean;
  traces?: PreviewDebugTrace[];
  toolNameMap?: ToolDisplayNameMap;
  /** 气泡内紧凑样式；气泡外独立条带样式 */
  variant?: 'inline' | 'bar';
};

/** 简易智能体调试：思考 / 工具 / 模型等待态 */
export function PreviewWaitingStatus({
  active,
  traces = [],
  toolNameMap,
  variant = 'inline'
}: PreviewWaitingStatusProps) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsedSec(0);
      return;
    }
    const started = Date.now();
    setElapsedSec(0);
    const timer = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  if (!active) return null;

  const runningTools = traces.filter(
    (t): t is PreviewDebugTrace & { kind: 'tool' } =>
      t.kind === 'tool' && t.phase === 'start'
  );
  const hasModel = traces.some((t) => t.kind === 'model_request');

  let title = '思考中';
  let detail: string | undefined;
  if (runningTools.length > 0) {
    title = runningTools.length > 1 ? `正在调用 ${runningTools.length} 个工具` : '正在调用工具';
    detail = resolveToolDisplayName(
      runningTools[0].toolName,
      toolNameMap,
      runningTools[0].displayName
    ).label;
  } else if (hasModel) {
    title = '模型生成中';
  }

  const elapsedLabel =
    elapsedSec >= 60
      ? `${Math.floor(elapsedSec / 60)}分${elapsedSec % 60}秒`
      : elapsedSec > 0
        ? `${elapsedSec}秒`
        : null;

  if (variant === 'bar') {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-sky-200/80 dark:border-sky-500/30 bg-sky-50/80 dark:bg-sky-500/10 px-2.5 py-1.5 text-[11px] text-sky-700 dark:text-sky-300 shadow-[0_4px_14px_-8px_rgba(14,165,233,0.45)]">
        <span className="relative flex h-4 w-4 items-center justify-center shrink-0">
          <span className="absolute inset-0 rounded-full bg-sky-400/30 animate-ping" />
          <Loader2 size={12} className="relative animate-spin" />
        </span>
        <span className="font-medium inline-flex items-center gap-1.5">
          {title}
          <span className="text-sky-600 dark:text-sky-300">
            <WavyWaitingDots size="sm" />
          </span>
        </span>
        {detail && (
          <span className="truncate max-w-[9rem] text-sky-600/90 dark:text-sky-200/90" title={detail}>
            {detail}
          </span>
        )}
        {elapsedLabel && (
          <span className="text-[10px] tabular-nums opacity-75 shrink-0">{elapsedLabel}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 min-w-[10rem]">
      <div className="inline-flex items-center gap-2 text-muted-foreground">
        <span className="relative flex h-5 w-5 items-center justify-center shrink-0">
          <span className="absolute inset-0 rounded-full bg-brand-400/25 animate-ping" />
          <Sparkles size={12} className="relative text-primary animate-pulse" />
        </span>
        <span className="text-[11.5px] font-medium text-foreground">{title}</span>
        {elapsedLabel && (
          <span className="text-[10px] text-muted-foreground tabular-nums">{elapsedLabel}</span>
        )}
      </div>
      {detail && (
        <div className="pl-7 text-[10.5px] text-muted-foreground leading-relaxed">
          当前：<span className="text-muted-foreground font-medium">{detail}</span>
        </div>
      )}
      <div className="pl-7 text-primary dark:text-brand-400">
        <WavyWaitingDots />
      </div>
    </div>
  );
}
