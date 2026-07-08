import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { CheckCircle2, Loader2, Play, Settings, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NODE_DEF_MAP, NODE_FALLBACK_ICON, NODE_ICON_MAP } from '../config/nodeDefs';
import type { WorkflowCanvasNode } from '../types';

export function WorkflowNode({ data, selected }: NodeProps<WorkflowCanvasNode>) {
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
  }[runStatus];
  const StatusIcon = statusMeta.icon;

  return (
    <div
      className={cn(
        'w-[220px] select-none overflow-hidden rounded-lg border bg-card shadow-sm transition-all',
        selected ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border hover:border-border/80',
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-md', def.iconTone)}>
          <Icon size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{data.label}</div>
          <div className="truncate text-[10px] text-muted-foreground">{def.category}</div>
        </div>
        <Settings size={13} className="text-muted-foreground" />
      </div>

      <div className="space-y-3 px-3 py-3">
        <p className="line-clamp-2 min-h-8 text-xs leading-relaxed text-muted-foreground">
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
          <div className="truncate rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">
            {data.runMessage}
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
    </div>
  );
}
