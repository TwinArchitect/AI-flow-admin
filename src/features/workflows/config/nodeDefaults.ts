import type {
  EndNodeConfig,
  HttpNodeConfig,
  LlmNodeConfig,
  StartNodeConfig,
  WorkflowNodeType,
} from '../types';

export const DEFAULT_START_CONFIG: StartNodeConfig = {
  variables: [
    {
      id: 'start-var-userChatInput',
      key: 'userChatInput',
      label: '用户问题',
      valueType: 'string',
      required: true,
      description: '工作流入口用户输入',
      defaultValue: '',
    },
  ],
  sampleInput: '请帮我总结这段内容',
};

export const DEFAULT_LLM_CONFIG: LlmNodeConfig = {
  model: {
    id: '',
    model: 'gpt-4o-mini',
    type: 'llm',
  },
  systemPrompt: '',
  userChatInput: '{{start.userChatInput}}',
  history: 0,
  memoryEnabled: false,
  advanced: {
    temperature: 0,
    maxToken: 12000,
    isResponseAnswerText: true,
    aiChatReasoning: true,
  },
};

export const DEFAULT_END_CONFIG: EndNodeConfig = {
  outputVariables: [
    {
      id: 'end-var-answer',
      key: 'answer',
      value: '{{llm-demo.answerText}}',
    },
  ],
};

export const DEFAULT_HTTP_CONFIG: HttpNodeConfig = {
  method: 'GET',
  url: '',
  timeout: 30000,
  params: [],
  headers: [],
  body: '',
  captureError: true,
  outputField: 'response',
};

export function getDefaultNodeConfig(type: WorkflowNodeType): Record<string, unknown> {
  switch (type) {
    case 'start':
      return { ...DEFAULT_START_CONFIG };
    case 'llm':
      return { ...DEFAULT_LLM_CONFIG };
    case 'end':
      return { ...DEFAULT_END_CONFIG };
    case 'http':
      return {
        ...DEFAULT_HTTP_CONFIG,
        params: [...DEFAULT_HTTP_CONFIG.params],
        headers: [...DEFAULT_HTTP_CONFIG.headers],
      };
    default:
      return {};
  }
}
