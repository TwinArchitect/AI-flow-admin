import type {
  ReadFilesNodeConfig,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowModuleOutput,
  WorkflowOutputSchema,
} from '../types';
import { moduleRefToString, parseVariableRef, stringToModuleRef } from '../utils/variableRefs';
import { createCanvasNode, DEFAULT_MODULE_VERSION, parseBooleanInput, parseInputValue } from './shared';

export const READ_FILES_NODE_DESCRIPTION = '读取并解析用户上传的文件内容';

export const READ_FILES_NODE_OUTPUTS: WorkflowOutputSchema[] = [
  { key: 'fileContent', label: '文件内容', valueType: 'string' },
  { key: 'system_error_text', label: '错误信息', valueType: 'string' },
];

const READ_FILES_MODULE_OUTPUTS: WorkflowModuleOutput[] = [
  {
    id: 'fileContent',
    key: 'fileContent',
    type: 'static',
    valueType: 'string',
    label: '文件内容',
    description: '解析出的文件文本内容',
  },
  {
    id: 'system_error_text',
    key: 'system_error_text',
    type: 'error',
    valueType: 'string',
    label: 'workflow:error_text',
  },
];

export function createDefaultReadFilesConfig(): ReadFilesNodeConfig {
  return { filePathRefs: [], smartParse: false, catchError: false };
}

export function normalizeReadFilesConfig(config: unknown): ReadFilesNodeConfig {
  const raw = (config ?? {}) as Partial<ReadFilesNodeConfig>;
  const refs = Array.isArray(raw.filePathRefs)
    ? raw.filePathRefs.map((item) => String(item ?? '').trim()).filter(Boolean)
    : [];
  return {
    filePathRefs: refs[0] ? [refs[0]] : [],
    smartParse: Boolean(raw.smartParse),
    catchError: Boolean(raw.catchError),
  };
}

function parseFileRefs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(moduleRefToString).filter((item) => item.trim());
}

export function serializeReadFilesNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeReadFilesConfig(node.data.config);
  return {
    flowNodeType: 'readFiles',
    avatar: 'core/workflow/template/readFiles',
    name: node.data.label,
    intro: READ_FILES_NODE_DESCRIPTION,
    version: DEFAULT_MODULE_VERSION,
    nodeId: node.id,
    position: node.position,
    showStatus: true,
    catchError: config.catchError,
    inputs: [
      {
        key: 'fileUrlList',
        label: 'fileUrlList',
        valueType: 'arrayString',
        required: true,
        renderTypeList: ['reference'],
        value: config.filePathRefs.map(stringToModuleRef),
        description: '要解析的文件路径列表',
        toolDescription: '要解析的文件路径列表',
      },
      {
        key: 'smartParse',
        label: 'smartParse',
        valueType: 'boolean',
        required: false,
        renderTypeList: ['switch'],
        value: config.smartParse,
        description: '通过 OCR 或多模态模型进行智能解析',
        toolDescription: '开启智能解析',
      },
    ],
    outputs: READ_FILES_MODULE_OUTPUTS.map((output) => ({ ...output })),
  };
}

export function parseReadFilesModule(module: WorkflowModule) {
  const inputs = module.inputs ?? [];
  const node = createCanvasNode('readFiles', module, normalizeReadFilesConfig({
    filePathRefs: parseFileRefs(parseInputValue(inputs, 'fileUrlList')),
    smartParse: parseBooleanInput(inputs, 'smartParse', false),
    catchError: Boolean(module.catchError),
  }));
  node.data.description = READ_FILES_NODE_DESCRIPTION;
  return node;
}

export function getReadFilesReferences(node: WorkflowCanvasNode) {
  const config = normalizeReadFilesConfig(node.data.config);
  return config.filePathRefs.map((value) => ({
    value,
    context: `节点 ${node.data.label} 的文件引用`,
  }));
}

export function validateReadFilesNode(node: WorkflowCanvasNode) {
  const config = normalizeReadFilesConfig(node.data.config);
  const ref = config.filePathRefs[0] ?? '';
  if (!ref.trim()) return [`节点 ${node.data.label} 缺少文件引用`];
  if (!parseVariableRef(ref)) return [`节点 ${node.data.label} 必须选择有效的文件变量`];
  return [];
}
