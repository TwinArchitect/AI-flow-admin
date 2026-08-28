import type {
  LoopCustomOutput,
  LoopNodeConfig,
  LoopStartNodeConfig,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowModuleInput,
  WorkflowModuleOutput,
  WorkflowOutputSchema,
  WorkflowValueType,
} from '../types';
import { moduleRefToString, parseVariableRef, stringToModuleRef } from '../utils/variableRefs';
import { createCanvasNode, DEFAULT_MODULE_VERSION } from './shared';

export const LOOP_NODE_DESCRIPTION = '遍历数组并依次执行循环体内的节点';
export const LOOP_WIDTH = 760;
export const LOOP_HEIGHT = 420;
export const LOOP_INPUT_HEIGHT = 172;

export const LOOP_START_OUTPUTS: WorkflowOutputSchema[] = [
  { key: 'currentIndex', label: '当前索引', valueType: 'number' },
  { key: 'currentItem', label: '当前项', valueType: 'any' },
];

const LOOP_RESERVED_INPUTS = new Set([
  'loopRunMode',
  'loopRunInputArray',
  'loopCustomOutputs',
  'childrenNodeIdList',
  'nodeWidth',
  'nodeHeight',
  'loopNodeInputHeight',
]);

function rowId(index: number) {
  return `loop-output-${Date.now()}-${index}`;
}

export function createDefaultLoopConfig(): LoopNodeConfig {
  return {
    loopRunMode: 'array',
    loopRunInputArray: '',
    customOutputs: [],
    childrenNodeIds: [],
    nodeWidth: LOOP_WIDTH,
    nodeHeight: LOOP_HEIGHT,
    loopNodeInputHeight: LOOP_INPUT_HEIGHT,
    catchError: false,
  };
}

export function createDefaultLoopStartConfig(): LoopStartNodeConfig {
  return { loopRunMode: 'array', loopStartInput: '' };
}

export function normalizeLoopConfig(config: unknown): LoopNodeConfig {
  const raw = (config ?? {}) as Partial<LoopNodeConfig>;
  const outputs = Array.isArray(raw.customOutputs) ? raw.customOutputs : [];
  return {
    loopRunMode: 'array',
    loopRunInputArray: String(raw.loopRunInputArray ?? ''),
    customOutputs: outputs.map((item, index) => ({
      id: String(item.id || rowId(index)),
      key: String(item.key ?? ''),
      label: String(item.label ?? item.key ?? ''),
      valueType: (item.valueType || 'object') as WorkflowValueType,
      value: String(item.value ?? ''),
    })),
    childrenNodeIds: Array.isArray(raw.childrenNodeIds) ? raw.childrenNodeIds.map(String) : [],
    nodeWidth: Number(raw.nodeWidth) || LOOP_WIDTH,
    nodeHeight: Number(raw.nodeHeight) || LOOP_HEIGHT,
    loopNodeInputHeight: Number(raw.loopNodeInputHeight) || LOOP_INPUT_HEIGHT,
    catchError: false,
  };
}

export function normalizeLoopStartConfig(config: unknown): LoopStartNodeConfig {
  const raw = (config ?? {}) as Partial<LoopStartNodeConfig>;
  return {
    loopRunMode: 'array',
    loopStartInput: String(raw.loopStartInput ?? ''),
    loopStartIndex: typeof raw.loopStartIndex === 'number' ? raw.loopStartIndex : undefined,
  };
}

function parseLoopArray(value: unknown) {
  if (Array.isArray(value) && Array.isArray(value[0])) return moduleRefToString(value[0]);
  return moduleRefToString(value);
}

function serializeLoopArray(value: string) {
  const ref = stringToModuleRef(value);
  return Array.isArray(ref) ? [ref] : [[]];
}

function parseCustomOutputs(module: WorkflowModule): LoopCustomOutput[] {
  const outputMap = new Map((module.outputs ?? []).map((item) => [item.key, item]));
  return (module.inputs ?? [])
    .filter((input) => input.key && !LOOP_RESERVED_INPUTS.has(input.key))
    .map((input, index) => {
      const output = outputMap.get(input.key);
      return {
        id: output?.id || rowId(index),
        key: input.key,
        label: output?.label || input.label || input.key,
        valueType: (output?.valueType || input.valueType || 'object') as WorkflowValueType,
        value: moduleRefToString(input.value),
      };
    });
}

function dynamicInputs(config: LoopNodeConfig): WorkflowModuleInput[] {
  return config.customOutputs
    .filter((item) => item.key.trim())
    .map((item) => ({
      key: item.key.trim(),
      label: item.label.trim() || item.key.trim(),
      valueType: item.valueType,
      required: true,
      renderTypeList: ['reference'],
      value: stringToModuleRef(item.value),
      canEdit: true,
    }));
}

function dynamicOutputs(config: LoopNodeConfig): WorkflowModuleOutput[] {
  return config.customOutputs
    .filter((item) => item.key.trim())
    .map((item) => ({
      id: item.key.trim(),
      key: item.key.trim(),
      type: 'dynamic',
      valueType: item.valueType,
      label: item.label.trim() || item.key.trim(),
    }));
}

export function loopOutputs(config: unknown): WorkflowOutputSchema[] {
  return normalizeLoopConfig(config).customOutputs
    .filter((item) => item.key.trim())
    .map((item) => ({ key: item.key.trim(), label: item.label.trim() || item.key.trim(), valueType: item.valueType }));
}

export function serializeLoopNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeLoopConfig(node.data.config);
  return {
    flowNodeType: 'loopRun',
    avatar: 'core/workflow/template/loopRun',
    name: node.data.label,
    intro: LOOP_NODE_DESCRIPTION,
    version: DEFAULT_MODULE_VERSION,
    nodeId: node.id,
    position: node.position,
    showStatus: true,
    catchError: false,
    inputs: [
      { key: 'loopRunMode', label: 'workflow:loop_run_mode', valueType: 'string', required: true, renderTypeList: ['select'], value: 'array' },
      { key: 'loopRunInputArray', label: 'workflow:loop_run_input_array', valueType: 'arrayObject', required: true, renderTypeList: ['reference'], value: serializeLoopArray(config.loopRunInputArray) },
      { key: 'loopCustomOutputs', label: 'workflow:loop_custom_outputs', valueType: 'dynamic', required: false, renderTypeList: ['addInputParam'] },
      { key: 'childrenNodeIdList', label: '', valueType: 'arrayString', renderTypeList: ['hidden'], value: config.childrenNodeIds },
      { key: 'nodeWidth', label: '', valueType: 'number', renderTypeList: ['hidden'], value: config.nodeWidth },
      { key: 'nodeHeight', label: '', valueType: 'number', renderTypeList: ['hidden'], value: config.nodeHeight },
      { key: 'loopNodeInputHeight', label: '', valueType: 'number', renderTypeList: ['hidden'], value: config.loopNodeInputHeight },
      ...dynamicInputs(config),
    ],
    outputs: [
      { id: 'system_error_text', key: 'system_error_text', type: 'error', valueType: 'string', label: 'workflow:error_text' },
      ...dynamicOutputs(config),
    ],
  };
}

export function parseLoopNode(module: WorkflowModule) {
  const input = (key: string) => (module.inputs ?? []).find((item) => item.key === key)?.value;
  const node = createCanvasNode('loop', module, normalizeLoopConfig({
    loopRunInputArray: parseLoopArray(input('loopRunInputArray')),
    customOutputs: parseCustomOutputs(module),
    childrenNodeIds: Array.isArray(input('childrenNodeIdList')) ? input('childrenNodeIdList') : [],
    nodeWidth: input('nodeWidth'),
    nodeHeight: input('nodeHeight'),
    loopNodeInputHeight: input('loopNodeInputHeight'),
  }));
  const config = normalizeLoopConfig(node.data.config);
  node.style = { width: config.nodeWidth, height: config.nodeHeight };
  node.data.description = LOOP_NODE_DESCRIPTION;
  return node;
}

export function serializeLoopStartNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeLoopStartConfig(node.data.config);
  return {
    flowNodeType: 'loopRunStart',
    avatar: 'core/workflow/template/loopRunStart',
    name: node.data.label,
    intro: '',
    version: DEFAULT_MODULE_VERSION,
    nodeId: node.id,
    position: node.position,
    showStatus: false,
    inputs: [
      { key: 'loopRunMode', valueType: 'string', renderTypeList: ['hidden'], value: 'array' },
      { key: 'loopStartInput', valueType: 'any', renderTypeList: ['hidden'], value: config.loopStartInput },
      { key: 'loopStartIndex', valueType: 'number', renderTypeList: ['hidden'], value: config.loopStartIndex },
    ],
    outputs: LOOP_START_OUTPUTS.map((item) => ({ id: item.key, key: item.key, type: 'static', valueType: item.valueType, label: item.label })),
  };
}

export function parseLoopStartNode(module: WorkflowModule) {
  const input = (key: string) => (module.inputs ?? []).find((item) => item.key === key)?.value;
  return createCanvasNode('loopStart', module, normalizeLoopStartConfig({
    loopStartInput: input('loopStartInput'),
    loopStartIndex: input('loopStartIndex'),
  }));
}

export function serializeLoopBreakNode(node: WorkflowCanvasNode): WorkflowModule {
  return {
    flowNodeType: 'loopRunBreak',
    avatar: 'core/workflow/template/loopRunBreak',
    name: node.data.label,
    intro: '执行到此节点时终止当前循环',
    version: DEFAULT_MODULE_VERSION,
    nodeId: node.id,
    position: node.position,
    showStatus: false,
    inputs: [],
    outputs: [],
  };
}

export function parseLoopBreakNode(module: WorkflowModule) {
  return createCanvasNode('loopBreak', module, {});
}

export function getLoopReferences(node: WorkflowCanvasNode) {
  const config = normalizeLoopConfig(node.data.config);
  return [
    { value: config.loopRunInputArray, context: `节点 ${node.data.label} 的循环数组`, acceptedValueTypes: ['array', 'arrayObject', 'arrayString', 'arrayNumber', 'arrayBoolean', 'arrayAny'] as WorkflowValueType[] },
    ...config.customOutputs.map((item) => ({ value: item.value, context: `节点 ${node.data.label} 的输出 ${item.key || '未命名'}` })),
  ];
}

export function validateLoopNode(node: WorkflowCanvasNode) {
  const config = normalizeLoopConfig(node.data.config);
  const errors: string[] = [];
  if (!parseVariableRef(config.loopRunInputArray)) errors.push(`节点 ${node.data.label} 必须选择有效的数组变量`);
  const keys = config.customOutputs.map((item) => item.key.trim()).filter(Boolean);
  if (new Set(keys).size !== keys.length) errors.push(`节点 ${node.data.label} 的输出变量名不能重复`);
  config.customOutputs.forEach((item) => {
    if (!item.key.trim()) errors.push(`节点 ${node.data.label} 存在未填写变量名的循环输出`);
    if (!parseVariableRef(item.value)) errors.push(`节点 ${node.data.label} 的输出 ${item.key || '未命名'} 必须引用循环体节点变量`);
  });
  return errors;
}
