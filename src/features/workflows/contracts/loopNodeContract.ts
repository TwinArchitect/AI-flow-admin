import type {
  LoopCustomOutput,
  LoopNodeConfig,
  LoopStartNodeConfig,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowOutputSchema,
  WorkflowValueType,
} from '../types';
import { moduleRefToString, parseVariableRef, stringToModuleRef } from '../utils/variableRefs';
import { createCanvasNode, DEFAULT_MODULE_VERSION } from './shared';

export const LOOP_NODE_DESCRIPTION = '重复执行循环体内节点，并按执行顺序收集每轮结果';
export const LOOP_WIDTH = 880;
export const LOOP_HEIGHT = 520;
export const LOOP_INPUT_HEIGHT = 172;

export const LOOP_START_OUTPUTS: WorkflowOutputSchema[] = [
  { key: 'currentIndex', label: '当前索引', valueType: 'number' },
  { key: 'currentItem', label: '当前项', valueType: 'object' },
];

export const LOOP_FIXED_OUTPUTS: WorkflowOutputSchema[] = [{ key: 'results', label: '循环结果', valueType: 'arrayString' }];

const LOOP_RESERVED_INPUTS = new Set([
  'loopOutputSource',
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
    loopOutputSource: '',
    childrenNodeIds: [],
    nodeWidth: LOOP_WIDTH,
    nodeHeight: LOOP_HEIGHT,
    loopNodeInputHeight: LOOP_INPUT_HEIGHT,
    catchError: false,
  };
}

export function createDefaultLoopStartConfig(mode: LoopStartNodeConfig['loopRunMode'] = 'array'): LoopStartNodeConfig {
  return { loopRunMode: mode, loopStartInput: '' };
}

export function normalizeLoopConfig(config: unknown): LoopNodeConfig {
  const raw = (config ?? {}) as Partial<LoopNodeConfig>;
  const outputs = Array.isArray(raw.customOutputs) ? raw.customOutputs : [];
  return {
    loopRunMode: raw.loopRunMode === 'conditional' ? 'conditional' : 'array',
    loopRunInputArray: String(raw.loopRunInputArray ?? ''),
    loopOutputSource: String(raw.loopOutputSource ?? outputs[0]?.value ?? ''),
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
    loopRunMode: raw.loopRunMode === 'conditional' ? 'conditional' : 'array',
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
  return Array.isArray(ref) ? [ref] : value.trim() || [[]];
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

export function loopOutputs(_config?: unknown): WorkflowOutputSchema[] {
  return LOOP_FIXED_OUTPUTS.map((output) => ({ ...output }));
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
      { key: 'loopRunMode', label: 'workflow:loop_run_mode', valueType: 'string', required: true, renderTypeList: ['select'], value: config.loopRunMode },
      { key: 'loopRunInputArray', label: 'workflow:loop_run_input_array', valueType: 'arrayObject', required: true, renderTypeList: ['reference'], value: serializeLoopArray(config.loopRunInputArray) },
      { key: 'loopOutputSource', label: '收集结果', valueType: 'any', required: true, renderTypeList: ['reference'], value: stringToModuleRef(config.loopOutputSource) },
      { key: 'childrenNodeIdList', label: '', valueType: 'arrayString', renderTypeList: ['hidden'], value: config.childrenNodeIds },
      { key: 'nodeWidth', label: '', valueType: 'number', renderTypeList: ['hidden'], value: config.nodeWidth },
      { key: 'nodeHeight', label: '', valueType: 'number', renderTypeList: ['hidden'], value: config.nodeHeight },
      { key: 'loopNodeInputHeight', label: '', valueType: 'number', renderTypeList: ['hidden'], value: config.loopNodeInputHeight },
    ],
    outputs: [
      { id: 'system_error_text', key: 'system_error_text', type: 'error', valueType: 'string', label: 'workflow:error_text' },
      { id: 'results', key: 'results', type: 'static', valueType: 'arrayString', label: '循环结果' },
    ],
  };
}

export function parseLoopNode(module: WorkflowModule) {
  const input = (key: string) => (module.inputs ?? []).find((item) => item.key === key)?.value;
  const node = createCanvasNode('loop', module, normalizeLoopConfig({
    loopRunMode: input('loopRunMode'),
    loopRunInputArray: parseLoopArray(input('loopRunInputArray')),
    loopOutputSource: (module.inputs ?? []).some((item) => item.key === 'loopOutputSource') ? moduleRefToString(input('loopOutputSource')) : parseCustomOutputs(module)[0]?.value ?? '',
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
      { key: 'loopRunMode', valueType: 'string', renderTypeList: ['hidden'], value: config.loopRunMode },
      { key: 'loopStartInput', valueType: 'any', renderTypeList: ['hidden'], value: config.loopStartInput },
      { key: 'loopStartIndex', valueType: 'number', renderTypeList: ['hidden'], value: config.loopStartIndex },
    ],
    outputs: LOOP_START_OUTPUTS.map((item) => ({ id: item.key, key: item.key, type: 'static', valueType: item.valueType, label: item.label })),
  };
}

export function parseLoopStartNode(module: WorkflowModule) {
  const input = (key: string) => (module.inputs ?? []).find((item) => item.key === key)?.value;
  return createCanvasNode('loopStart', module, normalizeLoopStartConfig({
    loopRunMode: input('loopRunMode'),
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
    ...(config.loopRunMode === 'array' ? [{ value: config.loopRunInputArray, context: `节点 ${node.data.label} 的循环数组`, acceptedValueTypes: ['array', 'arrayObject', 'arrayString', 'arrayNumber', 'arrayBoolean', 'arrayAny'] as WorkflowValueType[] }] : []),
    { value: config.loopOutputSource, context: `节点 ${node.data.label} 的收集结果`, loopCollection: true },
  ];
}

export function validateLoopNode(node: WorkflowCanvasNode) {
  const config = normalizeLoopConfig(node.data.config);
  const errors: string[] = [];
  if (config.loopRunMode === 'array' && !parseVariableRef(config.loopRunInputArray)) errors.push(`节点 ${node.data.label} 必须选择有效的数组变量`);
  if (!parseVariableRef(config.loopOutputSource)) errors.push(`节点 ${node.data.label} 必须选择每轮收集的输出变量`);
  return errors;
}
