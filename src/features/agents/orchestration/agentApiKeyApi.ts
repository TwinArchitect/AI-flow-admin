import { http } from '@/api/client';

export interface AgentApiKey { id: string; agentId: string; keyName?: string; keyPrefix?: string; status?: number; createTime?: string; lastUsedTime?: string; apiKey?: string }

const path = (agentId: string) => `/gpt/base/agent/${encodeURIComponent(agentId)}/api-keys`;
export const listAgentApiKeys = (agentId: string) => http.get<AgentApiKey[]>(path(agentId)).then((response) => response.data);
export const createAgentApiKey = (agentId: string, keyName?: string) => http.post<AgentApiKey>(path(agentId), { keyName: keyName?.trim() || undefined }).then((response) => response.data);
export const setAgentApiKeyEnabled = (agentId: string, keyId: string, enabled: boolean) => http.post<void>(`${path(agentId)}/${encodeURIComponent(keyId)}/${enabled ? 'enable' : 'disable'}`, {}).then((response) => response.data);
export const deleteAgentApiKey = (agentId: string, keyId: string) => http.post<void>(`${path(agentId)}/${encodeURIComponent(keyId)}`, {}).then((response) => response.data);
