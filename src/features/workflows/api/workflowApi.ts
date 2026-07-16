import type {
  WorkflowBackendPayload,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
} from '../types';
import { http } from '@/api/client';
import { serializeWorkflowToBackend } from '../utils/workflowSerialization';

export interface SaveWorkflowConfigRequest {
  agentId?: string;
  agentName: string;
  remark?: string;
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
  viewport?: { x: number; y: number; zoom: number };
}

export interface SaveWorkflowConfigResult {
  agentId: string;
  agentName: string;
  remark?: string;
  agentSetting: string;
  payload: WorkflowBackendPayload;
  viewport?: { x: number; y: number; zoom: number };
}

export interface WorkflowAgent {
  id: string;
  agentName: string;
  remark?: string;
  agentSetting?: unknown;
}

export interface ParsedAgentSetting {
  payload: WorkflowBackendPayload;
  viewport?: { x: number; y: number; zoom: number };
}

export async function getWorkflowAgent(agentId: string) {
  return http
    .get<WorkflowAgent>(`/gpt/base/agent/getSetting/${agentId}`)
    .then((response) => response.data);
}

export async function deleteWorkflowAgent(agentId: string) {
  await http.post('/gpt/base/agent/deleteBatch', [agentId]);
}

export function parseAgentSetting(agentSetting: unknown): ParsedAgentSetting | null {
  let value = agentSetting;
  for (let index = 0; index < 2 && typeof value === 'string'; index += 1) {
    if (!value.trim()) return null;
    value = JSON.parse(value) as unknown;
  }
  if (!value || typeof value !== 'object') return null;
  const setting = value as Partial<WorkflowBackendPayload> & { viewport?: ParsedAgentSetting['viewport'] };
  if (!Array.isArray(setting.modules) || !Array.isArray(setting.edges)) return null;
  return {
    payload: {
      modules: setting.modules,
      edges: setting.edges,
      chatConfig: setting.chatConfig ?? { variables: [] },
    },
    viewport: setting.viewport,
  };
}

export function buildAgentSettingString(
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
  viewport?: { x: number; y: number; zoom: number },
) {
  const payload = serializeWorkflowToBackend(nodes, edges);
  return JSON.stringify(
    {
      ...payload,
      ...(viewport ? { viewport } : {}),
    },
    null,
    2,
  );
}

export async function saveWorkflowConfig(
  request: SaveWorkflowConfigRequest,
): Promise<SaveWorkflowConfigResult> {
  const payload = serializeWorkflowToBackend(request.nodes, request.edges);
  const agentSetting = buildAgentSettingString(request.nodes, request.edges, request.viewport);
  const response = await http.post<WorkflowAgent>(
    request.agentId ? '/gpt/base/agent/update' : '/gpt/base/agent/save',
    {
    ...(request.agentId ? { id: request.agentId } : {}),
    agentName: request.agentName,
    remark: request.remark,
    agentSetting,
    flowType: 1,
  });
  const savedAgent = response.data;

  return {
    agentId: savedAgent.id ?? request.agentId ?? '',
    agentName: request.agentName,
    remark: request.remark,
    agentSetting,
    payload,
    viewport: request.viewport,
  };
}
