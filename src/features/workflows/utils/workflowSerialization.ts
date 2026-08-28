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

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const modules = nodes
      .map((node) => serializeWorkflowNode(node))
      .filter((module): module is WorkflowModule => Boolean(module))
      .map((module) => {
        const node = nodeMap.get(module.nodeId);
        if (!node) return module;
        const parent = node.parentId ? nodeMap.get(node.parentId) : undefined;
        const position = parent
          ? { x: parent.position.x + node.position.x, y: parent.position.y + node.position.y }
          : node.position;
        const next = { ...module, position, ...(node.parentId ? { parentNodeId: node.parentId } : {}) };
        if (node.data.nodeType === 'loop') {
          const children = nodes.filter((item) => item.parentId === node.id).map((item) => item.id);
          next.inputs = next.inputs.map((input) => input.key === 'childrenNodeIdList' ? { ...input, value: children } : input);
        }
        return next;
      });

  return {
    modules,
    edges: edges.map(serializeEdgeHandles),
    chatConfig: { variables },
  };
}

export function parseWorkflowFromBackend(payload: WorkflowBackendPayload) {
  const context = { variables: payload.chatConfig?.variables ?? [] };
  const modules = payload.modules ?? [];
  const moduleMap = new Map(modules.map((module) => [module.nodeId, module]));
  const parsed = modules
    .map((module) => getNodeModuleByBackendType(module.flowNodeType)?.parse?.(module, context) ?? null)
    .filter((node): node is WorkflowCanvasNode => Boolean(node))
    .map((node) => {
      const module = moduleMap.get(node.id);
      const parent = module?.parentNodeId ? moduleMap.get(module.parentNodeId) : undefined;
      if (!module?.parentNodeId || !parent) return node;
      return {
        ...node,
        parentId: module.parentNodeId,
        position: { x: node.position.x - parent.position.x, y: node.position.y - parent.position.y },
        zIndex: 1,
      };
    });
  return {
    nodes: parsed.sort((a, b) => Number(Boolean(a.parentId)) - Number(Boolean(b.parentId))),
    edges: payload.edges.map(normalizeEdgeForCanvas),
  };
}
