import type {
  BackendFlowNodeType,
  WorkflowNodeType,
  WorkflowOutputSchema,
  WorkflowValueType,
} from '../types';

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

export const START_NODE_OUTPUTS: WorkflowOutputSchema[] = [
  {
    key: 'userChatInput',
    label: '用户问题',
    valueType: 'string',
  },
];

export const LLM_NODE_OUTPUTS: WorkflowOutputSchema[] = [
  {
    key: 'answerText',
    label: 'AI 回复内容',
    valueType: 'string',
  },
  {
    key: 'history',
    label: '新上下文',
    valueType: 'chatHistory',
  },
  {
    key: 'reasoningText',
    label: '推理内容',
    valueType: 'string',
  },
];

export function valueTypeToRenderType(valueType: WorkflowValueType) {
  switch (valueType) {
    case 'number':
      return 'numberInput';
    case 'boolean':
      return 'switch';
    case 'file':
      return 'file';
    case 'object':
    case 'array':
      return 'textarea';
    default:
      return 'input';
  }
}
