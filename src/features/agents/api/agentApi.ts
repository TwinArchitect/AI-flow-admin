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

type PromptOptimizeScene = 'system_prompt_optimize' | 'user_prompt_optimize' | 'code_optimize';

interface AgentAiAssistResult {
  text?: string | null;
}

export async function optimizeWorkflowPrompt(params: {
  scene: PromptOptimizeScene;
  content?: string;
  hint?: string;
  agentId?: string;
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
