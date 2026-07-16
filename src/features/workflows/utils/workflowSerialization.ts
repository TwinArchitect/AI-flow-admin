import { DEFAULT_END_CONFIG, DEFAULT_LLM_CONFIG, DEFAULT_START_CONFIG } from '../config/nodeDefaults';
import {
  FLOW_TYPE_TO_WORKFLOW_NODE,
  LLM_NODE_OUTPUTS,
  START_NODE_OUTPUTS,
  valueTypeToRenderType,
} from '../config/workflowProtocol';
import type {
  EndNodeConfig,
  LlmNodeConfig,
  StartNodeConfig,
  WorkflowBackendPayload,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
  WorkflowChatConfigVariable,
  WorkflowModule,
  WorkflowModuleInput,
  WorkflowModuleOutput,
  WorkflowNodeType,
} from '../types';
import { moduleRefToString, stringToModuleRef } from './variableRefs';

const DEFAULT_MODULE_VERSION = '481';

function normalizeStartConfig(config: unknown): StartNodeConfig {
  const raw = (config ?? {}) as Partial<StartNodeConfig>;
  return {
    ...DEFAULT_START_CONFIG,
    ...raw,
    variables: raw.variables?.length ? raw.variables : DEFAULT_START_CONFIG.variables,
  };
}

function normalizeLlmConfig(config: unknown): LlmNodeConfig {
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

function normalizeEndConfig(config: unknown): EndNodeConfig {
  const raw = (config ?? {}) as Partial<EndNodeConfig>;
  return {
    ...DEFAULT_END_CONFIG,
    ...raw,
    outputVariables: raw.outputVariables?.length
      ? raw.outputVariables
      : DEFAULT_END_CONFIG.outputVariables,
  };
}

function serializeStartVariables(config: StartNodeConfig): WorkflowChatConfigVariable[] {
  return config.variables
    .filter((variable) => variable.key.trim())
    .map((variable) => ({
      key: variable.key.trim(),
      label: variable.label.trim() || variable.key.trim(),
      valueType: variable.valueType,
      type: valueTypeToRenderType(variable.valueType),
      required: variable.required ?? false,
      ...(variable.description?.trim() ? { description: variable.description.trim() } : {}),
      defaultValue: variable.defaultValue ?? '',
    }));
}

function parseInputValue(inputs: WorkflowModuleInput[], key: string): unknown {
  return inputs.find((input) => input.key === key)?.value;
}

function parseStringInput(inputs: WorkflowModuleInput[], key: string): string {
  const value = parseInputValue(inputs, key);
  if (value == null) return '';
  return String(value);
}

function parseNumberInput(
  inputs: WorkflowModuleInput[],
  key: string,
  fallback: number,
): number {
  const value = Number(parseInputValue(inputs, key));
  return Number.isNaN(value) ? fallback : value;
}

function parseBooleanInput(
  inputs: WorkflowModuleInput[],
  key: string,
  fallback: boolean,
): boolean {
  const value = parseInputValue(inputs, key);
  return typeof value === 'boolean' ? value : fallback;
}

function toModuleOutputs(outputs: Array<{ key: string; label: string; valueType: string }>): WorkflowModuleOutput[] {
  return outputs.map((output) => ({
    id: output.key,
    key: output.key,
    type: 'static',
    valueType: output.valueType,
    label: output.label,
  }));
}

function serializeStartNode(node: WorkflowCanvasNode): WorkflowModule {
  return {
    flowNodeType: 'workflowStart',
    avatar: 'core/workflow/template/workflowStart',
    name: node.data.label,
    intro: node.data.description,
    version: DEFAULT_MODULE_VERSION,
    nodeId: node.id,
    position: node.position,
    inputs: [
      {
        key: 'userChatInput',
        label: 'workflow:user_question',
        valueType: 'string',
        required: true,
        renderTypeList: ['reference', 'textarea'],
        value: '',
        toolDescription: '用户问题',
      },
    ],
    outputs: toModuleOutputs(START_NODE_OUTPUTS),
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
    {
      key: 'temperature',
      valueType: 'number',
      renderTypeList: ['hidden'],
      value: advanced.temperature,
    },
    {
      key: 'maxToken',
      valueType: 'number',
      renderTypeList: ['hidden'],
      value: advanced.maxToken,
    },
    {
      key: 'isResponseAnswerText',
      valueType: 'boolean',
      renderTypeList: ['hidden'],
      value: advanced.isResponseAnswerText,
    },
    {
      key: 'aiChatReasoning',
      valueType: 'boolean',
      renderTypeList: ['hidden'],
      value: advanced.aiChatReasoning,
    },
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

function serializeLlmNode(node: WorkflowCanvasNode): WorkflowModule {
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

function serializeEndNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeEndConfig(node.data.config);
  const outputVariables = config.outputVariables.filter((variable) => variable.key.trim());

  return {
    flowNodeType: 'workflowEnd',
    avatar: 'core/workflow/template/workflowEnd',
    name: node.data.label,
    intro: node.data.description,
    version: DEFAULT_MODULE_VERSION,
    nodeId: node.id,
    position: node.position,
    inputs: outputVariables.map((variable) => ({
      key: variable.key.trim(),
      label: variable.key.trim(),
      valueType: 'string',
      renderTypeList: ['reference'],
      value: variable.value,
    })),
    outputs: outputVariables.map((variable) => ({
      id: variable.key.trim(),
      key: variable.key.trim(),
      type: 'static',
      valueType: 'string',
      label: variable.key.trim(),
    })),
  };
}

export function serializeWorkflowNode(node: WorkflowCanvasNode): WorkflowModule | null {
  switch (node.data.nodeType) {
    case 'start':
      return serializeStartNode(node);
    case 'llm':
      return serializeLlmNode(node);
    case 'end':
      return serializeEndNode(node);
    default:
      return null;
  }
}

export function serializeWorkflowToBackend(
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
): WorkflowBackendPayload {
  const start = nodes.find((node) => node.data.nodeType === 'start');
  const startConfig = normalizeStartConfig(start?.data.config);

  return {
    modules: nodes
      .map((node) => serializeWorkflowNode(node))
      .filter((module): module is WorkflowModule => Boolean(module)),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      ...(edge.sourceHandle ? { sourceHandle: edge.sourceHandle } : {}),
      ...(edge.targetHandle ? { targetHandle: edge.targetHandle } : {}),
    })),
    chatConfig: {
      variables: serializeStartVariables(startConfig),
    },
  };
}

function createCanvasNode(
  type: WorkflowNodeType,
  module: WorkflowModule,
  config: WorkflowCanvasNode['data']['config'],
): WorkflowCanvasNode {
  return {
    id: module.nodeId,
    type,
    position: module.position,
    data: {
      label: module.name,
      nodeType: type,
      description: module.intro ?? '',
      config,
    },
  };
}

function parseStartModule(
  module: WorkflowModule,
  variables: WorkflowChatConfigVariable[],
): WorkflowCanvasNode {
  return createCanvasNode('start', module, {
    ...DEFAULT_START_CONFIG,
    variables: variables.length
      ? variables.map((variable, index) => ({
          id: `start-var-${variable.key || index}`,
          key: variable.key,
          label: variable.label || variable.key,
          valueType: variable.valueType,
          required: variable.required,
          description: variable.description,
          defaultValue: variable.defaultValue,
        }))
      : DEFAULT_START_CONFIG.variables,
  });
}

function parseLlmModule(module: WorkflowModule): WorkflowCanvasNode {
  const inputs = module.inputs ?? [];
  const history = parseNumberInput(inputs, 'history', DEFAULT_LLM_CONFIG.history);
  const config: LlmNodeConfig = {
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
      isResponseAnswerText: parseBooleanInput(
        inputs,
        'isResponseAnswerText',
        DEFAULT_LLM_CONFIG.advanced.isResponseAnswerText,
      ),
      aiChatReasoning: parseBooleanInput(
        inputs,
        'aiChatReasoning',
        DEFAULT_LLM_CONFIG.advanced.aiChatReasoning,
      ),
    },
  };

  return createCanvasNode('llm', module, config);
}

function parseEndModule(module: WorkflowModule): WorkflowCanvasNode {
  const outputVariables = (module.inputs ?? [])
    .filter((input) => input.key.trim())
    .map((input, index) => ({
      id: `end-var-${input.key || index}`,
      key: input.key,
      value: input.value == null ? '' : String(input.value),
    }));

  return createCanvasNode('end', module, {
    ...DEFAULT_END_CONFIG,
    outputVariables: outputVariables.length ? outputVariables : DEFAULT_END_CONFIG.outputVariables,
  });
}

export function parseWorkflowFromBackend(payload: WorkflowBackendPayload) {
  const variables = payload.chatConfig?.variables ?? [];

  return {
    nodes: payload.modules
      .map((module) => {
        const type = FLOW_TYPE_TO_WORKFLOW_NODE[module.flowNodeType];
        if (type === 'start') return parseStartModule(module, variables);
        if (type === 'llm') return parseLlmModule(module);
        if (type === 'end') return parseEndModule(module);
        return null;
      })
      .filter((node): node is WorkflowCanvasNode => Boolean(node)),
    edges: payload.edges,
  };
}
