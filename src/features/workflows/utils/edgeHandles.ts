import type { WorkflowCanvasEdge } from '../types';

export function buildSourceHandle(nodeId: string) {
  return `${nodeId}-source-right`;
}

export function buildErrorCatchHandle(nodeId: string) {
  return `${nodeId}-source_catch-right`;
}

export function buildTargetHandle(nodeId: string) {
  return `${nodeId}-target-left`;
}

export function normalizeEdgeForCanvas(edge: WorkflowCanvasEdge): WorkflowCanvasEdge {
  return {
    ...edge,
    sourceHandle:
      !edge.sourceHandle || edge.sourceHandle === 'source'
        ? buildSourceHandle(edge.source)
        : edge.sourceHandle,
    targetHandle:
      !edge.targetHandle || edge.targetHandle === 'target'
        ? buildTargetHandle(edge.target)
        : edge.targetHandle,
  };
}

export function serializeEdgeHandles(edge: WorkflowCanvasEdge): WorkflowCanvasEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || buildSourceHandle(edge.source),
    targetHandle: edge.targetHandle || buildTargetHandle(edge.target),
  };
}
