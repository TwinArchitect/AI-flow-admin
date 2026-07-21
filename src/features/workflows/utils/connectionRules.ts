import type { IsValidConnection } from '@xyflow/react';
import { getNodeConnectionRules, getNodeModule } from '../nodes/registry';
import type { WorkflowCanvasNode } from '../types';

interface SimpleEdge {
  source: string;
  target: string;
  sourceHandle?: string | null;
}

function hasCycle(source: string, target: string, edges: SimpleEdge[]) {
  const visited = new Set<string>();
  const stack = [target];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    if (node === source) return true;
    if (visited.has(node)) continue;

    visited.add(node);
    edges.filter((edge) => edge.source === node).forEach((edge) => stack.push(edge.target));
  }

  return false;
}

export function createConnectionValidator(
  nodes: WorkflowCanvasNode[],
  edges: SimpleEdge[],
): IsValidConnection {
  return (connection) => {
    const { source, target } = connection;
    if (!source || !target) return false;
    if (source === target) return false;
    if (edges.some((edge) => (
      edge.source === source
      && edge.target === target
      && edge.sourceHandle === connection.sourceHandle
    ))) return false;
    if (connection.sourceHandle && edges.some((edge) => (
      edge.source === source && edge.sourceHandle === connection.sourceHandle
    ))) return false;
    if (hasCycle(source, target, edges)) return false;

    const sourceNode = nodes.find((node) => node.id === source);
    const targetNode = nodes.find((node) => node.id === target);
    if (!sourceNode || !targetNode) return false;

    const sourceModule = getNodeModule(sourceNode.data.nodeType);
    const targetModule = getNodeModule(targetNode.data.nodeType);
    const sourceRules = getNodeConnectionRules(sourceNode);
    const targetRules = getNodeConnectionRules(targetNode);
    if (!sourceRules.allowOutgoing || !targetRules.allowIncoming) {
      return false;
    }
    if (
      sourceRules.maxOutgoing != null
      && edges.filter((edge) => edge.source === source).length >= sourceRules.maxOutgoing
    ) {
      return false;
    }
    if (
      targetRules.maxIncoming != null
      && edges.filter((edge) => edge.target === target).length >= targetRules.maxIncoming
    ) {
      return false;
    }
    if (sourceModule.validateConnection?.(sourceNode, 'outgoing', edges)) return false;
    if (targetModule.validateConnection?.(targetNode, 'incoming', edges)) return false;

    return true;
  };
}
