import { Handle, NodeResizer, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Repeat2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNodeExecution } from '../context/WorkflowExecutionContext';
import { normalizeLoopConfig } from '../contracts/loopNodeContract';
import { buildSourceHandle, buildTargetHandle } from '../utils/edgeHandles';
import type { WorkflowCanvasNode } from '../types';

export function LoopContainerNode({ id, data, selected }: NodeProps<WorkflowCanvasNode>) {
  const config = normalizeLoopConfig(data.config);
  const execution = useNodeExecution(id);
  return (
    <div
      className={cn(
        'relative rounded-xl border-2 border-dashed bg-card/70 shadow-sm',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-primary/35',
        execution?.status === 'running' && 'border-primary ring-2 ring-primary/25',
        execution?.status === 'success' && 'border-success/70',
        execution?.status === 'error' && 'border-destructive/70',
      )}
      style={{ width: config.nodeWidth, height: config.nodeHeight, minWidth: 560, minHeight: 320 }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={560}
        minHeight={320}
        lineClassName="!border-primary/70"
        handleClassName="!size-3 !rounded-sm !border-2 !border-primary !bg-background"
      />
      <div className="flex h-12 items-center gap-2 rounded-t-xl border-b border-border bg-card px-3">
        <div className="flex size-7 items-center justify-center rounded-md bg-violet-500 text-white"><Repeat2 size={14} /></div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{data.label}</div>
          <div className="text-[10px] text-muted-foreground">数组循环</div>
        </div>
        <span className="rounded p-1 text-muted-foreground" aria-hidden="true">
          <Settings size={13} />
        </span>
      </div>
      <div className="pointer-events-none absolute inset-x-3 bottom-3 top-15 flex items-center justify-center rounded-lg border border-dashed border-primary/15 bg-primary/[0.025]">
        <span className="text-[10px] text-muted-foreground">拖入节点组成循环体</span>
      </div>
      <Handle id={buildTargetHandle(id)} type="target" position={Position.Left} className="!size-3 !border-2 !border-muted-foreground !bg-background" style={{ top: 24 }} />
      <Handle id={buildSourceHandle(id)} type="source" position={Position.Right} className="!size-3 !border-2 !border-primary !bg-background" style={{ top: 24 }} />
    </div>
  );
}
