import type {
  StartNodeConfig,
  WorkflowCanvasNode,
  WorkflowChatConfigVariable,
  WorkflowModule,
  WorkflowOutputSchema,
} from '../types';
import {
  createCanvasNode,
  DEFAULT_MODULE_VERSION,
  toModuleOutputs,
  valueTypeToRenderType,
} from './shared';

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

export const START_NODE_OUTPUTS: WorkflowOutputSchema[] = [
  {
    key: 'userChatInput',
    label: '用户问题',
    valueType: 'string',
  },
];

export function normalizeStartConfig(config: unknown): StartNodeConfig {
  const raw = (config ?? {}) as Partial<StartNodeConfig>;
  return {
    ...DEFAULT_START_CONFIG,
    ...raw,
    variables: raw.variables?.length ? raw.variables : DEFAULT_START_CONFIG.variables,
  };
}

export function serializeStartVariables(config: StartNodeConfig): WorkflowChatConfigVariable[] {
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

export function serializeStartNode(node: WorkflowCanvasNode): WorkflowModule {
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

export function parseStartModule(
  module: WorkflowModule,
  variables: WorkflowChatConfigVariable[],
) {
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

export function validateStartNode(node: WorkflowCanvasNode) {
  const config = normalizeStartConfig(node.data.config);
  const keys = config.variables.map((variable) => variable.key.trim()).filter(Boolean);
  const errors: string[] = [];
  if (keys.length === 0) errors.push('开始节点至少需要一个输入变量');
  if (new Set(keys).size !== keys.length) errors.push('开始节点输入变量名不能重复');
  return errors;
}
