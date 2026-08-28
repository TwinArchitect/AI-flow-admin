import type {
  ClassifyAgent,
  ClassifyNodeConfig,
  LlmModelValue,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowModuleInput,
  WorkflowModuleOutput,
  WorkflowOutputSchema,
} from '../types';
import { moduleRefToString, stringToModuleRef } from '../utils/variableRefs';
import {
  createCanvasNode,
  parseBooleanInput,
  parseInputValue,
  parseNumberInput,
  parseStringInput,
} from './shared';

export const CLASSIFY_DEFAULT_AGENT_KEY = 'other';
export const CLASSIFY_DEFAULT_AGENT_LABEL = '默认';
export const CLASSIFY_HISTORY_MAX = 50;
export const CLASSIFY_NODE_DESCRIPTION = '根据对话历史与当前问题判断提问意图，并按分类执行不同分支';

export const CLASSIFY_NODE_OUTPUTS: WorkflowOutputSchema[] = [
  { key: 'cqResult', label: '分类结果', valueType: 'string' },
];

const CLASSIFY_MODULE_OUTPUTS: WorkflowModuleOutput[] = [{
  id: 'cqResult',
  key: 'cqResult',
  type: 'static',
  valueType: 'string',
  valueDesc: '',
  label: 'workflow:classification_result',
  description: '',
  required: true,
}];

function createAgentKey(index?: number) {
  return index == null
    ? `classify-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    : `classify-${index}`;
}

export function createClassifyAgent(): ClassifyAgent {
  return { key: createAgentKey(), value: '' };
}

export function createDefaultClassifyConfig(): ClassifyNodeConfig {
  return {
    model: null,
    systemPrompt: '',
    history: 0,
    memoryEnabled: false,
    userChatInput: '',
    agents: [{ key: CLASSIFY_DEFAULT_AGENT_KEY, value: CLASSIFY_DEFAULT_AGENT_LABEL }],
  };
}

function parseModel(raw: unknown): LlmModelValue | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const value = raw as Partial<LlmModelValue>;
  if (typeof value.model !== 'string' || !value.model.trim()) return null;
  return {
    id: typeof value.id === 'string' ? value.id : '',
    model: value.model,
    type: typeof value.type === 'string' ? value.type : 'llm',
    authToken: typeof value.authToken === 'string' ? value.authToken : undefined,
    url: typeof value.url === 'string' ? value.url : undefined,
  };
}

export function getClassifyCustomAgents(agents: ClassifyAgent[]) {
  return agents.filter((agent) => agent.key.trim() && agent.key.trim() !== CLASSIFY_DEFAULT_AGENT_KEY);
}

export function withClassifyDefaultAgent(agents: ClassifyAgent[]) {
  const seen = new Set<string>();
  const custom = getClassifyCustomAgents(agents).map((agent, index) => {
    const key = agent.key.trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      return { key, value: agent.value ?? '' };
    }
    const nextKey = createAgentKey(index);
    seen.add(nextKey);
    return { key: nextKey, value: agent.value ?? '' };
  });
  return [...custom, { key: CLASSIFY_DEFAULT_AGENT_KEY, value: CLASSIFY_DEFAULT_AGENT_LABEL }];
}

export function normalizeClassifyConfig(config: unknown): ClassifyNodeConfig {
  const raw = (config ?? {}) as Partial<ClassifyNodeConfig>;
  const history = Math.min(CLASSIFY_HISTORY_MAX, Math.max(0, Number(raw.history ?? 0) || 0));
  return {
    model: parseModel(raw.model),
    systemPrompt: typeof raw.systemPrompt === 'string' ? raw.systemPrompt : '',
    history,
    memoryEnabled: typeof raw.memoryEnabled === 'boolean' ? raw.memoryEnabled : history > 0,
    userChatInput: typeof raw.userChatInput === 'string' ? raw.userChatInput : '',
    agents: withClassifyDefaultAgent(Array.isArray(raw.agents) ? raw.agents : []),
  };
}

function buildClassifyInputs(config: ClassifyNodeConfig): WorkflowModuleInput[] {
  return [
    {
      key: 'model', label: 'common:core.module.input.label.aiModel', valueType: 'string',
      required: true, renderTypeList: ['selectLLMModel', 'reference'],
      value: config.model ?? { id: '', model: '', type: 'llm' }, debugLabel: '', toolDescription: '',
    },
    {
      key: 'systemPrompt', label: 'common:core.module.input.label.Background', valueType: 'string',
      isRichText: true, placeholder: 'common:core.module.input.placeholder.Classify background',
      maxLength: 100000, renderTypeList: ['textarea', 'reference'], value: config.systemPrompt,
      debugLabel: '', description: 'common:core.module.input.description.Background', toolDescription: '',
    },
    {
      key: 'memoryEnabled', label: 'workflow:enable_memory', valueType: 'boolean',
      renderTypeList: ['switch'], value: config.memoryEnabled, debugLabel: '开启记忆', toolDescription: '',
    },
    {
      key: 'history', label: 'common:core.module.input.label.chat history', valueType: 'chatHistory',
      required: true, max: CLASSIFY_HISTORY_MAX, min: 0, renderTypeList: ['numberInput', 'reference'],
      value: config.memoryEnabled ? config.history : 0, debugLabel: '',
      description: 'workflow:max_dialog_rounds', toolDescription: '',
    },
    {
      key: 'userChatInput', label: 'workflow:user_question', valueType: 'string', required: true,
      renderTypeList: ['reference', 'textarea'], value: stringToModuleRef(config.userChatInput),
      debugLabel: '', toolDescription: 'user question',
    },
    {
      key: 'agents', label: '', valueType: 'any', renderTypeList: ['custom'],
      value: withClassifyDefaultAgent(config.agents).map(({ key, value }) => ({ key, value })),
      debugLabel: '', toolDescription: '',
    },
  ];
}

export function serializeClassifyNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeClassifyConfig(node.data.config);
  return {
    flowNodeType: 'classifyQuestion',
    avatar: 'core/workflow/template/questionClassify',
    name: node.data.label,
    intro: CLASSIFY_NODE_DESCRIPTION,
    version: '4.9.2',
    nodeId: node.id,
    position: node.position,
    showStatus: true,
    inputs: buildClassifyInputs(config),
    outputs: CLASSIFY_MODULE_OUTPUTS.map((output) => ({ ...output })),
  };
}

export function parseClassifyModule(module: WorkflowModule) {
  const inputs = module.inputs ?? [];
  const rawAgents = parseInputValue(inputs, 'agents');
  const agents: ClassifyAgent[] = Array.isArray(rawAgents)
    ? rawAgents.map((row, index) => {
      const value = (row ?? {}) as Partial<ClassifyAgent>;
      return {
        key: typeof value.key === 'string' && value.key ? value.key : createAgentKey(index),
        value: typeof value.value === 'string' ? value.value : '',
      };
    })
    : [];
  const history = parseNumberInput(inputs, 'history', 0);
  const node = createCanvasNode('classify', module, normalizeClassifyConfig({
    model: parseInputValue(inputs, 'model') as LlmModelValue,
    systemPrompt: parseStringInput(inputs, 'systemPrompt'),
    history,
    memoryEnabled: parseBooleanInput(inputs, 'memoryEnabled', history > 0),
    userChatInput: moduleRefToString(parseInputValue(inputs, 'userChatInput')),
    agents,
  }));
  node.data.description = CLASSIFY_NODE_DESCRIPTION;
  return node;
}

export function getClassifyReferences(node: WorkflowCanvasNode) {
  const config = normalizeClassifyConfig(node.data.config);
  return [
    { value: config.systemPrompt, context: `节点 ${node.data.label} 的背景知识` },
    { value: config.userChatInput, context: `节点 ${node.data.label} 的用户问题` },
  ];
}

export function validateClassifyNode(node: WorkflowCanvasNode) {
  const config = normalizeClassifyConfig(node.data.config);
  const customAgents = getClassifyCustomAgents(config.agents);
  const errors: string[] = [];
  if (!config.model?.id || !config.model.model || !config.model.url) {
    errors.push(`节点 ${node.data.label} 请选择有效模型`);
  }
  if (!config.userChatInput.trim()) errors.push(`节点 ${node.data.label} 的用户问题不能为空`);
  if (config.history < 0 || config.history > CLASSIFY_HISTORY_MAX) {
    errors.push(`节点 ${node.data.label} 的历史轮数必须在 0 到 ${CLASSIFY_HISTORY_MAX} 之间`);
  }
  if (customAgents.length === 0) errors.push(`节点 ${node.data.label} 至少需要一个意图分类`);
  customAgents.forEach((agent, index) => {
    if (!agent.value.trim()) errors.push(`节点 ${node.data.label} 的分类 ${index + 1} 描述不能为空`);
  });
  return errors;
}
