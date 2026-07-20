import type {
  LlmNodeConfig,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowModuleInput,
  WorkflowOutputSchema,
} from '../types';
import { moduleRefToString, stringToModuleRef } from '../utils/variableRefs';
import {
  createCanvasNode,
  parseBooleanInput,
  parseInputValue,
  parseNumberInput,
  parseStringInput,
  toModuleOutputs,
} from './shared';

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

export const LLM_NODE_OUTPUTS: WorkflowOutputSchema[] = [
  { key: 'answerText', label: 'AI 回复内容', valueType: 'string' },
  { key: 'history', label: '新上下文', valueType: 'chatHistory' },
  { key: 'reasoningText', label: '推理内容', valueType: 'string' },
];

export function normalizeLlmConfig(config: unknown): LlmNodeConfig {
  const raw = (config ?? {}) as Partial<LlmNodeConfig>;
  return {
    ...DEFAULT_LLM_CONFIG,
    ...raw,
    advanced: {
      ...DEFAULT_LLM_CONFIG.advanced,
      ...raw.advanced,
    },
  };
}

function buildLlmInputs(config: LlmNodeConfig): WorkflowModuleInput[] {
  const advanced = config.advanced;
  return [
    {
      key: 'model',
      label: 'common:core.module.input.label.aiModel',
      valueType: 'string',
      renderTypeList: ['settingLLMModel', 'reference'],
      value: config.model ?? { id: '', model: '', type: 'llm' },
      toolDescription: '',
    },
    { key: 'temperature', valueType: 'number', renderTypeList: ['hidden'], value: advanced.temperature },
    { key: 'maxToken', valueType: 'number', renderTypeList: ['hidden'], value: advanced.maxToken },
    { key: 'isResponseAnswerText', valueType: 'boolean', renderTypeList: ['hidden'], value: advanced.isResponseAnswerText },
    { key: 'aiChatReasoning', valueType: 'boolean', renderTypeList: ['hidden'], value: advanced.aiChatReasoning },
    {
      key: 'systemPrompt',
      label: 'common:core.ai.Prompt',
      valueType: 'string',
      isRichText: true,
      maxLength: 100000,
      renderTypeList: ['textarea', 'reference'],
      value: config.systemPrompt,
      description: 'common:core.app.tip.systemPromptTip',
    },
    {
      key: 'memoryEnabled',
      label: 'workflow:enable_memory',
      valueType: 'boolean',
      renderTypeList: ['switch'],
      value: config.memoryEnabled,
      debugLabel: '开启记忆',
    },
    {
      key: 'history',
      label: 'common:core.module.input.label.chat history',
      valueType: 'chatHistory',
      required: true,
      max: 50,
      min: 0,
      renderTypeList: ['numberInput', 'reference'],
      value: config.memoryEnabled ? config.history : 0,
      description: 'workflow:max_dialog_rounds',
    },
    {
      key: 'userChatInput',
      label: 'workflow:user_question',
      valueType: 'string',
      required: true,
      renderTypeList: ['reference', 'textarea'],
      value: stringToModuleRef(config.userChatInput),
      toolDescription: '用户问题',
    },
  ];
}

export function serializeLlmNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeLlmConfig(node.data.config);
  return {
    flowNodeType: 'chatNode',
    avatar: 'core/workflow/template/aiChat',
    name: node.data.label,
    intro: node.data.description,
    version: '4.9.7',
    nodeId: node.id,
    position: node.position,
    showStatus: true,
    inputs: buildLlmInputs(config),
    outputs: toModuleOutputs(LLM_NODE_OUTPUTS),
  };
}

export function parseLlmModule(module: WorkflowModule) {
  const inputs = module.inputs ?? [];
  const history = parseNumberInput(inputs, 'history', DEFAULT_LLM_CONFIG.history);
  return createCanvasNode('llm', module, {
    ...DEFAULT_LLM_CONFIG,
    model: (parseInputValue(inputs, 'model') as LlmNodeConfig['model']) ?? DEFAULT_LLM_CONFIG.model,
    systemPrompt: parseStringInput(inputs, 'systemPrompt'),
    userChatInput: moduleRefToString(parseInputValue(inputs, 'userChatInput')),
    memoryEnabled: parseBooleanInput(inputs, 'memoryEnabled', history > 0),
    history,
    advanced: {
      ...DEFAULT_LLM_CONFIG.advanced,
      temperature: parseNumberInput(inputs, 'temperature', DEFAULT_LLM_CONFIG.advanced.temperature),
      maxToken: parseNumberInput(inputs, 'maxToken', DEFAULT_LLM_CONFIG.advanced.maxToken),
      isResponseAnswerText: parseBooleanInput(inputs, 'isResponseAnswerText', DEFAULT_LLM_CONFIG.advanced.isResponseAnswerText),
      aiChatReasoning: parseBooleanInput(inputs, 'aiChatReasoning', DEFAULT_LLM_CONFIG.advanced.aiChatReasoning),
    },
  });
}

export function validateLlmNode(node: WorkflowCanvasNode) {
  const config = normalizeLlmConfig(node.data.config);
  const errors: string[] = [];
  if (!config.model?.id || !config.model.model) errors.push(`节点 ${node.data.label} 请选择有效模型`);
  if (!config.userChatInput.trim()) errors.push(`节点 ${node.data.label} 的用户输入不能为空`);
  if (config.advanced.temperature < 0 || config.advanced.temperature > 1) {
    errors.push(`节点 ${node.data.label} 的 Temperature 必须在 0 到 1 之间`);
  }
  if (config.advanced.maxToken < 256 || config.advanced.maxToken > 32000) {
    errors.push(`节点 ${node.data.label} 的最大输出 Token 必须在 256 到 32000 之间`);
  }
  if (config.history < 0 || config.history > 50) {
    errors.push(`节点 ${node.data.label} 的历史轮数必须在 0 到 50 之间`);
  }
  return errors;
}
