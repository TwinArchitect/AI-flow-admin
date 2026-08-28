import type {
  CodeInputVariable,
  CodeNodeConfig,
  CodeOutputVariable,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowModuleInput,
  WorkflowModuleOutput,
  WorkflowOutputSchema,
  WorkflowValueType,
} from '../types';
import { moduleRefToString, parseVariableRef, stringToModuleRef } from '../utils/variableRefs';
import { createCanvasNode, DEFAULT_MODULE_VERSION, parseStringInput } from './shared';

export const CODE_NODE_DESCRIPTION = '在沙盒中执行脚本，进行复杂数据处理与逻辑转换';

export const CODE_VALUE_TYPES: WorkflowValueType[] = [
  'string',
  'number',
  'boolean',
  'object',
  'arrayString',
  'arrayNumber',
  'arrayBoolean',
  'arrayObject',
  'arrayAny',
  'any',
  'chatHistory',
  'datasetQuote',
  'dynamic',
  'selectDataset',
  'selectApp',
];

export const CODE_FIXED_OUTPUTS: WorkflowOutputSchema[] = [
  { key: 'system_rawResponse', label: '完整响应数据', valueType: 'any' },
  { key: 'error', label: '错误信息', valueType: 'string' },
];

const DEFAULT_CODE = `function main(str1) {
  return JSON.parse(str1);
}
return main(arg0)`;

const RESERVED_INPUT_KEYS = new Set(['system_addInputParam', 'codeType', 'code']);
const RESERVED_OUTPUT_KEYS = new Set(['system_rawResponse', 'error', 'system_addOutputParam']);

const CODE_CUSTOM_INPUT_CONFIG = {
  selectValueTypeList: CODE_VALUE_TYPES,
  showDefaultValue: true,
  showDescription: false,
};

const CODE_CUSTOM_OUTPUT_CONFIG = {
  selectValueTypeList: CODE_VALUE_TYPES,
  showDefaultValue: false,
  showDescription: false,
};

function rowId(prefix: string, index: number) {
  return `${prefix}-${index}`;
}

function normalizeValueType(value: unknown, fallback: WorkflowValueType = 'string'): WorkflowValueType {
  const normalized = String(value ?? fallback) as WorkflowValueType;
  return CODE_VALUE_TYPES.includes(normalized) ? normalized : fallback;
}

function dedupeIds<T extends { id: string }>(items: T[], prefix: string) {
  const seen = new Set<string>();
  return items.map((item, index) => {
    const preferred = item.id.trim();
    const id = preferred && !seen.has(preferred) ? preferred : rowId(prefix, index);
    seen.add(id);
    return { ...item, id };
  });
}

function normalizeInputs(value: unknown): CodeInputVariable[] {
  if (!Array.isArray(value)) return [];
  return dedupeIds(value.map((raw, index) => {
    const item = (raw ?? {}) as Partial<CodeInputVariable>;
    return {
      id: String(item.id ?? rowId('code-input', index)),
      key: String(item.key ?? ''),
      label: String(item.label ?? item.key ?? ''),
      value: String(item.value ?? ''),
      required: item.required ?? true,
      valueType: normalizeValueType(item.valueType, 'any'),
    };
  }), 'code-input');
}

function normalizeOutputs(value: unknown): CodeOutputVariable[] {
  if (!Array.isArray(value)) return [];
  return dedupeIds(value.map((raw, index) => {
    const item = (raw ?? {}) as Partial<CodeOutputVariable>;
    return {
      id: String(item.id ?? rowId('code-output', index)),
      key: String(item.key ?? ''),
      label: String(item.label ?? item.key ?? ''),
      valueType: normalizeValueType(item.valueType),
    };
  }), 'code-output');
}

export function createDefaultCodeConfig(): CodeNodeConfig {
  return {
    codeType: 'js',
    code: DEFAULT_CODE,
    inputVariables: [{
      id: 'code-input-0',
      key: 'str1',
      label: 'str1',
      value: '',
      required: true,
      valueType: 'string',
    }],
    outputVariables: [{
      id: 'code-output-0',
      key: 'name',
      label: 'name',
      valueType: 'string',
    }],
    catchError: false,
  };
}

export function normalizeCodeConfig(config: unknown): CodeNodeConfig {
  const defaults = createDefaultCodeConfig();
  const raw = (config ?? {}) as Partial<CodeNodeConfig>;
  const inputs = normalizeInputs(raw.inputVariables);
  const outputs = normalizeOutputs(raw.outputVariables);
  return {
    codeType: raw.codeType === 'py' ? 'py' : 'js',
    code: typeof raw.code === 'string' ? raw.code : defaults.code,
    inputVariables: raw.inputVariables === undefined ? defaults.inputVariables : inputs,
    outputVariables: raw.outputVariables === undefined ? defaults.outputVariables : outputs,
    catchError: Boolean(raw.catchError),
  };
}

export function resolveCodeNodeOutputs(node: WorkflowCanvasNode): WorkflowOutputSchema[] {
  const custom = normalizeCodeConfig(node.data.config).outputVariables
    .filter((item) => item.key.trim())
    .map((item) => ({
      key: item.key.trim(),
      label: item.label.trim() || item.key.trim(),
      valueType: item.valueType,
    }));
  return [...CODE_FIXED_OUTPUTS, ...custom];
}

function buildCodeInputs(config: CodeNodeConfig): WorkflowModuleInput[] {
  return [
    {
      key: 'system_addInputParam',
      label: '',
      valueType: 'dynamic',
      required: false,
      customInputConfig: CODE_CUSTOM_INPUT_CONFIG,
      renderTypeList: ['addInputParam'],
      description: 'workflow:these_variables_will_be_input_parameters_for_code_execution',
      toolDescription: '',
    },
    {
      key: 'codeType',
      label: '',
      valueType: 'string',
      renderTypeList: ['hidden'],
      value: config.codeType,
    },
    {
      key: 'code',
      label: '',
      valueType: 'string',
      renderTypeList: ['custom'],
      value: config.code,
    },
    ...config.inputVariables
      .filter((item) => item.key.trim())
      .map((item) => ({
        key: item.key.trim(),
        label: item.label.trim() || item.key.trim(),
        valueType: item.valueType,
        required: item.required,
        customInputConfig: CODE_CUSTOM_INPUT_CONFIG,
        renderTypeList: ['reference'],
        value: stringToModuleRef(item.value),
        canEdit: true,
      })),
  ];
}

function buildCodeOutputs(config: CodeNodeConfig): WorkflowModuleOutput[] {
  const fixed: WorkflowModuleOutput[] = [
    {
      id: 'system_rawResponse',
      key: 'system_rawResponse',
      type: 'static',
      valueType: 'object',
      valueDesc: '',
      label: 'workflow:full_response_data',
      description: '',
    },
    {
      id: 'error',
      key: 'error',
      type: 'error',
      valueType: 'string',
      valueDesc: '',
      label: 'workflow:error_text',
      description: '',
    },
    {
      id: 'system_addOutputParam',
      key: 'system_addOutputParam',
      type: 'dynamic',
      valueType: 'dynamic',
      valueDesc: '',
      label: '',
      description: '将代码中 return 的对象作为输出，传递给后续的节点。变量名需要对应 return 的 key',
      customFieldConfig: CODE_CUSTOM_OUTPUT_CONFIG,
    },
  ];
  return [...fixed, ...config.outputVariables
    .filter((item) => item.key.trim())
    .map((item) => ({
      id: item.id,
      key: item.key.trim(),
      type: 'dynamic',
      valueType: item.valueType,
      valueDesc: '',
      label: item.label.trim() || item.key.trim(),
      description: '',
    }))];
}

export function serializeCodeNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeCodeConfig(node.data.config);
  return {
    flowNodeType: 'code',
    avatar: 'core/workflow/template/codeRun',
    name: node.data.label,
    intro: CODE_NODE_DESCRIPTION,
    version: DEFAULT_MODULE_VERSION,
    nodeId: node.id,
    position: node.position,
    showStatus: true,
    catchError: config.catchError,
    inputs: buildCodeInputs(config),
    outputs: buildCodeOutputs(config),
  };
}

export function parseCodeModule(module: WorkflowModule) {
  const inputs = module.inputs ?? [];
  const parsedInputs = inputs
    .filter((input) => input.key && !RESERVED_INPUT_KEYS.has(input.key))
    .map((input, index) => ({
      id: rowId('code-input', index),
      key: input.key,
      label: input.label ?? input.key,
      value: moduleRefToString(input.value),
      required: Boolean(input.required),
      valueType: normalizeValueType(input.valueType),
    }));
  const parsedOutputs = (module.outputs ?? [])
    .filter((output) => output.key && output.type === 'dynamic' && !RESERVED_OUTPUT_KEYS.has(output.key))
    .map((output, index) => ({
      id: output.id || rowId('code-output', index),
      key: output.key,
      label: output.label ?? output.key,
      valueType: normalizeValueType(output.valueType, 'any'),
    }));
  const defaults = createDefaultCodeConfig();
  const node = createCanvasNode('code', module, normalizeCodeConfig({
    codeType: parseStringInput(inputs, 'codeType') === 'py' ? 'py' : 'js',
    code: parseStringInput(inputs, 'code') || DEFAULT_CODE,
    inputVariables: parsedInputs.length ? parsedInputs : defaults.inputVariables,
    outputVariables: parsedOutputs.length ? parsedOutputs : defaults.outputVariables,
    catchError: Boolean(module.catchError),
  }));
  node.data.description = CODE_NODE_DESCRIPTION;
  return node;
}

export function getCodeReferences(node: WorkflowCanvasNode) {
  return normalizeCodeConfig(node.data.config).inputVariables
    .filter((item) => parseVariableRef(item.value))
    .map((item) => ({
      value: item.value,
      context: `节点 ${node.data.label} 的输入变量 ${item.key || '未命名'}`,
      acceptedValueTypes: item.valueType === 'any' || item.valueType === 'dynamic'
        ? undefined
        : [item.valueType],
    }));
}

function duplicateKeys(items: Array<{ key: string }>) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  items.forEach((item) => {
    const key = item.key.trim();
    if (!key) return;
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  });
  return [...duplicates];
}

export function validateCodeNode(node: WorkflowCanvasNode) {
  const config = normalizeCodeConfig(node.data.config);
  const errors: string[] = [];
  if (!config.code.trim()) errors.push(`节点 ${node.data.label} 缺少代码内容`);
  config.inputVariables.forEach((item, index) => {
    if (!item.key.trim()) errors.push(`节点 ${node.data.label} 的第 ${index + 1} 个输入变量缺少变量名`);
    if (item.required && !item.value.trim()) {
      errors.push(`节点 ${node.data.label} 的输入变量 ${item.key || index + 1} 缺少值`);
    }
    if (RESERVED_INPUT_KEYS.has(item.key.trim())) {
      errors.push(`节点 ${node.data.label} 的输入变量 ${item.key} 使用了系统保留名称`);
    }
  });
  config.outputVariables.forEach((item, index) => {
    if (!item.key.trim()) errors.push(`节点 ${node.data.label} 的第 ${index + 1} 个输出变量缺少变量名`);
    if (RESERVED_OUTPUT_KEYS.has(item.key.trim())) {
      errors.push(`节点 ${node.data.label} 的输出变量 ${item.key} 使用了系统保留名称`);
    }
  });
  duplicateKeys(config.inputVariables).forEach((key) => {
    errors.push(`节点 ${node.data.label} 的输入变量名 ${key} 重复`);
  });
  duplicateKeys(config.outputVariables).forEach((key) => {
    errors.push(`节点 ${node.data.label} 的输出变量名 ${key} 重复`);
  });
  return errors;
}
