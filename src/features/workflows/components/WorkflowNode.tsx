import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import {
  Ban,
  CheckCircle2,
  CircleSlash2,
  Loader2,
  Maximize2,
  Play,
  Settings,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getNodeModule } from '../nodes/registry';
import { useNodeExecution } from '../context/WorkflowExecutionContext';
import { useWorkflowCanvasStore } from '../store/useWorkflowCanvasStore';
import { buildErrorCatchHandle, buildSourceHandle, buildTargetHandle } from '../utils/edgeHandles';
import type { WorkflowCanvasNode } from '../types';
import { JsonViewDialog } from './JsonViewDialog';

export function WorkflowNode({ id, data, selected }: NodeProps<WorkflowCanvasNode>) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const node = useWorkflowCanvasStore((state) => state.nodes.find((item) => item.id === id));
  const module = getNodeModule(data.nodeType);
  const def = module.definition;
  const Icon = module.icon;
  const ExecutionDetails = module.ExecutionDetails;
  const execution = useNodeExecution(id);
  const catchError = Boolean((data.config as { catchError?: boolean }).catchError);
  const runStatus = execution?.status ?? 'idle';
  const statusMeta = {
    idle: { label: '待运行', className: 'text-muted-foreground', icon: Play },
    running: { label: '运行中', className: 'text-primary', icon: Loader2 },
    success: { label: '成功', className: 'text-success', icon: CheckCircle2 },
    error: { label: '失败', className: 'text-destructive', icon: XCircle },
    cancelled: { label: '已中断', className: 'text-warning', icon: Ban },
    skipped: { label: '已跳过', className: 'text-muted-foreground', icon: CircleSlash2 },
  }[runStatus];
  const StatusIcon = statusMeta.icon;
  const canOpenExecutionDetails = Boolean(execution && execution.status !== 'idle');
  const nodeJson = node ? module.serialize?.(node) ?? node : { id, data };

  return (
    <div
      className={cn(
        'select-none overflow-hidden rounded-lg border bg-card shadow-sm transition-all',
        catchError ? 'w-[260px]' : 'w-[220px]',
        selected ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border hover:border-border/80',
        runStatus === 'running' && 'border-primary shadow-md ring-2 ring-primary/25',
        runStatus === 'success' && 'border-success/70',
        runStatus === 'error' && 'border-destructive/70',
        runStatus === 'cancelled' && 'border-warning/70',
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
        <button
          type="button"
          className="nodrag rounded p-1 text-foreground/55 hover:bg-muted hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation();
            setJsonOpen(true);
          }}
          aria-label={`查看${data.label}节点 JSON 配置`}
        >
          <Settings size={13} />
        </button>
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
        {execution && execution.status !== 'idle' && (
          <div className="flex items-center justify-between gap-2 rounded bg-muted/80 px-2 py-1 text-[10px] text-foreground/65">
            <span className="truncate">{execution.summaryLog || statusMeta.label}</span>
            {execution.durationMs != null && (
              <span className="shrink-0 tabular-nums">
                {execution.durationMs >= 1000
                  ? `${(execution.durationMs / 1000).toFixed(1)}s`
                  : `${Math.round(execution.durationMs)}ms`}
              </span>
            )}
            {canOpenExecutionDetails && (
              <button
                type="button"
                className="nodrag shrink-0 rounded p-0.5 hover:bg-background hover:text-foreground"
                onClick={(event) => {
                  event.stopPropagation();
                  setDetailOpen(true);
                }}
                aria-label={`查看${data.label}节点运行详情`}
              >
                <Maximize2 size={11} />
              </button>
            )}
          </div>
        )}
        {catchError && (
          <div className="space-y-1.5 border-t border-border pt-2 text-[10px]">
            <div className="flex items-center justify-between rounded bg-primary/5 px-2 py-1.5">
              <span className="text-muted-foreground">请求成功时</span>
              <span className="font-medium text-primary">成功分支</span>
            </div>
            <div className="flex items-center justify-between rounded bg-destructive/5 px-2 py-1.5">
              <span className="text-muted-foreground">请求异常时</span>
              <span className="font-medium text-destructive">异常分支</span>
            </div>
          </div>
        )}
      </div>

      {module.connection.allowIncoming && (
        <Handle
          id={buildTargetHandle(id)}
          type="target"
          position={Position.Left}
          className="!size-3 !border-2 !border-muted-foreground !bg-background"
        />
      )}
      {module.connection.allowOutgoing && (
        <Handle
          id={buildSourceHandle(id)}
          type="source"
          position={Position.Right}
          className="!size-3 !border-2 !border-primary !bg-background"
          style={catchError ? { top: '76%' } : undefined}
        />
      )}
      {module.connection.allowOutgoing && catchError && (
        <Handle
          id={buildErrorCatchHandle(id)}
          type="source"
          position={Position.Right}
          className="!size-3 !border-2 !border-destructive !bg-background"
          style={{ top: '91%' }}
        />
      )}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{data.label} · 运行详情</DialogTitle>
            <DialogDescription>
              {statusMeta.label}
              {execution?.durationMs != null ? ` · ${Math.round(execution.durationMs)}ms` : ''}
            </DialogDescription>
          </DialogHeader>
          <ExecutionDetails data={data} execution={execution} />
        </DialogContent>
      </Dialog>
      <JsonViewDialog
        open={jsonOpen}
        onOpenChange={setJsonOpen}
        title="节点 JSON 配置"
        description={`nodeId: ${id} · 后端 Module 协议`}
        value={nodeJson}
      />
    </div>
  );
}
