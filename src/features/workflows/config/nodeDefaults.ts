import { DEFAULT_END_CONFIG } from '../contracts/endNodeContract';
import { DEFAULT_HTTP_CONFIG } from '../contracts/httpNodeContract';
import { DEFAULT_LLM_CONFIG } from '../contracts/llmNodeContract';
import { DEFAULT_START_CONFIG } from '../contracts/startNodeContract';
import { getNodeModule } from '../nodes/registry';
import type { WorkflowNodeType } from '../types';

export {
  DEFAULT_END_CONFIG,
  DEFAULT_HTTP_CONFIG,
  DEFAULT_LLM_CONFIG,
  DEFAULT_START_CONFIG,
};

export function getDefaultNodeConfig(type: WorkflowNodeType): Record<string, unknown> {
  return getNodeModule(type).createDefaultConfig();
}
