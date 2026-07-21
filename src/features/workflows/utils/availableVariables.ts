import { getNodeModule } from '../nodes/registry';
import type {
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
  WorkflowVariableOption,
} from '../types';
import { buildVariableRef } from './variableRefs';
import {
  normalizeStartConfig,
  VARIABLE_NODE_ID,
} from '../contracts/startNodeContract';

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

export function resolveNodeOutputs(node: WorkflowCanvasNode) {
  return getNodeModule(node.data.nodeType).getOutputs(node);
}

export function getAvailableVariablesForNode(
  nodeId: string,
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
): WorkflowVariableOption[] {
  const options = new Map<string, WorkflowVariableOption>();

  const startNode = nodes.find((node) => node.data.nodeType === 'start');
  if (startNode) {
    normalizeStartConfig(startNode.data.config).variables
      .filter((variable) => variable.key.trim())
      .forEach((variable) => {
        const outputKey = variable.key.trim();
        const ref = buildVariableRef(VARIABLE_NODE_ID, outputKey);
        options.set(ref, {
          ref,
          nodeId: VARIABLE_NODE_ID,
          nodeLabel: '全局变量',
          nodeType: 'global',
          outputKey,
          outputLabel: variable.key === 'files'
            ? '用户附件'
            : variable.description?.trim() || variable.label.trim() || outputKey,
          valueType: variable.valueType,
        });
      });
  }

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
