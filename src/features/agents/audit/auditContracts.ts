interface PageResult<T> {
  records: T[];
  total: number;
  current?: number;
  size?: number;
}

/** 审核单状态：0 待审 / 1 通过 / 2 驳回 / 3 撤回 */
export type AgentAuditStatus = 0 | 1 | 2 | 3;

/** 广场状态：0 未上架 / 1 审核中 / 2 已上架 / 3 驳回 / 4 已下架 */
export type AgentSquareStatus = 0 | 1 | 2 | 3 | 4;

export type AgentOpenAgentAudit = {
  id: string;
  agentId: string;
  agentName?: string;
  headImg?: string;
  flowType?: number;
  /** 智能体简介 */
  remark?: string;
  publishId?: string;
  /** 绑定发布版本号 */
  version?: number;
  publishVersion?: number;
  auditStatus?: number;
  squareLabelId?: string;
  squareLabelName?: string;
  /** 关联智能体当前广场状态，用于判断可否下架 */
  squareStatus?: number;
  applyRemark?: string;
  auditRemark?: string;
  applicant?: string;
  applicantName?: string;
  /** 申请人显示名 */
  creatorName?: string;
  auditor?: string;
  auditorName?: string;
  createTime?: string;
  auditTime?: string;
};

export type AgentAuditQueryParams = {
  pageNum?: number;
  pageSize?: number;
  auditStatus?: number;
  agentName?: string;
  agentId?: string;
  mineOnly?: boolean;
};

export type AgentAuditApprovePayload = {
  auditId: string;
  auditRemark?: string;
};

export type AgentAuditRejectPayload = {
  auditId: string;
  auditRemark: string;
};

export type AgentAuditPageResult = PageResult<AgentOpenAgentAudit>;

export const AGENT_AUDIT_STATUS_OPTIONS: { value: 'all' | AgentAuditStatus; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 0, label: '待审' },
  { value: 1, label: '通过' },
  { value: 2, label: '驳回' },
  { value: 3, label: '撤回' },
];

export function auditStatusLabel(status?: number) {
  const map: Record<number, string> = { 0: '待审', 1: '通过', 2: '驳回', 3: '撤回' };
  return map[status ?? -1] ?? '-';
}

/** 使用当前项目的语义颜色 token。 */
export function auditStatusVariant(status?: number) {
  if (status === 0) return 'warning';
  if (status === 1) return 'success';
  if (status === 2) return 'danger';
  return 'muted';
}

export function formatAuditTime(time?: string) {
  if (!time) return '-';
  const normalized = time.replace('T', ' ').trim();
  const [datePart, timePart = ''] = normalized.split(/\s+/);
  const segments = datePart.split('-');
  if (segments.length === 3) {
    const formattedDate = `${segments[0]}/${segments[1]}/${segments[2]}`;
    const formattedTime = timePart.slice(0, 5);
    return formattedTime ? `${formattedDate} ${formattedTime}` : formattedDate;
  }
  return normalized.slice(0, 16);
}

export function auditApplicantName(item: AgentOpenAgentAudit) {
  return item.creatorName || item.applicantName || item.applicant || '-';
}

export function auditAuditorName(item: AgentOpenAgentAudit) {
  return item.auditorName || item.auditor || '-';
}

export function auditPublishVersionLabel(item: AgentOpenAgentAudit) {
  const version = item.publishVersion ?? item.version;
  if (version != null) return `v${version}`;
  if (item.publishId) return item.publishId;
  return '-';
}

/** 已通过且仍在广场，可下架（无 squareStatus 时按已上架处理，由接口兜底） */
export function canOffShelfAudit(item: AgentOpenAgentAudit) {
  if (item.auditStatus !== 1 || !item.agentId) return false;
  if (item.squareStatus == null) return true;
  return item.squareStatus === 2;
}
