import { useCallback, useState } from 'react';
import type { WorkflowCanvasEdge } from '../types';
import type {
  WorkflowExecutionOutcome,
  WorkflowNodeExecutionStates,
  WorkflowNodeSsePayload,
} from '../types/execution';
import { buildErrorCatchHandle, buildSourceHandle } from '../utils/edgeHandles';
import {
  applyWorkflowNodeSseEvent,
  markNodesRunning,
  settleWorkflowNodeStates,
} from '../utils/workflowNodeExecution';

export function useWorkflowCanvasExecution() {
  const [nodeStates, setNodeStates] = useState<WorkflowNodeExecutionStates>({});

  const reset = useCallback(() => setNodeStates({}), []);

  const startExecution = useCallback((startNodeId: string) => {
    setNodeStates(markNodesRunning({}, [startNodeId]));
  }, []);

  const applyNodeEvent = useCallback((
    eventName: string,
    payload: WorkflowNodeSsePayload,
    edges: WorkflowCanvasEdge[],
  ) => {
    setNodeStates((current) => {
      const next = applyWorkflowNodeSseEvent(current, eventName, payload);
      const sourceHandle = payload.statusCode === 200
        ? buildSourceHandle(payload.nodeId)
        : payload.statusCode === 500
          ? buildErrorCatchHandle(payload.nodeId)
          : undefined;
      if (!sourceHandle) return next;
      const nextEdge = edges.find((edge) => (
        edge.source === payload.nodeId && edge.sourceHandle === sourceHandle
      ));
      return nextEdge ? markNodesRunning(next, [nextEdge.target]) : next;
    });
  }, []);

  const finishExecution = useCallback((
    nodeIds: string[],
    outcome: WorkflowExecutionOutcome,
    message?: string,
  ) => {
    setNodeStates((current) => settleWorkflowNodeStates(current, nodeIds, outcome, message));
  }, []);

  return {
    nodeStates,
    reset,
    startExecution,
    applyNodeEvent,
    finishExecution,
  };
}
