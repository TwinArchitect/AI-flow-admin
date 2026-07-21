import { Copy, Loader2 } from 'lucide-react';
import type { NodeExecutionDetailsProps } from '../../nodes/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DebugJsonSection } from './DebugJsonTree';

const STATUS_META = {
  idle: { label: '待运行', variant: 'outline' as const },
  running: { label: '运行中', variant: 'default' as const },
  success: { label: '运行成功', variant: 'secondary' as const },
  error: { label: '运行失败', variant: 'destructive' as const },
  cancelled: { label: '已中断', variant: 'outline' as const },
  skipped: { label: '已跳过', variant: 'outline' as const },
};

function formatDuration(durationMs?: number): string | null {
  if (durationMs == null || Number.isNaN(durationMs)) return null;
  return durationMs >= 1000
    ? `${(durationMs / 1000).toFixed(3)}s`
    : `${Math.round(durationMs)}ms`;
}

export function DefaultNodeExecutionDetails({ data, execution }: NodeExecutionDetailsProps) {
  const status = execution?.status ?? 'idle';
  const statusMeta = STATUS_META[status];
  const duration = formatDuration(execution?.durationMs);
  const copyPayload = {
    nodeType: data.nodeType,
    status,
    statusCode: execution?.statusCode,
    durationMs: execution?.durationMs,
    summary: execution?.summaryLog,
    inputs: execution?.debugInputs,
    outputs: execution?.debugOutputs,
    error: execution?.debugError,
    logs: execution?.executionLogs,
  };

  return (
    <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1 text-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusMeta.variant}>
            {status === 'running' && <Loader2 size={11} className="mr-1 animate-spin" />}
            {statusMeta.label}
          </Badge>
          {execution?.flowNodeType && (
            <Badge variant="secondary">{execution.flowNodeType}</Badge>
          )}
          {execution?.statusCode != null && (
            <Badge variant="outline">状态码 {execution.statusCode}</Badge>
          )}
          {duration && <Badge variant="outline">耗时 {duration}</Badge>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void navigator.clipboard.writeText(JSON.stringify(copyPayload, null, 2))}
        >
          <Copy size={13} />
          复制全部
        </Button>
      </div>
      {status === 'running' && !execution?.debugInputs && !execution?.debugOutputs && (
        <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-primary">
          <Loader2 size={14} className="shrink-0 animate-spin" />
          <p>节点正在执行，输入和输出将在后端节点完成事件到达后显示。</p>
        </div>
      )}
      {execution?.summaryLog && (
        <p className="break-all rounded-md bg-muted/60 p-3 leading-relaxed text-muted-foreground">
          {execution.summaryLog}
        </p>
      )}
      <DebugJsonSection title="输入" data={execution?.debugInputs} />
      <DebugJsonSection title="输出" data={execution?.debugOutputs} />
      {execution?.executionLogs?.length ? (
        <section>
          <div className="mb-1.5 font-medium text-foreground">执行日志</div>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-muted-foreground">
            {execution.executionLogs.map((log, index) => (
              <p key={`${index}-${log}`} className="break-all">{log}</p>
            ))}
          </div>
        </section>
      ) : null}
      {execution?.debugError && (
        <section>
          <div className="mb-1 font-medium text-destructive">错误</div>
          <p className="rounded-md bg-destructive/10 p-3 text-destructive">{execution.debugError}</p>
        </section>
      )}
      {status !== 'running'
        && !execution?.summaryLog
        && !execution?.debugInputs
        && !execution?.debugOutputs
        && !execution?.executionLogs?.length
        && !execution?.debugError && (
          <p className="py-8 text-center text-muted-foreground">暂无节点执行明细</p>
        )}
    </div>
  );
}
