import { LLM_NODE_OUTPUTS } from '../contracts/llmNodeContract';
import { START_NODE_OUTPUTS } from '../contracts/startNodeContract';
import type {
  StartNodeConfig,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
  WorkflowOutputSchema,
  WorkflowVariableOption,
} from '../types';
import { buildVariableRef } from './variableRefs';

function getUpstreamNodes(
  nodeId: string,
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const incoming = new Map<string, string[]>();

  edges.forEach((edge) => {
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge.source]);
  });

  const visited = new Set<string>();
  const ordered: WorkflowCanvasNode[] = [];
  const queue = [...(incoming.get(nodeId) ?? [])];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) continue;

    visited.add(currentId);
    const node = nodeMap.get(currentId);
    if (node) ordered.push(node);

    queue.push(...(incoming.get(currentId) ?? []));
  }

  return ordered;
}

function getStartOutputs(node: WorkflowCanvasNode): WorkflowOutputSchema[] {
  const config = node.data.config as Partial<StartNodeConfig>;
  const variables = config.variables?.filter((variable) => variable.key.trim()) ?? [];

  if (variables.length === 0) return START_NODE_OUTPUTS;

  return variables.map((variable) => ({
    key: variable.key.trim(),
    label: variable.label?.trim() || variable.description?.trim() || variable.key.trim(),
    valueType: variable.valueType,
  }));
}

export function resolveNodeOutputs(node: WorkflowCanvasNode): WorkflowOutputSchema[] {
  if (node.data.nodeType === 'start') return getStartOutputs(node);
  if (node.data.nodeType === 'llm') return LLM_NODE_OUTPUTS;
  return [];
}

export function getAvailableVariablesForNode(
  nodeId: string,
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
): WorkflowVariableOption[] {
  const options = new Map<string, WorkflowVariableOption>();

  getUpstreamNodes(nodeId, nodes, edges).forEach((node) => {
    resolveNodeOutputs(node).forEach((output) => {
      const ref = buildVariableRef(node.id, output.key);
      options.set(ref, {
        ref,
        nodeId: node.id,
        nodeLabel: node.data.label || node.id,
        nodeType: node.data.nodeType,
        outputKey: output.key,
        outputLabel: output.label || output.key,
        valueType: output.valueType,
      });
    });
  });

  return Array.from(options.values());
}
