import type {
  DatasetSearchMode,
  DatasetSearchNodeConfig,
  DatasetSearchSelectedItem,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowModuleInput,
  WorkflowModuleOutput,
  WorkflowOutputSchema,
} from '../types';
import { moduleRefToString, parseVariableRefs, stringToModuleRef } from '../utils/variableRefs';
import {
  createCanvasNode,
  DEFAULT_MODULE_VERSION,
  parseBooleanInput,
  parseInputValue,
  parseNumberInput,
  parseStringInput,
} from './shared';

export const DATASET_SEARCH_NODE_DESCRIPTION = '从所选知识库中检索与问题相关的参考内容';
export const DATASET_SEARCH_LIMIT_MIN = 1;
export const DATASET_SEARCH_LIMIT_MAX = 50;

export const DATASET_SEARCH_NODE_OUTPUTS: WorkflowOutputSchema[] = [
  { key: 'quoteQA', label: '知识库引用', valueType: 'datasetQuote' },
  { key: 'system_error_text', label: '错误信息', valueType: 'string' },
];

const MODULE_OUTPUTS: WorkflowModuleOutput[] = [
  {
    id: 'quoteQA', key: 'quoteQA', type: 'static', valueType: 'datasetQuote',
    label: '知识库引用', description: '知识库检索结果；没有命中时返回空数组',
    valueDesc: '{ id; datasetId; collectionId; sourceName; q; a }[]',
  },
  {
    id: 'system_error_text', key: 'system_error_text', type: 'error', valueType: 'string',
    label: 'workflow:error_text',
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeMode(value: unknown): DatasetSearchMode {
  const mode = String(value ?? 'mixedRecall');
  if (mode.includes('mixedRecall')) return 'mixedRecall';
  if (mode.includes('fullTextRecall')) return 'fullTextRecall';
  if (mode.includes('embedding')) return 'embedding';
  return 'mixedRecall';
}

function normalizeDatasets(value: unknown): DatasetSearchSelectedItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const datasetId = String(row.datasetId ?? row.id ?? '').trim();
    if (!datasetId) return [];
    return [{
      datasetId,
      name: row.name == null ? undefined : String(row.name),
      avatar: row.avatar == null ? undefined : String(row.avatar),
      isDeleted: Boolean(row.isDeleted),
    }];
  });
}

export function createDefaultDatasetSearchConfig(): DatasetSearchNodeConfig {
  return {
    datasets: [], similarity: 0.4, limit: 3, searchMode: 'mixedRecall',
    embeddingWeight: 0.38, usingReRank: true, rerankModel: '', rerankWeight: 0.5,
    searchInput: { valueMode: 'reference', value: '' }, catchError: false,
  };
}

export function normalizeDatasetSearchConfig(config: unknown): DatasetSearchNodeConfig {
  const defaults = createDefaultDatasetSearchConfig();
  const raw = (config ?? {}) as Partial<DatasetSearchNodeConfig>;
  return {
    datasets: normalizeDatasets(raw.datasets),
    similarity: clamp(Number(raw.similarity ?? defaults.similarity), 0, 1),
    limit: Math.round(clamp(Number(raw.limit ?? defaults.limit), DATASET_SEARCH_LIMIT_MIN, DATASET_SEARCH_LIMIT_MAX)),
    searchMode: normalizeMode(raw.searchMode),
    embeddingWeight: clamp(Number(raw.embeddingWeight ?? defaults.embeddingWeight), 0, 1),
    usingReRank: Boolean(raw.usingReRank ?? defaults.usingReRank),
    rerankModel: String(raw.rerankModel ?? ''),
    rerankWeight: clamp(Number(raw.rerankWeight ?? defaults.rerankWeight), 0, 1),
    searchInput: {
      valueMode: raw.searchInput?.valueMode === 'input' ? 'input' : 'reference',
      value: String(raw.searchInput?.value ?? ''),
    },
    catchError: Boolean(raw.catchError),
  };
}

function serializeSearchInput(config: DatasetSearchNodeConfig): WorkflowModuleInput {
  if (config.searchInput.valueMode === 'input') {
    return {
      key: 'datasetSearchInput', label: '检索内容', valueType: 'arrayString', required: true,
      renderTypeList: ['reference', 'textarea'], selectedTypeIndex: 1,
      toolDescription: '检索词或检索语句', value: config.searchInput.value,
    };
  }
  return {
    key: 'datasetSearchInput', label: '检索内容', valueType: 'arrayString', required: true,
    renderTypeList: ['reference', 'textarea'], selectedTypeIndex: 0,
    toolDescription: '检索词或检索语句',
    value: parseVariableRefs(config.searchInput.value).map((ref) => stringToModuleRef(ref.raw)),
  };
}

export function serializeDatasetSearchNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeDatasetSearchConfig(node.data.config);
  const hidden = (key: string, valueType: string, value: unknown): WorkflowModuleInput => ({
    key, label: '', valueType, renderTypeList: ['hidden'], value,
  });
  return {
    flowNodeType: 'datasetSearchNode', avatar: 'core/workflow/template/datasetSearch',
    name: node.data.label, intro: DATASET_SEARCH_NODE_DESCRIPTION, version: DEFAULT_MODULE_VERSION,
    nodeId: node.id, position: node.position, showStatus: true, catchError: config.catchError,
    inputs: [
      {
        key: 'datasets', label: '选择知识库', valueType: 'selectDataset', required: true,
        renderTypeList: ['selectDataset'], selectedTypeIndex: 0,
        value: config.datasets.map((item) => ({ ...item })),
      },
      hidden('similarity', 'number', config.similarity),
      hidden('limit', 'number', config.limit),
      hidden('searchMode', 'string', config.searchMode),
      hidden('embeddingWeight', 'number', config.embeddingWeight),
      hidden('usingReRank', 'boolean', config.usingReRank),
      hidden('rerankModel', 'string', config.rerankModel),
      hidden('rerankWeight', 'number', config.rerankWeight),
      serializeSearchInput(config),
    ],
    outputs: MODULE_OUTPUTS.map((output) => ({ ...output })),
  };
}

function parseSearchInput(inputs: WorkflowModuleInput[]) {
  const input = inputs.find((item) => item.key === 'datasetSearchInput');
  if (input?.selectedTypeIndex === 1) {
    return { valueMode: 'input' as const, value: input.value == null ? '' : String(input.value) };
  }
  const raw = input?.value;
  const values = Array.isArray(raw) ? raw.map(moduleRefToString).filter(Boolean) : [];
  return { valueMode: 'reference' as const, value: values.join(' ') };
}

export function parseDatasetSearchModule(module: WorkflowModule) {
  const inputs = module.inputs ?? [];
  const node = createCanvasNode('knowledge', module, normalizeDatasetSearchConfig({
    datasets: parseInputValue(inputs, 'datasets'),
    similarity: parseNumberInput(inputs, 'similarity', 0.4),
    limit: parseNumberInput(inputs, 'limit', 3),
    searchMode: parseStringInput(inputs, 'searchMode'),
    embeddingWeight: parseNumberInput(inputs, 'embeddingWeight', 0.38),
    usingReRank: parseBooleanInput(inputs, 'usingReRank', true),
    rerankModel: parseStringInput(inputs, 'rerankModel'),
    rerankWeight: parseNumberInput(inputs, 'rerankWeight', 0.5),
    searchInput: parseSearchInput(inputs),
    catchError: Boolean(module.catchError),
  }));
  node.data.description = DATASET_SEARCH_NODE_DESCRIPTION;
  return node;
}

export function getDatasetSearchReferences(node: WorkflowCanvasNode) {
  const config = normalizeDatasetSearchConfig(node.data.config);
  if (config.searchInput.valueMode !== 'reference') return [];
  return parseVariableRefs(config.searchInput.value).map((ref) => ({
    value: ref.raw, context: `节点 ${node.data.label} 的检索内容`,
  }));
}

export function validateDatasetSearchNode(node: WorkflowCanvasNode) {
  const config = normalizeDatasetSearchConfig(node.data.config);
  const errors: string[] = [];
  if (!config.datasets.length) errors.push(`节点 ${node.data.label} 至少选择一个知识库`);
  if (!config.searchInput.value.trim()) errors.push(`节点 ${node.data.label} 缺少检索内容`);
  if (config.searchInput.valueMode === 'reference' && !parseVariableRefs(config.searchInput.value).length) {
    errors.push(`节点 ${node.data.label} 必须选择有效的检索变量`);
  }
  if (config.usingReRank && !config.rerankModel.trim()) {
    errors.push(`节点 ${node.data.label} 已开启结果重排，但未选择 Rerank 模型`);
  }
  return errors;
}
