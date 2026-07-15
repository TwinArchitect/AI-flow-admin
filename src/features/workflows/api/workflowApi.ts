import type {
  WorkflowBackendPayload,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
} from '../types';
import { http } from '@/api/client';
import { serializeWorkflowToBackend } from '../utils/workflowSerialization';

export interface SaveWorkflowConfigRequest {
  agentId: string;
  agentName: string;
  remark?: string;
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
}

export interface SaveWorkflowConfigResult {
  agentId: string;
  agentName: string;
  remark?: string;
  agentSetting: string;
  payload: WorkflowBackendPayload;
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
  const agentSetting = buildAgentSettingString(request.nodes, request.edges);

  await http.post('/gpt/base/agent/update', {
    id: request.agentId,
    agentName: request.agentName,
    remark: request.remark,
    agentSetting,
  });

  return {
    agentId: request.agentId,
    agentName: request.agentName,
    remark: request.remark,
    agentSetting,
    payload,
  };
}
