import { DEFAULT_END_CONFIG } from '../contracts/endNodeContract';
import { DEFAULT_LLM_CONFIG } from '../contracts/llmNodeContract';
import { DEFAULT_START_CONFIG } from '../contracts/startNodeContract';
import type { HttpNodeConfig, WorkflowNodeType } from '../types';

export { DEFAULT_END_CONFIG, DEFAULT_LLM_CONFIG, DEFAULT_START_CONFIG };

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
      return { ...DEFAULT_START_CONFIG, variables: [...DEFAULT_START_CONFIG.variables] };
    case 'llm':
      return {
        ...DEFAULT_LLM_CONFIG,
        advanced: { ...DEFAULT_LLM_CONFIG.advanced },
      };
    case 'end':
      return {
        ...DEFAULT_END_CONFIG,
        outputVariables: [...DEFAULT_END_CONFIG.outputVariables],
      };
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
