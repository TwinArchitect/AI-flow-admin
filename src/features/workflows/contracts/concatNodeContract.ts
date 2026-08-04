import type {
  ConcatNodeConfig,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowOutputSchema,
} from '../types';
import { createCanvasNode, DEFAULT_MODULE_VERSION, parseStringInput } from './shared';

export const DEFAULT_CONCAT_CONFIG: ConcatNodeConfig = {
  template: '',
};

export const CONCAT_NODE_DESCRIPTION = '将固定文本或上游变量拼接为完整字符串';

export const CONCAT_NODE_OUTPUTS: WorkflowOutputSchema[] = [
  { key: 'system_text', label: '拼接结果', valueType: 'string' },
];

export function normalizeConcatConfig(config: unknown): ConcatNodeConfig {
  const raw = (config ?? {}) as Partial<ConcatNodeConfig>;
  return {
    template: typeof raw.template === 'string' ? raw.template : '',
  };
}

export function serializeConcatNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeConcatConfig(node.data.config);
  return {
    flowNodeType: 'textEditor',
    avatar: 'core/workflow/template/textConcat',
    name: node.data.label,
    intro: CONCAT_NODE_DESCRIPTION,
    version: DEFAULT_MODULE_VERSION,
    nodeId: node.id,
    position: node.position,
    inputs: [
      {
        key: 'system_textareaInput',
        label: '拼接文本',
        valueType: 'string',
        required: true,
        placeholder: '可输入 / 唤起变量列表',
        renderTypeList: ['textarea'],
        value: config.template,
      },
    ],
    outputs: [
      {
        id: 'system_text',
        key: 'system_text',
        label: '拼接结果',
        type: 'static',
        valueType: 'string',
        valueDesc: '',
        description: '',
      },
    ],
  };
}

export function parseConcatModule(module: WorkflowModule) {
  const node = createCanvasNode('concat', module, {
    template: parseStringInput(module.inputs ?? [], 'system_textareaInput'),
  });
  node.data.description = CONCAT_NODE_DESCRIPTION;
  return node;
}

export function validateConcatNode(node: WorkflowCanvasNode) {
  const { template } = normalizeConcatConfig(node.data.config);
  return template.trim() ? [] : [`节点 ${node.data.label} 的拼接模板不能为空`];
}
