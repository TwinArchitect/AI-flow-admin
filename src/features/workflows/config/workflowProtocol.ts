import type { BackendFlowNodeType, WorkflowNodeType } from '../types';
export { LLM_NODE_OUTPUTS } from '../contracts/llmNodeContract';
export { START_NODE_OUTPUTS } from '../contracts/startNodeContract';
export { valueTypeToRenderType } from '../contracts/shared';

export const WORKFLOW_NODE_TO_FLOW_TYPE: Partial<Record<WorkflowNodeType, BackendFlowNodeType>> = {
  start: 'workflowStart',
  llm: 'chatNode',
  end: 'workflowEnd',
};

export const FLOW_TYPE_TO_WORKFLOW_NODE: Record<BackendFlowNodeType, WorkflowNodeType> = {
  workflowStart: 'start',
  chatNode: 'llm',
  workflowEnd: 'end',
};
