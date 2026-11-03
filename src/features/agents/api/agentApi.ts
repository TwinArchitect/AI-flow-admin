import { authFetch } from '@/lib/authSession';
import { http } from '@/api/client';
import type {
  AgentOpenPublish,
  AgentOpenSysAgent,
  AgentPageResult,
  AgentQueryParams,
} from '@/types/agent';

const AGENT_API_BASE = '/gpt/base/agent';

export function getAgentFileUpload(id: string) {
  return http.get<import('../overview/agentFileUpload').AgentFileUploadCapability>(`${AGENT_API_BASE}/fileUpload/${encodeURIComponent(id)}`)
    .then((response) => response.data);
}

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

export function getAgentSetting(id: string) {
  return http
    .get<AgentOpenSysAgent>(`${AGENT_API_BASE}/getSetting/${encodeURIComponent(id)}`)
    .then((response) => response.data);
}

export function saveAgent(payload: Partial<AgentOpenSysAgent>) {
  return http
    .post<AgentOpenSysAgent>(`${AGENT_API_BASE}/save`, payload)
    .then((response) => response.data);
}

export function updateAgent(payload: Partial<AgentOpenSysAgent> & Pick<AgentOpenSysAgent, 'id'>) {
  return http
    .post<AgentOpenSysAgent>(`${AGENT_API_BASE}/update`, payload)
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

export function queryAgentPublishHistory(agentId: string) {
  return http
    .get<AgentOpenPublish[]>(`${AGENT_API_BASE}/queryPublishHistory/${encodeURIComponent(agentId)}`)
    .then((response) => response.data);
}

export function rollbackAgent(agentId: string, publishId: string) {
  const query = new URLSearchParams({ publishId });
  return http
    .post<AgentOpenSysAgent>(`${AGENT_API_BASE}/rollback/${encodeURIComponent(agentId)}?${query.toString()}`)
    .then((response) => response.data);
}

export function deleteAgent(agentId: string) {
  return http.post<unknown>(`${AGENT_API_BASE}/deleteBatch`, [agentId]);
}

export function isWorkflowAgent(agent: AgentOpenSysAgent) {
  return agent.flowType !== 0;
}

type PromptOptimizeScene = 'system_prompt_optimize' | 'user_prompt_optimize' | 'code_optimize' | 'persona_optimize' | 'opening_optimize' | 'intro_optimize';

interface AgentAiAssistResult {
  text?: string | null;
}

export async function optimizeWorkflowPrompt(params: {
  scene: PromptOptimizeScene;
  content?: string;
  hint?: string;
  agentId?: string;
  agentName?: string;
  intro?: string;
  persona?: string;
  opening?: string;
  codeLanguage?: string;
  inputParams?: string;
  outputHint?: string;
}) {
  const result = await http.post<AgentAiAssistResult>(`${AGENT_API_BASE}/aiAssist`, {
    scene: params.scene,
    agentId: params.agentId?.trim() || undefined,
    context: {
      content: params.content?.trim() || undefined,
      hint: params.hint?.trim() || undefined,
      agentName: params.agentName?.trim() || undefined,
      intro: params.intro?.trim() || undefined,
      persona: params.persona?.trim() || undefined,
      opening: params.opening?.trim() || undefined,
      codeLanguage: params.codeLanguage?.trim() || undefined,
      inputParams: params.inputParams?.trim() || undefined,
      outputHint: params.outputHint?.trim() || undefined,
    },
    options: { language: 'zh-CN' },
  }).then((response) => response.data);
  const text = result.text?.trim();
  if (!text) throw new Error('AI 未返回优化结果，请重试');
  return text;
}

/** 与参照项目一致，导出服务端已保存的 YAML DSL。 */
export async function exportAgentConfig(id: string, fallbackName = 'agent') {
  const response = await authFetch(`${AGENT_API_BASE}/exportConfig/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error((await response.text()).trim() || `导出失败（HTTP ${response.status}）`);
  const disposition = response.headers.get('Content-Disposition');
  const utf8 = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  let filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1]?.trim() || `${fallbackName}-${id}.yml`;
  if (utf8) { try { filename = decodeURIComponent(utf8.trim()); } catch { filename = utf8.trim(); } }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

export function importAgentConfig(id: string, file: File) {
  const data = new FormData();
  data.append('file', file);
  return http.post<AgentOpenSysAgent>(`${AGENT_API_BASE}/importConfig/${encodeURIComponent(id)}`, data, { timeout: 0, headers: { 'Content-Type': undefined } }).then((response) => response.data);
}

export async function generateOpeningQuestions(params: { agentId: string; agentName: string; intro: string; persona: string; opening: string }): Promise<string[]> {
  const { agentId, ...context } = params;
  const response = await http.post<{ list?: string[] | null }>(`${AGENT_API_BASE}/aiAssist`, {
    scene: 'opening_questions', agentId,
    context: Object.fromEntries(Object.entries(context).map(([key, value]) => [key, value.trim() || undefined])),
    options: { count: 3, language: 'zh-CN' },
  });
  return Array.isArray(response.data.list) ? response.data.list.map(String) : [];
}
