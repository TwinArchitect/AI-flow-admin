export type NodeExecutionStatus =
  | 'idle'
  | 'running'
  | 'success'
  | 'error'
  | 'cancelled'
  | 'skipped';

export type WorkflowExecutionOutcome = 'success' | 'error' | 'cancelled';

export interface NodeExecutionState {
  status: NodeExecutionStatus;
  durationMs?: number;
  summaryLog?: string;
  executionLogs?: string[];
  statusCode?: number;
  flowNodeType?: string;
  debugInputs?: Record<string, unknown>;
  debugOutputs?: Record<string, unknown>;
  debugError?: string | null;
}

export type WorkflowNodeExecutionStates = Record<string, NodeExecutionState>;

export interface WorkflowNodeSsePayload extends Record<string, unknown> {
  nodeId: string;
  flowNodeType: string;
  statusCode: number;
  ts?: number;
  log?: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  flowNodeResponse?: unknown;
}

export interface WorkflowFinishedSsePayload {
  event: 'workflow_finished';
  task_id?: string;
  workflow_run_id?: string;
  data: {
    id?: string;
    workflow_id?: string;
    status: 'succeeded' | 'failed';
    outputs: Record<string, unknown>;
    error?: string | null;
    elapsed_time?: number;
    total_steps?: number;
  };
}

export interface WorkflowRunResult {
  outputs: Record<string, unknown>;
  nodeOutputs: Record<string, Record<string, unknown>>;
  answerText: string;
  reasoningText: string;
  workflowRunId?: string;
}
