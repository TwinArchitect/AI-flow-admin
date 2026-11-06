import { http } from '@/api/client';
import type {
  AgentAuditApprovePayload,
  AgentAuditPageResult,
  AgentAuditQueryParams,
  AgentAuditRejectPayload,
  AgentOpenAgentAudit,
} from './auditContracts';

const BASE = '/gpt/base/agent';

export function queryAgentAudits(params: AgentAuditQueryParams, signal?: AbortSignal) {
  return http
    .post<AgentAuditPageResult>(`${BASE}/audit/query`, params, { signal })
    .then((response) => response.data);
}

export function approveAgentAudit(payload: AgentAuditApprovePayload) {
  return http
    .post<AgentOpenAgentAudit>(`${BASE}/audit/approve`, payload)
    .then((response) => response.data);
}

export function rejectAgentAudit(payload: AgentAuditRejectPayload) {
  return http
    .post<AgentOpenAgentAudit>(`${BASE}/audit/reject`, payload)
    .then((response) => response.data);
}

export function offShelfAgent(agentId: string) {
  return http
    .post<void>(`${BASE}/square/offShelf/${encodeURIComponent(agentId)}`)
    .then((response) => response.data);
}
