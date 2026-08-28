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

export function getConditionBranchLabel(index: number) {
  return index === 0 ? 'IF' : `ELSE IF ${index}`;
}

export function buildConditionSourceHandle(nodeId: string, index: number) {
  return `${nodeId}-source-${getConditionBranchLabel(index)}`;
}

export function buildConditionElseHandle(nodeId: string) {
  return `${nodeId}-source-ELSE`;
}

export function buildClassifySourceHandle(nodeId: string, agentKey: string) {
  return `${nodeId}-source-${agentKey}-right`;
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
