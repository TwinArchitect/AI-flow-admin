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
      id: 'system-start-files',
      key: 'files',
      label: 'files',
      valueType: 'file',
      required: false,
      description: '附件',
      defaultValue: '',
      system: true,
    },
  ],
};

export const VARIABLE_NODE_ID = 'VARIABLE_NODE_ID';

export function isSystemStartVariable(variable: StartNodeConfig['variables'][number]) {
  return variable.system === true || variable.key === 'files';
}

export function ensureSystemStartVariables(
  variables: StartNodeConfig['variables'],
): StartNodeConfig['variables'] {
  const customVariables = variables.filter(
    (variable) => !isSystemStartVariable(variable) && variable.key !== 'userChatInput',
  );
  const existingFiles = variables.find((variable) => variable.key === 'files');
  return [
    {
      ...DEFAULT_START_CONFIG.variables[0],
      ...existingFiles,
      id: 'system-start-files',
      key: 'files',
      label: existingFiles?.label?.trim() || 'files',
      description: '附件',
      valueType: 'file',
      system: true,
    },
    ...customVariables,
  ];
}

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
    variables: ensureSystemStartVariables(raw.variables ?? []),
  };
}

export function resolveStartNodeOutputs(_node: WorkflowCanvasNode): WorkflowOutputSchema[] {
  return START_NODE_OUTPUTS;
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
      ...(variable.maxLength != null ? { maxLength: variable.maxLength } : {}),
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
    variables: ensureSystemStartVariables(
      variables.map((variable, index) => ({
          id: `start-var-${variable.key || index}`,
          key: variable.key,
          label: variable.label || variable.key,
          valueType: variable.valueType,
          required: variable.required,
          description: variable.description,
          defaultValue: variable.defaultValue,
          maxLength: variable.maxLength,
          system: variable.key === 'files',
        })),
    ),
  });
}

export function validateStartNode(node: WorkflowCanvasNode) {
  const config = normalizeStartConfig(node.data.config);
  const customVariables = config.variables.filter((variable) => !isSystemStartVariable(variable));
  const keys = customVariables.map((variable) => variable.key.trim()).filter(Boolean);
  const errors: string[] = [];
  if (customVariables.some((variable) => !variable.key.trim())) {
    errors.push('开始节点自定义变量名不能为空');
  }
  if (new Set(keys).size !== keys.length) errors.push('开始节点输入变量名不能重复');
  return errors;
}
