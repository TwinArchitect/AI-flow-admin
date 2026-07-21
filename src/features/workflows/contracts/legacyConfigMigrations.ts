import type { HttpNodeConfig, LlmNodeConfig } from '../types';

type LegacyLlmConfig = Partial<LlmNodeConfig> & {
  userInput?: string;
};

type LegacyHttpConfig = Partial<HttpNodeConfig> & {
  body?: string;
  captureError?: boolean;
  outputField?: string;
};

export function migrateLegacyLlmConfig(config: unknown): Partial<LlmNodeConfig> {
  const { userInput, ...current } = (config ?? {}) as LegacyLlmConfig;
  return {
    ...current,
    userChatInput: current.userChatInput ?? userInput,
  };
}

export function migrateLegacyHttpConfig(config: unknown): Partial<HttpNodeConfig> {
  const {
    body,
    captureError,
    outputField,
    ...current
  } = (config ?? {}) as LegacyHttpConfig;
  const legacyOutput = outputField?.trim()
    ? [{
        id: 'http-output-legacy',
        key: outputField.trim(),
        jsonPath: outputField.trim(),
        valueType: 'any' as const,
      }]
    : undefined;

  return {
    ...current,
    jsonBody: current.jsonBody ?? body,
    catchError: current.catchError ?? captureError,
    outputExtracts: current.outputExtracts ?? legacyOutput,
  };
}
