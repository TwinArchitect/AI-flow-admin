import { WORKFLOW_NODE_MODULES } from '../nodes/registry';
import type { BackendFlowNodeType, WorkflowNodeType } from '../types';

export { LLM_NODE_OUTPUTS } from '../contracts/llmNodeContract';
export { START_NODE_OUTPUTS } from '../contracts/startNodeContract';
export { valueTypeToRenderType } from '../contracts/shared';

export const WORKFLOW_NODE_TO_FLOW_TYPE = Object.fromEntries(
  WORKFLOW_NODE_MODULES.flatMap((module) =>
    module.backendType ? [[module.type, module.backendType]] : [],
  ),
) as Partial<Record<WorkflowNodeType, BackendFlowNodeType>>;

export const FLOW_TYPE_TO_WORKFLOW_NODE = Object.fromEntries(
  WORKFLOW_NODE_MODULES.flatMap((module) =>
    module.backendType ? [[module.backendType, module.type]] : [],
  ),
) as Record<BackendFlowNodeType, WorkflowNodeType>;
