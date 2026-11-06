import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ClipboardCheck, Eye, RefreshCw, Search, Undo2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { SquareAvatar } from '../agent-plaza/SquareAvatar';
import { getSquareLabels } from '../agent-plaza/squareApi';
import { approveAgentAudit, offShelfAgent, queryAgentAudits, rejectAgentAudit } from './auditApi';
import {
  AGENT_AUDIT_STATUS_OPTIONS,
  auditApplicantName,
  auditAuditorName,
  auditStatusLabel,
  auditStatusVariant,
  canOffShelfAudit,
  formatAuditTime,
  type AgentAuditStatus,
  type AgentOpenAgentAudit,
} from './auditContracts';
import {
  AgentAuditActionDialog,
  AgentAuditDetailDialog,
  type AuditActionTarget,
} from './AgentAuditDialogs';

const PAGE_SIZE = 20;

export function AgentAuditPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'all' | AgentAuditStatus>(0);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<AuditActionTarget | null>(null);
  const [detail, setDetail] = useState<AgentOpenAgentAudit | null>(null);
  const labelsQuery = useQuery({
    queryKey: ['square-labels'],
    queryFn: ({ signal }) => getSquareLabels(signal),
    retry: false,
  });
  const auditsQuery = useQuery({
    queryKey: ['agent-audits', page, status, appliedSearch],
    queryFn: ({ signal }) =>
      queryAgentAudits(
        {
          pageNum: page,
          pageSize: PAGE_SIZE,
          auditStatus: status === 'all' ? undefined : status,
          agentName: appliedSearch || undefined,
        },
        signal
      ),
    placeholderData: keepPreviousData,
    retry: false,
  });
  const records = auditsQuery.data?.records ?? [];
  const total = auditsQuery.data?.total ?? 0;
  const resolveLabel = (item: AgentOpenAgentAudit) =>
    item.squareLabelName ||
    labelsQuery.data?.find((label) => label.id === item.squareLabelId)?.name ||
    item.squareLabelId ||
    '-';
  const actionMutation = useMutation({
    mutationFn: async ({ target, remark }: { target: AuditActionTarget; remark: string }) => {
      if (target.kind === 'offShelf') return offShelfAgent(target.item.agentId);
      if (target.kind === 'reject') {
        if (!remark.trim()) throw new Error('请填写驳回原因');
        return rejectAgentAudit({ auditId: target.item.id, auditRemark: remark.trim() });
      }
      return approveAgentAudit({
        auditId: target.item.id,
        auditRemark: remark.trim() || undefined,
      });
    },
    onSuccess: async (_result, { target }) => {
      toast.success(
        target.kind === 'offShelf'
          ? `已下架「${target.item.agentName || '智能体'}」`
          : target.kind === 'reject'
            ? '已驳回上架申请'
            : '已通过上架申请'
      );
      setAction(null);
      setDetail(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['agent-audits'] }),
        queryClient.invalidateQueries({ queryKey: ['square-agents'] }),
        queryClient.invalidateQueries({ queryKey: ['agents', 'mine'] }),
      ]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '操作失败'),
  });
  const busy = actionMutation.isPending;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <header className="flex shrink-0 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary-text">
            <ClipboardCheck size={21} />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">智能体审核</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              审核同租户上架申请，并可对已上架智能体执行下架操作
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={busy || auditsQuery.isFetching}
          onClick={() => void auditsQuery.refetch()}
        >
          <RefreshCw size={14} />
          刷新
        </Button>
      </header>

      <section
        aria-label="审核筛选"
        className="flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
      >
        <div className="flex flex-wrap items-center gap-2" aria-label="审核状态">
          {AGENT_AUDIT_STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={status === option.value ? 'default' : 'ghost'}
              aria-pressed={status === option.value}
              disabled={busy}
              onClick={() => {
                setStatus(option.value);
                setPage(1);
              }}
            >
              {option.label}
            </Button>
          ))}
          {(appliedSearch || status !== 0) && (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                setSearch('');
                setAppliedSearch('');
                setStatus(0);
                setPage(1);
              }}
            >
              <Undo2 size={13} />
              重置
            </Button>
          )}
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const next = search.trim();
            if (next === appliedSearch && page === 1) void auditsQuery.refetch();
            setAppliedSearch(next);
            setPage(1);
          }}
        >
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="搜索智能体名称…"
              aria-label="搜索智能体名称"
              value={search}
              disabled={busy}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 w-52 pl-9"
            />
          </div>
          <Button type="submit" size="sm" disabled={busy}>
            查询
          </Button>
        </form>
      </section>

      <section
        aria-label="审核列表"
        aria-busy={auditsQuery.isFetching}
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card"
      >
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-hidden',
            auditsQuery.isFetching && !auditsQuery.isPending && 'opacity-60'
          )}
        >
          {auditsQuery.isPending ? (
            <div role="status" aria-label="加载审核列表" className="space-y-3 p-5">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : auditsQuery.isError ? (
            <div
              role="alert"
              className="flex min-h-64 flex-col items-center justify-center gap-3 px-5"
            >
              <p className="text-sm text-destructive">
                {auditsQuery.error.message || '加载审核列表失败'}
              </p>
              <Button variant="outline" size="sm" onClick={() => void auditsQuery.refetch()}>
                重新加载
              </Button>
            </div>
          ) : records.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center">
              <ClipboardCheck size={28} className="mb-2 text-muted-foreground/50" />
              <h2 className="text-sm font-semibold">暂无匹配的审核单</h2>
              <p className="text-xs text-muted-foreground">可切换审核状态或调整关键词后重试</p>
            </div>
          ) : (
            <Table scrollable className="min-w-[1180px]">
              <TableHeader>
                <TableRow>
                  {[
                    '智能体',
                    '申请分类',
                    '申请人',
                    '申请时间',
                    '申请说明',
                    '审核状态',
                    '审核人',
                    '审核时间',
                    '审核意见',
                    '操作',
                  ].map((label) => (
                    <TableHead
                      key={label}
                      className={cn(
                        'whitespace-nowrap bg-muted/40 text-xs',
                        label === '操作' && 'text-right'
                      )}
                    >
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <SquareAvatar agent={item} />
                        <span
                          className="max-w-44 truncate text-xs font-medium"
                          title={item.agentName}
                        >
                          {item.agentName || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {resolveLabel(item)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {auditApplicantName(item)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {formatAuditTime(item.createTime)}
                    </TableCell>
                    <TableCell className="max-w-44 truncate text-xs" title={item.applyRemark}>
                      {item.applyRemark || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={auditStatusVariant(item.auditStatus)}>
                        {auditStatusLabel(item.auditStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {auditAuditorName(item)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {formatAuditTime(item.auditTime)}
                    </TableCell>
                    <TableCell className="max-w-40 truncate text-xs" title={item.auditRemark}>
                      {item.auditRemark || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="xs"
                          disabled={busy || auditsQuery.isFetching}
                          onClick={() => setDetail(item)}
                        >
                          <Eye size={13} />
                          详情
                        </Button>
                        {item.auditStatus === 0 && (
                          <>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-[var(--color-success)]"
                              disabled={busy || auditsQuery.isFetching}
                              onClick={() => setAction({ kind: 'approve', item })}
                            >
                              <CheckCircle2 size={13} />
                              通过
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-destructive"
                              disabled={busy || auditsQuery.isFetching}
                              onClick={() => setAction({ kind: 'reject', item })}
                            >
                              <XCircle size={13} />
                              驳回
                            </Button>
                          </>
                        )}
                        {canOffShelfAudit(item) && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-[var(--color-warning)]"
                            disabled={busy || auditsQuery.isFetching}
                            onClick={() => setAction({ kind: 'offShelf', item })}
                          >
                            下架
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          pageCount={Math.ceil(total / PAGE_SIZE)}
          total={total}
          onPageChange={setPage}
          disabled={auditsQuery.isFetching || auditsQuery.isError || busy}
          className="shrink-0 border-t border-border p-4"
        />
      </section>

      {action && (
        <AgentAuditActionDialog
          key={`${action.kind}-${action.item.id}`}
          target={action}
          pending={busy}
          onClose={() => setAction(null)}
          onConfirm={(remark) => {
            if (!busy) actionMutation.mutate({ target: action, remark });
          }}
        />
      )}
      {detail && (
        <AgentAuditDetailDialog
          item={detail}
          labelName={resolveLabel(detail)}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
