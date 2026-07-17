export interface Agent {
  id: string;
  name: string;
  model: string;
  desc: string;
  tags: string[];
  iconType: string;
  iconBg: string;
  iconColor: string;
  calls: number;
  successRate: string;
  status: 'running' | 'paused' | 'error';
  updatedAt: string;
}

/** 原型 AgentOpenSysAgent — 后端智能体实体 */
export interface AgentOpenSysAgent {
  id: string;
  agentName: string;
  flowType?: number;
  headImg?: string;
  status?: number;
  type?: string;
  remark?: string;
  agentSetting?: unknown;
  userGuide?: string;
  tenantId?: string;
  creator?: string;
  createTime?: string;
  updateTime?: string;
  username?: string;
}

export interface AgentLabel {
  id: string;
  name: string;
}

export function agentStatusLabel(status?: number) {
  return status === 1 ? '已发布' : '未发布';
}

export function agentFlowTypeLabel(flowType?: number) {
  return flowType === 0 ? '对话式' : '工作流型';
}

export function formatAgentEditTime(time?: string) {
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

/** 解析 type 字段为标签 ID 数组 */
export function parseAgentTagIds(type?: string): string[] {
  if (!type) return [];
  try {
    const parsed = JSON.parse(type);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return type ? [type] : [];
  }
}

/** 将标签 ID 数组序列化为 type 字段 */
export function serializeAgentTagIds(ids: string[]): string {
  return JSON.stringify(ids);
}

export function resolveAgentTagNames(type: string | undefined, labels: AgentLabel[]): string[] {
  const ids = parseAgentTagIds(type);
  const labelMap = new Map(labels.map((l) => [l.id, l.name]));
  return ids.map((id) => labelMap.get(id) ?? id);
}
