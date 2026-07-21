import { getNodeModule, getNodeModuleByBackendType } from '../nodes/registry';
import { normalizeEdgeForCanvas, serializeEdgeHandles } from './edgeHandles';
import type {
  WorkflowBackendPayload,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
  WorkflowModule,
} from '../types';

export function serializeWorkflowNode(node: WorkflowCanvasNode): WorkflowModule | null {
  return getNodeModule(node.data.nodeType).serialize?.(node) ?? null;
}

export function serializeWorkflowToBackend(
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
): WorkflowBackendPayload {
  const variableOwner = nodes.find((node) =>
    Boolean(getNodeModule(node.data.nodeType).serializeChatVariables),
  );
  const variables = variableOwner
    ? getNodeModule(variableOwner.data.nodeType).serializeChatVariables?.(variableOwner) ?? []
    : [];

  return {
    modules: nodes
      .map((node) => serializeWorkflowNode(node))
      .filter((module): module is WorkflowModule => Boolean(module)),
    edges: edges.map(serializeEdgeHandles),
    chatConfig: { variables },
  };
}

export function parseWorkflowFromBackend(payload: WorkflowBackendPayload) {
  const context = { variables: payload.chatConfig?.variables ?? [] };
  return {
    nodes: payload.modules
      .map((module) => getNodeModuleByBackendType(module.flowNodeType)?.parse?.(module, context) ?? null)
      .filter((node): node is WorkflowCanvasNode => Boolean(node)),
    edges: payload.edges.map(normalizeEdgeForCanvas),
  };
}
