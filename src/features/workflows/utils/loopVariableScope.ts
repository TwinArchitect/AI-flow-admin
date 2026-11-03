import type { WorkflowCanvasEdge, WorkflowCanvasNode } from '../types';

/** Same-level predecessors plus containing loops' predecessors; never unfinished parent outputs. */
export function getVariableUpstreamNodes(nodeId: string, nodes: WorkflowCanvasNode[], edges: WorkflowCanvasEdge[]) {
  const index = new Map(nodes.map((node) => [node.id, node]));
  const consumer = index.get(nodeId);
  if (!consumer) return [];
  const allowed = new Set<string>();
  const ancestors = new Set<string>();
  let current = consumer;
  while (!ancestors.has(current.id)) {
    ancestors.add(current.id);
    const visited = new Set<string>();
    const queue = edges.filter((edge) => edge.target === current.id).map((edge) => edge.source);
    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const source = index.get(id);
      if (source && (source.parentId ?? '') === (current.parentId ?? '') && id !== nodeId) allowed.add(id);
      queue.push(...edges.filter((edge) => edge.target === id).map((edge) => edge.source));
    }
    const parent = current.parentId ? index.get(current.parentId) : undefined;
    if (!parent || parent.data.nodeType !== 'loop') break;
    current = parent;
  }
  ancestors.forEach((id) => allowed.delete(id));
  return nodes.filter((node) => allowed.has(node.id));
}

export function collectNodesRemovedWithDescendants(nodes: Pick<WorkflowCanvasNode, 'id' | 'parentId'>[], rootIds: Iterable<string>) {
  const removed = new Set(rootIds);
  const queue = [...removed];
  while (queue.length) {
    const id = queue.pop()!;
    nodes.filter((node) => node.parentId === id).forEach((node) => {
      if (!removed.has(node.id)) { removed.add(node.id); queue.push(node.id); }
    });
  }
  return removed;
}
