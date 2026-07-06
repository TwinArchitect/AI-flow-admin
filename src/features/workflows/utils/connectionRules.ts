import type { IsValidConnection } from '@xyflow/react';

interface SimpleEdge {
  source: string;
  target: string;
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

export function createConnectionValidator(edges: SimpleEdge[]): IsValidConnection {
  return (connection) => {
    const { source, target } = connection;
    if (!source || !target) return false;
    if (source === target) return false;
    if (edges.some((edge) => edge.source === source && edge.target === target)) return false;
    if (hasCycle(source, target, edges)) return false;

    return true;
  };
}
