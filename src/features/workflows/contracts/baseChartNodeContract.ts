import type {
  BaseChartField,
  BaseChartNodeConfig,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowModuleInput,
  WorkflowModuleOutput,
  WorkflowOutputSchema,
} from '../types';
import { moduleRefToString, parseVariableRef, stringToModuleRef } from '../utils/variableRefs';
import { createCanvasNode, DEFAULT_MODULE_VERSION, parseBooleanInput } from './shared';

export const BASE_CHART_NODE_DESCRIPTION = '根据数据生成柱状图、折线图或饼图';

export const BASE_CHART_TYPE_OPTIONS = [
  { label: '折线图', value: '折线图' },
  { label: '柱状图', value: '柱状图' },
  { label: '饼图', value: '饼图' },
] as const;

export const BASE_CHART_NODE_OUTPUTS: WorkflowOutputSchema[] = [
  { key: 'chartBase64', label: '图表 Base64', valueType: 'string' },
  { key: 'chartData', label: '图表数据', valueType: 'object' },
  { key: 'system_error_text', label: '错误信息', valueType: 'string' },
];

const BASE_CHART_MODULE_OUTPUTS: WorkflowModuleOutput[] = [
  { id: 'chartBase64', key: 'chartBase64', type: 'static', valueType: 'string', label: '图表 Base64', description: '图表图片的 Base64 编码，可用于 Markdown 嵌入展示' },
  { id: 'chartData', key: 'chartData', type: 'static', valueType: 'object', label: '图表数据', description: '图表结构化数据' },
  { id: 'system_error_text', key: 'system_error_text', type: 'error', valueType: 'string', label: 'workflow:error_text' },
];

function normalizeField(value: unknown, defaultValue = ''): BaseChartField {
  const raw = (value ?? {}) as Partial<BaseChartField>;
  return {
    valueMode: raw.valueMode === 'reference' ? 'reference' : 'input',
    value: String(raw.value ?? defaultValue),
  };
}

export function createDefaultBaseChartConfig(): BaseChartNodeConfig {
  return {
    title: normalizeField(undefined),
    xAxis: normalizeField(undefined),
    yAxis: normalizeField(undefined),
    chartType: normalizeField(undefined, '折线图'),
    outputChart: true,
    catchError: false,
  };
}

export function normalizeBaseChartConfig(config: unknown): BaseChartNodeConfig {
  const raw = (config ?? {}) as Partial<BaseChartNodeConfig>;
  return {
    title: normalizeField(raw.title),
    xAxis: normalizeField(raw.xAxis),
    yAxis: normalizeField(raw.yAxis),
    chartType: normalizeField(raw.chartType, '折线图'),
    outputChart: raw.outputChart === undefined ? true : Boolean(raw.outputChart),
    catchError: Boolean(raw.catchError),
  };
}

function buildFieldInput(
  key: string,
  field: BaseChartField,
  valueType: 'string' | 'arrayString',
  renderTypeList: string[],
  required: boolean,
): WorkflowModuleInput {
  return {
    key,
    label: key,
    valueType,
    required,
    renderTypeList,
    selectedTypeIndex: field.valueMode === 'reference' ? 1 : 0,
    value: field.valueMode === 'reference' ? stringToModuleRef(field.value) : field.value,
  };
}

function parseField(inputs: WorkflowModuleInput[], key: string): BaseChartField {
  const input = inputs.find((item) => item.key === key);
  if (!input) return normalizeField(undefined);
  const renderTypes = input.renderTypeList ?? ['input', 'reference'];
  return {
    valueMode: renderTypes[input.selectedTypeIndex ?? 0] === 'reference' ? 'reference' : 'input',
    value: moduleRefToString(input.value),
  };
}

export function serializeBaseChartNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeBaseChartConfig(node.data.config);
  return {
    flowNodeType: 'chartVisual',
    avatar: '',
    name: node.data.label,
    intro: BASE_CHART_NODE_DESCRIPTION,
    version: DEFAULT_MODULE_VERSION,
    nodeId: node.id,
    position: node.position,
    showStatus: true,
    catchError: false,
    inputs: [
      buildFieldInput('title', config.title, 'string', ['input', 'reference'], false),
      buildFieldInput('xAxis', config.xAxis, 'arrayString', ['JSONEditor', 'reference'], true),
      buildFieldInput('yAxis', config.yAxis, 'arrayString', ['JSONEditor', 'reference'], true),
      buildFieldInput('chartType', config.chartType, 'string', ['select', 'reference'], true),
      { key: 'outputChart', label: 'outputChart', valueType: 'boolean', required: false, renderTypeList: ['switch'], value: config.outputChart },
    ],
    outputs: BASE_CHART_MODULE_OUTPUTS.map((output) => ({ ...output })),
  };
}

export function parseBaseChartModule(module: WorkflowModule) {
  const inputs = module.inputs ?? [];
  const node = createCanvasNode('baseChart', module, normalizeBaseChartConfig({
    title: parseField(inputs, 'title'),
    xAxis: parseField(inputs, 'xAxis'),
    yAxis: parseField(inputs, 'yAxis'),
    chartType: parseField(inputs, 'chartType'),
    outputChart: parseBooleanInput(inputs, 'outputChart', true),
    catchError: false,
  }));
  node.data.description = BASE_CHART_NODE_DESCRIPTION;
  return node;
}

export function getBaseChartReferences(node: WorkflowCanvasNode) {
  const config = normalizeBaseChartConfig(node.data.config);
  return [
    { field: config.title, label: '图表标题', acceptedValueTypes: ['string' as const] },
    { field: config.xAxis, label: 'X 轴', acceptedValueTypes: ['arrayString' as const, 'arrayNumber' as const, 'arrayAny' as const, 'array' as const] },
    { field: config.yAxis, label: 'Y 轴', acceptedValueTypes: ['arrayString' as const, 'arrayNumber' as const, 'arrayAny' as const, 'array' as const] },
    { field: config.chartType, label: '图表类型', acceptedValueTypes: ['string' as const] },
  ].filter((item) => item.field.valueMode === 'reference' && parseVariableRef(item.field.value))
    .map((item) => ({ value: item.field.value, context: `节点 ${node.data.label} 的${item.label}`, acceptedValueTypes: item.acceptedValueTypes }));
}

export function validateBaseChartNode(node: WorkflowCanvasNode) {
  const config = normalizeBaseChartConfig(node.data.config);
  const errors: string[] = [];
  const validateField = (field: BaseChartField, label: string, required: boolean) => {
    if (required && !field.value.trim()) errors.push(`节点 ${node.data.label} 缺少${label}`);
    if (field.valueMode === 'reference' && field.value.trim() && !parseVariableRef(field.value)) {
      errors.push(`节点 ${node.data.label} 的${label}必须选择有效的上游变量`);
    }
  };
  validateField(config.title, '图表标题', false);
  validateField(config.xAxis, 'X 轴数据', true);
  validateField(config.yAxis, 'Y 轴数据', true);
  validateField(config.chartType, '图表类型', true);
  return errors;
}
