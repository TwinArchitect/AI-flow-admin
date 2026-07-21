import type {
  LlmNodeConfig,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowModuleInput,
  WorkflowModuleOutput,
  WorkflowOutputSchema,
} from '../types';
import { moduleRefToString, stringToModuleRef } from '../utils/variableRefs';
import { migrateLegacyLlmConfig } from './legacyConfigMigrations';
import {
  createCanvasNode,
  parseBooleanInput,
  parseInputValue,
  parseNumberInput,
  parseStringInput,
} from './shared';

export const DEFAULT_LLM_CONFIG: LlmNodeConfig = {
  model: null,
  systemPrompt: '',
  userChatInput: '',
  history: 0,
  memoryEnabled: false,
  multimodalEnabled: false,
  fileUrlRefs: [],
  catchError: false,
  advanced: {
    temperature: 0,
    maxToken: 12000,
    isResponseAnswerText: true,
    aiChatQuoteRole: 'system',
    quoteTemplate: '',
    quotePrompt: '',
    aiChatVision: false,
    aiChatAudio: false,
    aiChatVideo: false,
    aiChatExtractFiles: false,
    aiChatReasoning: true,
  },
};

export const LLM_NODE_OUTPUTS: WorkflowOutputSchema[] = [
  { key: 'history', label: '新上下文', valueType: 'chatHistory' },
  { key: 'answerText', label: 'AI 回复内容', valueType: 'string' },
  { key: 'reasoningText', label: '推理内容', valueType: 'string' },
];

const LLM_MODULE_OUTPUTS: WorkflowModuleOutput[] = [
  {
    id: 'history', key: 'history', type: 'static', valueType: 'chatHistory',
    valueDesc: '{\n  obj: System | Human | AI;\n  value: string;\n}[]',
    label: 'common:core.module.output.label.New context',
    description: '将本次回复内容拼接上历史记录，作为新的上下文返回', required: true,
  },
  {
    id: 'answerText', key: 'answerText', type: 'static', valueType: 'string', valueDesc: '',
    label: 'common:core.module.output.label.Ai response content',
    description: '将在 stream 回复完毕后触发', required: true,
  },
  {
    id: 'reasoningText', key: 'reasoningText', type: 'static', valueType: 'string', valueDesc: '',
    label: 'workflow:reasoning_content', description: '', required: false,
  },
  {
    id: 'system_error_text', key: 'system_error_text', type: 'error', valueType: 'string',
    valueDesc: '', label: 'workflow:error_text', description: '',
  },
];

export function normalizeLlmConfig(config: unknown): LlmNodeConfig {
  const raw = migrateLegacyLlmConfig(config);
  const history = Math.min(50, Math.max(0, Number(raw.history ?? 0) || 0));
  return {
    ...DEFAULT_LLM_CONFIG,
    ...raw,
    model: raw.model ?? DEFAULT_LLM_CONFIG.model,
    userChatInput: raw.userChatInput ?? DEFAULT_LLM_CONFIG.userChatInput,
    history,
    memoryEnabled: raw.memoryEnabled ?? history > 0,
    fileUrlRefs: Array.isArray(raw.fileUrlRefs) ? raw.fileUrlRefs : [],
    multimodalEnabled: raw.multimodalEnabled ?? raw.advanced?.aiChatVision ?? false,
    catchError: raw.catchError ?? false,
    advanced: { ...DEFAULT_LLM_CONFIG.advanced, ...raw.advanced },
  };
}

const hidden = (key: string, valueType: 'boolean' | 'number' | 'string', value: unknown): WorkflowModuleInput => ({
  key, label: '', valueType, renderTypeList: ['hidden'], value, debugLabel: '', toolDescription: '',
});

function serializeFileRefs(refs: string[]) {
  return refs.filter((ref) => ref.trim()).map((ref) => stringToModuleRef(ref));
}

function parseFileRefs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(moduleRefToString).filter((ref) => ref.trim());
}

function buildLlmInputs(config: LlmNodeConfig): WorkflowModuleInput[] {
  const advanced = config.advanced;
  return [
    {
      key: 'model', label: 'common:core.module.input.label.aiModel', valueType: 'string',
      renderTypeList: ['settingLLMModel', 'reference'],
      value: config.model ?? { id: '', model: '', type: 'llm' }, debugLabel: '', toolDescription: '',
    },
    hidden('temperature', 'number', advanced.temperature),
    hidden('maxToken', 'number', advanced.maxToken),
    hidden('isResponseAnswerText', 'boolean', advanced.isResponseAnswerText),
    hidden('aiChatQuoteRole', 'string', advanced.aiChatQuoteRole),
    hidden('quoteTemplate', 'string', advanced.quoteTemplate),
    hidden('quotePrompt', 'string', advanced.quotePrompt),
    hidden('aiChatVision', 'boolean', config.multimodalEnabled || advanced.aiChatVision),
    hidden('aiChatAudio', 'boolean', advanced.aiChatAudio),
    hidden('aiChatVideo', 'boolean', advanced.aiChatVideo),
    hidden('aiChatExtractFiles', 'boolean', config.multimodalEnabled || advanced.aiChatExtractFiles),
    hidden('aiChatReasoning', 'boolean', advanced.aiChatReasoning),
    hidden('aiChatTopP', 'number', advanced.aiChatTopP),
    {
      key: 'systemPrompt', label: 'common:core.ai.Prompt', valueType: 'string', isRichText: true,
      placeholder: 'common:core.app.tip.chatNodeSystemPromptTip', maxLength: 100000,
      renderTypeList: ['textarea', 'reference'], value: config.systemPrompt, debugLabel: '',
      description: 'common:core.app.tip.systemPromptTip', toolDescription: '',
    },
    {
      key: 'memoryEnabled', label: 'workflow:enable_memory', valueType: 'boolean',
      renderTypeList: ['switch'], value: config.memoryEnabled, debugLabel: '开启记忆', toolDescription: '',
    },
    {
      key: 'history', label: 'common:core.module.input.label.chat history', valueType: 'chatHistory',
      required: true, max: 50, min: 0, renderTypeList: ['numberInput', 'reference'],
      value: config.memoryEnabled ? config.history : 0, debugLabel: '',
      description: 'workflow:max_dialog_rounds', toolDescription: '',
    },
    {
      key: 'quoteQA', label: '', valueType: 'datasetQuote',
      renderTypeList: ['settingDatasetQuotePrompt'], debugLabel: '知识库引用',
      description: '', toolDescription: '',
    },
    {
      key: 'fileUrlList', label: 'app:workflow.user_file_input', valueType: 'arrayString',
      renderTypeList: ['reference', 'input'],
      value: config.multimodalEnabled ? serializeFileRefs(config.fileUrlRefs) : [],
      debugLabel: '文件链接', description: 'app:workflow.user_file_input_desc', toolDescription: '',
    },
    {
      key: 'userChatInput', label: 'workflow:user_question', valueType: 'string', required: true,
      renderTypeList: ['reference', 'textarea'], value: stringToModuleRef(config.userChatInput),
      debugLabel: '', toolDescription: '用户问题',
    },
  ];
}

export function serializeLlmNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeLlmConfig(node.data.config);
  return {
    flowNodeType: 'chatNode', avatar: 'core/workflow/template/aiChat', name: node.data.label,
    intro: node.data.description, version: '4.9.7', nodeId: node.id, position: node.position,
    showStatus: true, catchError: config.catchError,
    inputs: buildLlmInputs(config), outputs: LLM_MODULE_OUTPUTS.map((output) => ({ ...output })),
  };
}

export function parseLlmModule(module: WorkflowModule) {
  const inputs = module.inputs ?? [];
  const history = parseNumberInput(inputs, 'history', 0);
  const multimodalEnabled = parseBooleanInput(inputs, 'aiChatVision', false);
  return createCanvasNode('llm', module, normalizeLlmConfig({
    model: parseInputValue(inputs, 'model') as LlmNodeConfig['model'],
    systemPrompt: parseStringInput(inputs, 'systemPrompt'),
    userChatInput: moduleRefToString(parseInputValue(inputs, 'userChatInput')),
    memoryEnabled: parseBooleanInput(inputs, 'memoryEnabled', history > 0),
    history,
    multimodalEnabled,
    fileUrlRefs: parseFileRefs(parseInputValue(inputs, 'fileUrlList')),
    catchError: Boolean(module.catchError),
    advanced: {
      temperature: parseNumberInput(inputs, 'temperature', 0),
      maxToken: parseNumberInput(inputs, 'maxToken', 12000),
      isResponseAnswerText: parseBooleanInput(inputs, 'isResponseAnswerText', true),
      aiChatQuoteRole: parseStringInput(inputs, 'aiChatQuoteRole') || 'system',
      quoteTemplate: parseStringInput(inputs, 'quoteTemplate'),
      quotePrompt: parseStringInput(inputs, 'quotePrompt'),
      aiChatVision: multimodalEnabled,
      aiChatAudio: parseBooleanInput(inputs, 'aiChatAudio', false),
      aiChatVideo: parseBooleanInput(inputs, 'aiChatVideo', false),
      aiChatExtractFiles: parseBooleanInput(inputs, 'aiChatExtractFiles', false),
      aiChatReasoning: parseBooleanInput(inputs, 'aiChatReasoning', true),
      aiChatTopP: parseInputValue(inputs, 'aiChatTopP') == null
        ? undefined
        : parseNumberInput(inputs, 'aiChatTopP', 1),
    },
  }));
}

export function validateLlmNode(node: WorkflowCanvasNode) {
  const config = normalizeLlmConfig(node.data.config);
  const errors: string[] = [];
  if (!config.model?.id || !config.model.model) errors.push(`节点 ${node.data.label} 请选择有效模型`);
  if (!config.userChatInput.trim()) errors.push(`节点 ${node.data.label} 的用户输入不能为空`);
  if (config.advanced.temperature < 0 || config.advanced.temperature > 2) {
    errors.push(`节点 ${node.data.label} 的 Temperature 必须在 0 到 2 之间`);
  }
  if (config.advanced.aiChatTopP != null && (config.advanced.aiChatTopP < 0 || config.advanced.aiChatTopP > 1)) {
    errors.push(`节点 ${node.data.label} 的 Top P 必须在 0 到 1 之间`);
  }
  if (config.advanced.maxToken < 0) errors.push(`节点 ${node.data.label} 的最大输出 Token 不能小于 0`);
  if (config.history < 0 || config.history > 50) errors.push(`节点 ${node.data.label} 的历史轮数必须在 0 到 50 之间`);
  if (config.multimodalEnabled && config.fileUrlRefs.some((ref) => !ref.trim())) {
    errors.push(`节点 ${node.data.label} 的文件变量不能为空`);
  }
  return errors;
}
