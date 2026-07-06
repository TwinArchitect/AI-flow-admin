import type {
  EndNodeConfig,
  HttpNodeConfig,
  LlmNodeConfig,
  StartNodeConfig,
  WorkflowNodeType,
} from '../types';

export const DEFAULT_START_CONFIG: StartNodeConfig = {
  triggerMode: 'manual',
  inputField: 'userInput',
  sampleInput: '请帮我总结这段内容',
};

export const DEFAULT_LLM_CONFIG: LlmNodeConfig = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  systemPrompt: '',
  userPrompt: '{{start.userInput}}',
  maxTokens: 2048,
  outputField: 'text',
};

export const DEFAULT_END_CONFIG: EndNodeConfig = {
  responseTemplate: '{{llm.text}}',
  outputField: 'answer',
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
