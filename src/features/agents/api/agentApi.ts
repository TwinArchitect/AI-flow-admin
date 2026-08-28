import { http } from '@/api/client';
import type {
  AgentOpenPublish,
  AgentOpenSysAgent,
  AgentPageResult,
  AgentQueryParams,
} from '@/types/agent';

const AGENT_API_BASE = '/gpt/base/agent';

export function queryAgents(params: AgentQueryParams) {
  return http
    .post<AgentPageResult>(`${AGENT_API_BASE}/query`, {
      protal: 'false',
      ...params,
    })
    .then((response) => response.data);
}

export function getAgent(id: string) {
  return http
    .get<AgentOpenSysAgent>(`${AGENT_API_BASE}/get/${encodeURIComponent(id)}`)
    .then((response) => response.data);
}

export function publishAgent(agentId: string, publishRemark?: string) {
  const query = publishRemark?.trim()
    ? `?publishRemark=${encodeURIComponent(publishRemark.trim())}`
    : '';
  return http
    .post<AgentOpenPublish>(`${AGENT_API_BASE}/publish/${encodeURIComponent(agentId)}${query}`)
    .then((response) => response.data);
}

export function deleteAgent(agentId: string) {
  return http.post<unknown>(`${AGENT_API_BASE}/deleteBatch`, [agentId]);
}

export function isWorkflowAgent(agent: AgentOpenSysAgent) {
  return agent.flowType !== 0;
}
