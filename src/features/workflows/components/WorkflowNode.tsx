import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Play, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NODE_DEF_MAP, NODE_FALLBACK_ICON, NODE_ICON_MAP } from '../config/nodeDefs';
import type { WorkflowCanvasNode } from '../types';

export function WorkflowNode({ data, selected }: NodeProps<WorkflowCanvasNode>) {
  const def = NODE_DEF_MAP[data.nodeType];
  const Icon = NODE_ICON_MAP[data.nodeType] ?? NODE_FALLBACK_ICON;
  const isStart = data.nodeType === 'start';
  const isEnd = data.nodeType === 'end';

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
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn('text-[10px]', def.tone)}>
            {data.nodeType}
          </Badge>
          {!isEnd && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Play size={10} />
              可执行
            </span>
          )}
        </div>
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
