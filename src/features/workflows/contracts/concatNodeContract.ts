import type {
  ConcatNodeConfig,
  TemplateInputVariable,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowOutputSchema,
  WorkflowValueType,
} from '../types';
import { moduleRefToString, parseVariableRefs, stringToModuleRef } from '../utils/variableRefs';
import { createCanvasNode, DEFAULT_MODULE_VERSION, parseStringInput } from './shared';

const RESERVED_INPUT_KEYS = new Set(['system_addInputParam', 'template', 'system_textareaInput']);
export const TEMPLATE_VALUE_TYPES: WorkflowValueType[] = [
  'string', 'number', 'boolean', 'object', 'any',
  'arrayString', 'arrayNumber', 'arrayBoolean', 'arrayObject', 'arrayAny',
];

export const DEFAULT_CONCAT_CONFIG: ConcatNodeConfig = {
  template: '{{ arg1 }}',
  inputVariables: [{
    id: 'template-input-0',
    key: 'arg1',
    label: 'arg1',
    value: '',
    required: true,
    valueType: 'string',
  }],
};

export const CONCAT_NODE_DESCRIPTION = '使用 Jinja2 模板将多个变量转换、格式化为结构化文本';
export const CONCAT_NODE_OUTPUTS: WorkflowOutputSchema[] = [
  { key: 'system_text', label: '模板输出', valueType: 'string' },
];

function normalizeInputVariables(value: unknown): TemplateInputVariable[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.map((raw, index) => {
    const item = (raw ?? {}) as Partial<TemplateInputVariable>;
    const preferred = String(item.id ?? '').trim();
    const id = preferred && !seen.has(preferred) ? preferred : `template-input-${index}`;
    seen.add(id);
    const valueType = TEMPLATE_VALUE_TYPES.includes(item.valueType as WorkflowValueType)
      ? item.valueType as WorkflowValueType
      : 'string';
    return {
      id,
      key: String(item.key ?? ''),
      label: String(item.label ?? item.key ?? ''),
      value: String(item.value ?? ''),
      required: item.required ?? true,
      valueType,
    };
  });
}

export function normalizeConcatConfig(config: unknown): ConcatNodeConfig {
  const raw = (config ?? {}) as Partial<ConcatNodeConfig>;
  return {
    template: typeof raw.template === 'string' ? raw.template : DEFAULT_CONCAT_CONFIG.template,
    inputVariables: raw.inputVariables === undefined
      ? DEFAULT_CONCAT_CONFIG.inputVariables.map((item) => ({ ...item }))
      : normalizeInputVariables(raw.inputVariables),
  };
}

function migrateLegacyTemplate(template: string): ConcatNodeConfig {
  const refs = [...new Map(parseVariableRefs(template).map((ref) => [ref.raw, ref])).values()];
  const inputVariables = refs.map((ref, index) => ({
    id: `template-input-${index}`,
    key: `arg${index + 1}`,
    label: `arg${index + 1}`,
    value: ref.raw,
    required: true,
    valueType: 'any' as const,
  }));
  return {
    template: refs.reduce(
      (current, ref, index) => current.split(ref.raw).join(`{{ arg${index + 1} }}`),
      template,
    ),
    inputVariables,
  };
}

export function serializeConcatNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeConcatConfig(node.data.config);
  return {
    flowNodeType: 'templateTransform',
    avatar: 'core/workflow/template/templateTransform',
    name: node.data.label,
    intro: CONCAT_NODE_DESCRIPTION,
    version: DEFAULT_MODULE_VERSION,
    nodeId: node.id,
    position: node.position,
    showStatus: true,
    inputs: [
      {
        key: 'system_addInputParam',
        label: '',
        valueType: 'dynamic',
        required: false,
        renderTypeList: ['addInputParam'],
        customInputConfig: {
          selectValueTypeList: TEMPLATE_VALUE_TYPES,
          showDefaultValue: false,
          showDescription: false,
        },
        description: '模板中通过变量名引用，如 {{ customer }}',
      },
      {
        key: 'template',
        label: '模板内容',
        valueType: 'string',
        required: true,
        renderTypeList: ['custom'],
        value: config.template,
        placeholder: '使用 Jinja2 语法编写模板',
      },
      ...config.inputVariables.filter((item) => item.key.trim()).map((item) => ({
        key: item.key.trim(),
        label: item.label.trim() || item.key.trim(),
        valueType: item.valueType,
        required: item.required,
        renderTypeList: ['reference'],
        value: stringToModuleRef(item.value),
        canEdit: true,
      })),
    ],
    outputs: [{
      id: 'system_text',
      key: 'system_text',
      type: 'static',
      valueType: 'string',
      label: '模板输出',
      description: 'Jinja2 渲染后的文本结果',
    }],
  };
}

export function parseConcatModule(module: WorkflowModule) {
  const inputs = module.inputs ?? [];
  const template = parseStringInput(inputs, 'template');
  const legacyTemplate = parseStringInput(inputs, 'system_textareaInput');
  const inputVariables = inputs
    .filter((input) => input.key && !RESERVED_INPUT_KEYS.has(input.key))
    .map((input, index) => ({
      id: `template-input-${index}`,
      key: input.key,
      label: input.label ?? input.key,
      value: moduleRefToString(input.value),
      required: Boolean(input.required),
      valueType: TEMPLATE_VALUE_TYPES.includes(input.valueType as WorkflowValueType)
        ? input.valueType as WorkflowValueType
        : 'string',
    }));
  const config = template
    ? normalizeConcatConfig({ template, inputVariables })
    : migrateLegacyTemplate(legacyTemplate);
  const node = createCanvasNode('concat', module, config);
  node.data.description = CONCAT_NODE_DESCRIPTION;
  return node;
}

export function validateConcatNode(node: WorkflowCanvasNode) {
  const config = normalizeConcatConfig(node.data.config);
  const errors: string[] = [];
  if (!config.template.trim()) errors.push(`节点 ${node.data.label} 的模板内容不能为空`);
  const keys = config.inputVariables.map((item) => item.key.trim()).filter(Boolean);
  if (config.inputVariables.some((item) => !item.key.trim())) {
    errors.push(`节点 ${node.data.label} 存在未命名的输入变量`);
  }
  if (new Set(keys).size !== keys.length) errors.push(`节点 ${node.data.label} 的输入变量名不能重复`);
  config.inputVariables.forEach((item) => {
    if (item.required && !item.value.trim()) {
      errors.push(`节点 ${node.data.label} 的必填输入变量 ${item.key || '未命名项'} 不能为空`);
    }
  });
  return errors;
}
