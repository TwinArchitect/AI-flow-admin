import {
  normalizeStartConfig,
  parseStartModule,
  serializeStartNode,
  serializeStartVariables,
} from '../contracts/startNodeContract';
import { parseLlmModule, serializeLlmNode } from '../contracts/llmNodeContract';
import { parseEndModule, serializeEndNode } from '../contracts/endNodeContract';
import { FLOW_TYPE_TO_WORKFLOW_NODE } from '../config/workflowProtocol';
import type {
  WorkflowBackendPayload,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
  WorkflowModule,
} from '../types';

export function serializeWorkflowNode(node: WorkflowCanvasNode): WorkflowModule | null {
  switch (node.data.nodeType) {
    case 'start':
      return serializeStartNode(node);
    case 'llm':
      return serializeLlmNode(node);
    case 'end':
      return serializeEndNode(node);
    default:
      return null;
  }
}

export function serializeWorkflowToBackend(
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
): WorkflowBackendPayload {
  const start = nodes.find((node) => node.data.nodeType === 'start');
  const startConfig = normalizeStartConfig(start?.data.config);

  return {
    modules: nodes
      .map((node) => serializeWorkflowNode(node))
      .filter((module): module is WorkflowModule => Boolean(module)),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      ...(edge.sourceHandle ? { sourceHandle: edge.sourceHandle } : {}),
      ...(edge.targetHandle ? { targetHandle: edge.targetHandle } : {}),
    })),
    chatConfig: {
      variables: serializeStartVariables(startConfig),
    },
  };
}

export function parseWorkflowFromBackend(payload: WorkflowBackendPayload) {
  const variables = payload.chatConfig?.variables ?? [];
  return {
    nodes: payload.modules
      .map((module) => {
        const type = FLOW_TYPE_TO_WORKFLOW_NODE[module.flowNodeType];
        if (type === 'start') return parseStartModule(module, variables);
        if (type === 'llm') return parseLlmModule(module);
        if (type === 'end') return parseEndModule(module);
        return null;
      })
      .filter((node): node is WorkflowCanvasNode => Boolean(node)),
    edges: payload.edges,
  };
}
