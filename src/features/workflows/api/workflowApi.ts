import type {
  WorkflowBackendPayload,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
} from '../types';
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

  // TODO: Replace with updateAgent({ id, agentName, remark, agentSetting }) when backend details are ready.
  console.log('工作流保存适配器 Payload:', {
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
