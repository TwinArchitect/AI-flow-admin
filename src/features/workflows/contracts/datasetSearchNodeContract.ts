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

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function parseRerankEnabled(inputs: WorkflowModuleInput[]) {
  const value = parseInputValue(inputs, 'usingReRank');
  if (value === true || value === 'true' || value === 1) return true;
  if (value === false || value === 'false' || value === 0) return false;
  return true;
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
  return value.flatMap<DatasetSearchSelectedItem>((item) => {
    if (typeof item === 'string') return item.trim() ? [{ datasetId: item.trim(), isDeleted: false }] : [];
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
    datasetInputMode: 'select', datasetIds: { valueMode: 'reference', value: '' },
    retrievalScope: 'all', documentInputMode: 'select', documents: [], documentIds: { valueMode: 'reference', value: '' },
    datasets: [], similarity: 0.4, limit: 3, searchMode: 'mixedRecall',
    embeddingWeight: 0.38, usingReRank: true, rerankModel: '', rerankWeight: 0.5,
    searchInput: { valueMode: 'reference', value: '' }, catchError: false,
  };
}

export function normalizeDatasetSearchConfig(config: unknown): DatasetSearchNodeConfig {
  const defaults = createDefaultDatasetSearchConfig();
  const raw = (config ?? {}) as Partial<DatasetSearchNodeConfig>;
  return {
    datasetInputMode: raw.datasetInputMode === 'reference' ? 'reference' : 'select',
    datasetIds: { valueMode: 'reference', value: String(raw.datasetIds?.value ?? '') },
    retrievalScope: raw.retrievalScope === 'files' ? 'files' : 'all',
    documentInputMode: raw.datasetInputMode === 'reference' || raw.documentInputMode === 'reference' ? 'reference' : 'select',
    documents: Array.isArray(raw.documents) ? raw.documents.filter(item => item?.documentId && item?.datasetId).filter((item, index, items) => items.findIndex(other => other.documentId === item.documentId) === index) : [],
    documentIds: { valueMode: 'reference', value: String(raw.documentIds?.value ?? '') },
    datasets: normalizeDatasets(raw.datasets),
    similarity: round2(clamp(Number(raw.similarity ?? defaults.similarity), 0, 1)),
    limit: Math.round(clamp(Number(raw.limit ?? defaults.limit), DATASET_SEARCH_LIMIT_MIN, DATASET_SEARCH_LIMIT_MAX)),
    searchMode: normalizeMode(raw.searchMode),
    embeddingWeight: round2(clamp(Number(raw.embeddingWeight ?? defaults.embeddingWeight), 0, 1)),
    usingReRank: Boolean(raw.usingReRank ?? defaults.usingReRank),
    rerankModel: String(raw.rerankModel ?? ''),
    rerankWeight: round2(clamp(Number(raw.rerankWeight ?? defaults.rerankWeight), 0, 1)),
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
      hidden('datasetInputMode', 'string', config.datasetInputMode),
      hidden('datasetSelection', 'any', config.datasets),
      hidden('retrievalScope', 'string', config.retrievalScope),
      { key: 'documentIds', label: '文件 ID', valueType: 'any', renderTypeList: ['input', 'reference'], selectedTypeIndex: config.documentInputMode === 'reference' ? 1 : 0, value: config.documentInputMode === 'reference' ? config.documentIds.value : config.documents.map(item => item.documentId) },
      hidden('documentSelection', 'any', config.documents),
      {
        key: 'datasets', label: '选择知识库', valueType: 'selectDataset', required: true,
        renderTypeList: ['selectDataset', 'reference'], selectedTypeIndex: config.datasetInputMode === 'reference' ? 1 : 0,
        value: config.datasetInputMode === 'reference' ? config.datasetIds.value : config.datasets.map((item) => ({ ...item })),
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
  const renderTypes = input?.renderTypeList ?? ['reference', 'textarea'];
  const index = typeof input?.selectedTypeIndex === 'number' ? input.selectedTypeIndex : 0;
  const renderType = renderTypes[index] ?? renderTypes[0] ?? 'reference';
  if (renderType === 'textarea' || renderType === 'input') {
    return { valueMode: 'input' as const, value: input?.value == null ? '' : String(input.value) };
  }
  const raw = input?.value;
  const values = Array.isArray(raw) ? raw.filter(Array.isArray).map(moduleRefToString).filter(Boolean) : [];
  return { valueMode: 'reference' as const, value: values.join(' ') };
}

export function parseDatasetSearchModule(module: WorkflowModule) {
  const inputs = module.inputs ?? [];
  const datasetField = inputs.find(item => item.key === 'datasets');
  const documentField = inputs.find(item => item.key === 'documentIds');
  const isReference = (field: WorkflowModuleInput | undefined) => field?.selectedTypeIndex === 1 || (typeof field?.value === 'string' && /\{\{[^{}]+\}\}/.test(field.value));
  const datasetReference = parseStringInput(inputs, 'datasetInputMode') === 'reference' || isReference(datasetField);
  const documentReference = isReference(documentField);
  const selection = normalizeDatasets(parseInputValue(inputs, 'datasetSelection'));
  const datasets = datasetReference ? selection : normalizeDatasets(datasetField?.value).map(item => selection.find(selected => selected.datasetId === item.datasetId) ?? item);
  const documentSelection = parseInputValue(inputs, 'documentSelection');
  const ids = Array.isArray(documentField?.value) ? documentField.value.map(String) : typeof documentField?.value === 'string' ? documentField.value.split(',').map(item => item.trim()).filter(Boolean) : [];
  const node = createCanvasNode('knowledge', module, normalizeDatasetSearchConfig({
    datasetInputMode: datasetReference ? 'reference' : 'select',
    datasetIds: { valueMode: 'reference', value: datasetReference ? String(datasetField?.value ?? '') : '' },
    retrievalScope: parseStringInput(inputs, 'retrievalScope') || 'all',
    documentInputMode: documentReference ? 'reference' : 'select',
    documentIds: { valueMode: 'reference', value: documentReference ? String(documentField?.value ?? '') : '' },
    documents: Array.isArray(documentSelection) ? documentSelection : !documentReference && datasets.length === 1 ? ids.map(documentId => ({ documentId, datasetId: datasets[0].datasetId })) : [],
    datasets,
    similarity: parseNumberInput(inputs, 'similarity', 0.4),
    limit: parseNumberInput(inputs, 'limit', 3),
    searchMode: parseStringInput(inputs, 'searchMode'),
    embeddingWeight: parseNumberInput(inputs, 'embeddingWeight', 0.38),
    usingReRank: parseRerankEnabled(inputs),
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
  const fields = [
    ...(config.datasetInputMode === 'reference' ? [{ value: config.datasetIds.value, context: '知识库 ID 变量' }] : []),
    ...(config.retrievalScope === 'files' && config.documentInputMode === 'reference' ? [{ value: config.documentIds.value, context: '文件 ID 变量' }] : []),
    ...(config.searchInput.valueMode === 'reference' ? [{ value: config.searchInput.value, context: '检索内容' }] : []),
  ];
  return fields.flatMap(field => parseVariableRefs(field.value).map(ref => ({ value: ref.raw, context: `节点 ${node.data.label} 的${field.context}` })));
}

export function validateDatasetSearchNode(node: WorkflowCanvasNode) {
  const config = normalizeDatasetSearchConfig(node.data.config);
  const errors: string[] = [];
  if (config.datasetInputMode === 'reference') {
    if (!/^\s*\{\{[^{}]+\}\}\s*$/.test(config.datasetIds.value)) errors.push(`节点 ${node.data.label} 请选择有效的知识库 ID 变量`);
  } else if (!config.datasets.length) errors.push(`节点 ${node.data.label} 至少选择一个知识库`);
  if (config.retrievalScope === 'files') {
    if (config.documentInputMode === 'reference') {
      if (!/\{\{[^{}]+\}\}/.test(config.documentIds.value)) errors.push(`节点 ${node.data.label} 请选择有效的文件 ID 变量`);
    } else if (!config.documents.length) errors.push(`节点 ${node.data.label} 至少选择一个文件`);
    else if (config.documents.some(item => !config.datasets.some(kb => kb.datasetId === item.datasetId))) errors.push(`节点 ${node.data.label} 指定文件不属于当前所选知识库`);
  }
  if (!config.searchInput.value.trim()) errors.push(`节点 ${node.data.label} 缺少检索内容`);
  if (config.searchInput.valueMode === 'reference' && !parseVariableRefs(config.searchInput.value).length) {
    errors.push(`节点 ${node.data.label} 必须选择有效的检索变量`);
  }
  if (config.usingReRank && !config.rerankModel.trim()) {
    errors.push(`节点 ${node.data.label} 已开启结果重排，但未选择 Rerank 模型`);
  }
  return errors;
}
