import type {
  WorkflowBackendPayload,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
} from '../types';
import {
  executeWorkflowMock,
  type WorkflowRunEvent,
  type WorkflowRunResult,
} from '../utils/workflowExecution';

export interface WorkflowRunRequest {
  appId: string;
  chatId?: string;
  chatGroupId?: string;
  message: Array<{ role: string; content: string }>;
  variables?: Record<string, unknown>;
  debug?: boolean;
}

export interface RunWorkflowStreamRequest {
  request: WorkflowRunRequest;
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
  payload: WorkflowBackendPayload;
  onNodeEvent: (event: WorkflowRunEvent) => void;
}

export async function runWorkflowStream({
  request,
  nodes,
  edges,
  payload,
  onNodeEvent,
}: RunWorkflowStreamRequest): Promise<WorkflowRunResult> {
  // TODO: Replace with POST /gpt/base/workflows/run SSE when backend details are ready.
  console.log('工作流运行适配器 Request:', request);
  return executeWorkflowMock(nodes, edges, payload, onNodeEvent);
}
