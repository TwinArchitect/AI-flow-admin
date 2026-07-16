import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Ban, CheckCircle2, Loader2, Maximize2, Play, Settings, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { NODE_DEF_MAP, NODE_FALLBACK_ICON, NODE_ICON_MAP } from '../config/nodeDefs';
import type { WorkflowCanvasNode } from '../types';

export function WorkflowNode({ data, selected }: NodeProps<WorkflowCanvasNode>) {
  const [detailOpen, setDetailOpen] = useState(false);
  const def = NODE_DEF_MAP[data.nodeType];
  const Icon = NODE_ICON_MAP[data.nodeType] ?? NODE_FALLBACK_ICON;
  const isStart = data.nodeType === 'start';
  const isEnd = data.nodeType === 'end';
  const runStatus = data.runStatus ?? 'idle';
  const statusMeta = {
    idle: { label: '待运行', className: 'text-muted-foreground', icon: Play },
    running: { label: '运行中', className: 'text-primary', icon: Loader2 },
    success: { label: '成功', className: 'text-success', icon: CheckCircle2 },
    error: { label: '失败', className: 'text-destructive', icon: XCircle },
    skipped: { label: '已跳过', className: 'text-muted-foreground', icon: Ban },
  }[runStatus];
  const StatusIcon = statusMeta.icon;
  const hasExecutionDetails = Boolean(
    data.runMessage || data.runInputs || data.runOutputs || data.runDurationMs != null,
  );

  return (
    <div
      className={cn(
        'w-[220px] select-none overflow-hidden rounded-lg border bg-card shadow-sm transition-all',
        selected ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border hover:border-border/80',
        runStatus === 'running' && 'border-primary shadow-md ring-2 ring-primary/25',
        runStatus === 'success' && 'border-success/70',
        runStatus === 'error' && 'border-destructive/70',
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-md', def.iconTone)}>
          <Icon size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{data.label}</div>
          <div className="truncate text-[10px] text-foreground/55">{def.category}</div>
        </div>
        <Settings size={13} className="text-foreground/55" />
      </div>

      <div className="space-y-3 px-3 py-3">
        <p className="line-clamp-2 min-h-8 text-xs leading-relaxed text-foreground/65">
          {data.description}
        </p>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={cn('text-[10px]', def.tone)}>
            {data.nodeType}
          </Badge>
          <span className={cn('inline-flex items-center gap-1 text-[10px]', statusMeta.className)}>
            <StatusIcon size={10} className={cn(runStatus === 'running' && 'animate-spin')} />
            {statusMeta.label}
          </span>
        </div>
        {data.runMessage && (
          <div className="flex items-center justify-between gap-2 rounded bg-muted/80 px-2 py-1 text-[10px] text-foreground/65">
            <span className="truncate">{data.runMessage}</span>
            {data.runDurationMs != null && (
              <span className="shrink-0 tabular-nums">
                {data.runDurationMs >= 1000
                  ? `${(data.runDurationMs / 1000).toFixed(1)}s`
                  : `${Math.round(data.runDurationMs)}ms`}
              </span>
            )}
            {hasExecutionDetails && runStatus !== 'running' && (
              <button
                type="button"
                className="nodrag shrink-0 rounded p-0.5 hover:bg-background hover:text-foreground"
                onClick={(event) => {
                  event.stopPropagation();
                  setDetailOpen(true);
                }}
                aria-label="查看运行详情"
              >
                <Maximize2 size={11} />
              </button>
            )}
          </div>
        )}
      </div>

      {!isStart && (
        <Handle
          type="target"
          position={Position.Left}
          className="!size-3 !border-2 !border-muted-foreground !bg-background"
        />
      )}
      {!isEnd && (
        <Handle
          type="source"
          position={Position.Right}
          className="!size-3 !border-2 !border-primary !bg-background"
        />
      )}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{data.label} · 运行详情</DialogTitle>
            <DialogDescription>
              {statusMeta.label}
              {data.runDurationMs != null ? ` · ${Math.round(data.runDurationMs)}ms` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto text-xs">
            {data.runMessage && (
              <section>
                <div className="mb-1 font-medium text-foreground">执行日志</div>
                <p className="rounded-md bg-muted p-3 text-muted-foreground">{data.runMessage}</p>
              </section>
            )}
            {data.runInputs && (
              <section>
                <div className="mb-1 font-medium text-foreground">输入</div>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-muted-foreground">
                  {JSON.stringify(data.runInputs, null, 2)}
                </pre>
              </section>
            )}
            {data.runOutputs && (
              <section>
                <div className="mb-1 font-medium text-foreground">输出</div>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-muted-foreground">
                  {JSON.stringify(data.runOutputs, null, 2)}
                </pre>
              </section>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
