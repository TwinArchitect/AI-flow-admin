import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SquareAvatar } from '../agent-plaza/SquareAvatar';
import {
  auditApplicantName,
  auditAuditorName,
  auditPublishVersionLabel,
  auditStatusLabel,
  auditStatusVariant,
  formatAuditTime,
  type AgentOpenAgentAudit,
} from './auditContracts';

export interface AuditActionTarget {
  kind: 'approve' | 'reject' | 'offShelf';
  item: AgentOpenAgentAudit;
}

export function AgentAuditActionDialog({
  target,
  pending,
  onClose,
  onConfirm,
}: {
  target: AuditActionTarget;
  pending: boolean;
  onClose: () => void;
  onConfirm: (remark: string) => void;
}) {
  const [remark, setRemark] = useState('');
  const reject = target.kind === 'reject';
  const offShelf = target.kind === 'offShelf';
  const title = offShelf ? '下架智能体' : reject ? '驳回上架申请' : '通过上架申请';
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent
        showCloseButton={!pending}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="break-words">
            智能体「{target.item.agentName || '未命名智能体'}」
            {offShelf
              ? '下架后将不再在智能体广场展示。'
              : reject
                ? '将被驳回，不会出现在广场。'
                : '通过后将出现在智能体广场。'}
          </DialogDescription>
        </DialogHeader>
        {!offShelf && (
          <div className="space-y-2">
            <Label htmlFor="audit-action-remark">
              {reject ? '驳回原因 *' : '审核意见（可选）'}
            </Label>
            <Textarea
              id="audit-action-remark"
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              maxLength={500}
              rows={4}
              disabled={pending}
              placeholder={reject ? '请说明驳回原因…' : '可填写通过意见，便于申请人查看…'}
              aria-required={reject}
            />
            <p className="text-right text-2xs text-muted-foreground">{remark.length}/500</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={onClose}>
            取消
          </Button>
          <Button
            variant={reject || offShelf ? 'destructive' : 'default'}
            disabled={pending || (reject && !remark.trim())}
            onClick={() => onConfirm(remark.trim())}
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            {offShelf ? '确认下架' : reject ? '确认驳回' : '确认通过'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AgentAuditDetailDialog({
  item,
  labelName,
  onClose,
}: {
  item: AgentOpenAgentAudit;
  labelName: string;
  onClose: () => void;
}) {
  const rows = [
    ['简介', item.remark || '暂无简介'],
    ['申请分类', labelName],
    ['申请说明', item.applyRemark || '无'],
    ['绑定发布版本', auditPublishVersionLabel(item)],
    ['申请人', auditApplicantName(item)],
    ['申请时间', formatAuditTime(item.createTime)],
    ['审核人', auditAuditorName(item)],
    ['审核时间', formatAuditTime(item.auditTime)],
    ['审核意见', item.auditRemark || '无'],
  ];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>审核申请详情</DialogTitle>
          <DialogDescription>{item.agentName || '未命名智能体'}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3">
          <SquareAvatar agent={item} />
          <Badge variant={auditStatusVariant(item.auditStatus)}>
            {auditStatusLabel(item.auditStatus)}
          </Badge>
        </div>
        <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[6rem_1fr] gap-3 p-3 text-xs">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="whitespace-pre-wrap break-words leading-5 text-foreground [overflow-wrap:anywhere]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
