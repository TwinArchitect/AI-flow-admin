import type { NodeExecutionState } from '../types/execution';
import type { WorkflowCanvasEdge as WorkflowEdge, WorkflowCanvasNode as WorkflowNode } from '../types';
import { VARIABLE_NODE_ID, normalizeStartConfig } from '../contracts/startNodeContract';
import { buildVariableRef } from './variableRefs';
import { resolveNodeOutputs } from './availableVariables';

const START_TYPE_LABELS: Record<string, string> = {
  string: '文本',
  number: '数字',
  boolean: 'boolean',
  object: 'JSON对象',
  array: '数组',
  file: '文件数组'
};

export type VariableLedgerSampleStatus = 'sampled' | 'no_run' | 'not_executed';

export type VariableLedgerGroup = 'global' | 'node';

export interface WorkflowVariableLedgerEntry {
  id: string;
  ref: string;
  group: VariableLedgerGroup;
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  outputKey: string;
  outputLabel: string;
  schemaType: string;
  schemaTypeLabel: string;
  defaultValue?: string;
  runtimeType?: string;
  formatSummary?: string;
  sampleValue?: unknown;
  typeMismatch: boolean;
  sampleStatus: VariableLedgerSampleStatus;
  /** 文件类型变量的字段说明（含开始节点运行时补全字段） */
  fileFieldSpecs?: FileVariableFieldSpec[];
}

const OUTPUT_TYPE_LABELS: Record<string, string> = {
  string: '文本',
  number: '数字',
  boolean: 'boolean',
  object: 'JSON对象',
  array: '数组',
  arrayString: '字符串数组',
  arrayNumber: '数字数组',
  arrayBoolean: '布尔数组',
  arrayObject: '对象数组',
  arrayAny: '任意数组',
  any: '任意类型',
  dynamic: '动态类型',
  file: '文件数组',
  datasetQuote: '知识库引用',
  selectDataset: '知识库选择',
  chatHistory: '对话历史',
  selectApp: '工作流选择'
};

export function schemaTypeLabel(valueType: string): string {
  if (valueType in START_TYPE_LABELS) {
    return START_TYPE_LABELS[valueType];
  }
  return OUTPUT_TYPE_LABELS[valueType] ?? valueType;
}

export function inferRuntimeType(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export function normalizeLedgerValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) return value;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

function withFileFieldSpecs<T extends WorkflowVariableLedgerEntry>(entry: T): T {
  if (!isFileSchemaType(entry.schemaType)) return entry;
  return { ...entry, fileFieldSpecs: FILE_VARIABLE_FIELD_SPECS };
}

function normalizeFileLedgerValue(value: unknown): RuntimeFileVariableValue[] | unknown {
  const normalized = normalizeLedgerValue(value);
  if (normalized === undefined) return undefined;
  if (Array.isArray(normalized)) {
    return normalized
      .map((item) => normalizeRuntimeFileInfoItem(item))
      .filter((item): item is RuntimeFileVariableValue => item !== null);
  }
  const single = normalizeRuntimeFileInfoItem(normalized);
  if (single) return [single];
  return normalized;
}

/** 文件类型变量在台账中统一展示为 FileInfo[] */
export function normalizeLedgerValueForSchema(value: unknown, schemaType: string): unknown {
  if (schemaType !== 'file') return normalizeLedgerValue(value);
  return normalizeFileLedgerValue(value);
}

export function isFileSchemaType(schemaType: string): boolean {
  return schemaType === 'file';
}

export function formatFileVariableSummary(value: unknown): string {
  const normalized = normalizeFileLedgerValue(value);
  if (!Array.isArray(normalized) || normalized.length === 0) {
    return 'array[0] · 运行后补全 url/name/mime';
  }
  const enriched = normalized.some((item) => hasRuntimeFileEnrichment(item));
  return enriched
    ? `array[${normalized.length}] · 含 url/name/mime`
    : `array[${normalized.length}] · 运行后补全 url/name/mime`;
}

export function formatVariableSummaryForSchema(value: unknown, schemaType: string): string {
  if (isFileSchemaType(schemaType)) return formatFileVariableSummary(value);
  return formatVariableSummary(value);
}

export function canExpandLedgerEntry(entry: WorkflowVariableLedgerEntry): boolean {
  return isFileSchemaType(entry.schemaType) || getLedgerDisplayValue(entry) !== undefined;
}

export function getLedgerDetailValue(entry: WorkflowVariableLedgerEntry): unknown {
  const displayValue = getLedgerDisplayValue(entry);
  if (displayValue !== undefined) return displayValue;
  if (isFileSchemaType(entry.schemaType)) return FILE_VARIABLE_RUNTIME_SHAPE;
  return undefined;
}

export function getLedgerDisplayValue(entry: WorkflowVariableLedgerEntry): unknown | undefined {
  const raw =
    entry.sampleValue !== undefined
      ? entry.sampleValue
      : entry.defaultValue?.trim()
        ? entry.defaultValue
        : undefined;
  if (raw === undefined) return undefined;
  return normalizeLedgerValueForSchema(raw, entry.schemaType);
}

export function isStructuredLedgerValue(value: unknown): boolean {
  return value !== null && typeof value === 'object';
}

export function formatVariableSummary(value: unknown): string {
  const normalized = normalizeLedgerValue(value);
  if (normalized === undefined) return '—';
  if (normalized === null) return 'null';
  if (typeof normalized === 'string') {
    if (!normalized.length) return 'string(0)';
    const preview = normalized.length > 48 ? `${normalized.slice(0, 48)}…` : normalized;
    return `string(${normalized.length}) · ${preview}`;
  }
  if (typeof normalized === 'number' || typeof normalized === 'boolean') {
    return `${typeof normalized} · ${String(normalized)}`;
  }
  if (Array.isArray(normalized)) {
    return `array[${normalized.length}]`;
  }
  if (typeof normalized === 'object') {
    const keys = Object.keys(normalized as Record<string, unknown>);
    return `object{${keys.length} keys}`;
  }
  return String(normalized);
}

function hasAnyExecutionSample(nodeStates: Record<string, NodeExecutionState>): boolean {
  return Object.values(nodeStates).some(
    (state) =>
      state.status !== 'idle' ||
      state.debugInputs != null ||
      state.debugOutputs != null ||
      state.debugError != null
  );
}

function readSampleValue(
  nodeId: string,
  outputKey: string,
  nodeStates: Record<string, NodeExecutionState>
): unknown {
  const state = nodeStates[nodeId];
  if (!state) return undefined;
  if (state.debugOutputs && outputKey in state.debugOutputs) {
    return state.debugOutputs[outputKey];
  }
  if (state.debugInputs && outputKey in state.debugInputs) {
    return state.debugInputs[outputKey];
  }
  return undefined;
}

function resolveSampleStatus(
  hasRun: boolean,
  nodeId: string,
  outputKey: string,
  nodeStates: Record<string, NodeExecutionState>
): { status: VariableLedgerSampleStatus; value?: unknown } {
  if (!hasRun) {
    return { status: 'no_run' };
  }

  const value = readSampleValue(nodeId, outputKey, nodeStates);
  if (value !== undefined) {
    return { status: 'sampled', value };
  }

  const state = nodeStates[nodeId];
  if (!state || state.status === 'idle') {
    return { status: 'not_executed' };
  }

  return { status: 'not_executed' };
}

function isTypeMismatch(schemaType: string, runtimeType: string | undefined): boolean {
  if (!runtimeType || runtimeType === 'undefined') return false;
  if (schemaType === 'any' || schemaType === 'dynamic') return false;
  if (schemaType.startsWith('array') && runtimeType === 'array') return false;
  if (schemaType === runtimeType) return false;
  if (schemaType === 'arrayString' && runtimeType === 'array') return false;
  if (schemaType === 'object' && runtimeType === 'object') return false;
  if (schemaType === 'chatHistory' && (runtimeType === 'array' || runtimeType === 'object')) {
    return false;
  }
  if (
    (schemaType === 'datasetQuote' || schemaType === 'selectDataset' || schemaType === 'selectApp') &&
    (runtimeType === 'array' || runtimeType === 'object' || runtimeType === 'string')
  ) {
    return false;
  }
  if (schemaType === 'file' && runtimeType === 'array') return false;
  if (schemaType === 'file' && runtimeType === 'string') return false;
  return true;
}

function buildGlobalEntries(
  nodes: WorkflowNode[],
  nodeStates: Record<string, NodeExecutionState>,
  hasRun: boolean
): WorkflowVariableLedgerEntry[] {
  const start = nodes.find((n) => n.data.nodeType === 'start');
  const startConfig = start ? normalizeStartConfig(start.data.config) : undefined;
  const variableMap = new Map(
    (startConfig?.variables ?? []).map((variable) => [variable.key, variable] as const)
  );

  return getGlobalVariableOptions(nodes).map((opt) => {
    const variable = variableMap.get(opt.outputKey);
    const sample = resolveSampleStatus(hasRun, VARIABLE_NODE_ID, opt.outputKey, nodeStates);
    const startSample =
      sample.value === undefined && start
        ? readSampleValue(start.id, opt.outputKey, nodeStates)
        : undefined;
    const sampleValue = sample.value !== undefined ? sample.value : startSample;
    const normalizedSample =
      sampleValue !== undefined
        ? normalizeLedgerValueForSchema(sampleValue, opt.valueType)
        : undefined;
    const normalizedDefault = variable?.defaultValue?.trim()
      ? normalizeLedgerValueForSchema(variable.defaultValue, opt.valueType)
      : undefined;
    const sampleStatus: VariableLedgerSampleStatus =
      sampleValue !== undefined ? 'sampled' : hasRun ? 'not_executed' : 'no_run';
    const runtimeType =
      normalizedSample !== undefined ? inferRuntimeType(normalizedSample) : undefined;

    return {
      id: opt.ref,
      ref: opt.ref,
      group: 'global' as const,
      nodeId: opt.nodeId,
      nodeLabel: opt.nodeLabel,
      nodeType: opt.nodeType,
      outputKey: opt.outputKey,
      outputLabel: opt.outputLabel,
      schemaType: opt.valueType,
      schemaTypeLabel: schemaTypeLabel(opt.valueType),
      defaultValue: variable?.defaultValue,
      runtimeType,
      formatSummary:
        normalizedSample !== undefined
          ? formatVariableSummaryForSchema(normalizedSample, opt.valueType)
          : normalizedDefault
            ? formatVariableSummaryForSchema(normalizedDefault, opt.valueType)
            : isFileSchemaType(opt.valueType)
              ? formatFileVariableSummary([])
              : undefined,
      sampleValue,
      typeMismatch: isTypeMismatch(opt.valueType, runtimeType),
      sampleStatus
    };
  }).map(withFileFieldSpecs);
}

function buildNodeEntries(
  nodes: WorkflowNode[],
  nodeStates: Record<string, NodeExecutionState>,
  hasRun: boolean
): WorkflowVariableLedgerEntry[] {
  const entries: WorkflowVariableLedgerEntry[] = [];

  for (const node of nodes) {
    const outputs = resolveNodeOutputs(node);
    if (outputs.length === 0) continue;

    const nodeLabel = node.data.label?.trim() || node.id;
    const startConfig = node.data.nodeType === 'start' ? normalizeStartConfig(node.data.config) : undefined;

    for (const output of outputs) {
      const ref = buildVariableRef(node.id, output.key);
      const { status, value } = resolveSampleStatus(hasRun, node.id, output.key, nodeStates);
      const normalizedValue =
        value !== undefined ? normalizeLedgerValueForSchema(value, output.valueType) : undefined;
      const runtimeType = normalizedValue !== undefined ? inferRuntimeType(normalizedValue) : undefined;
      let outputLabel = output.label.trim() || output.key;
      if (node.data.nodeType === 'start' && output.key === 'userChatInput') {
        outputLabel = '用户问题';
      }
      if (node.data.nodeType === 'start' && startConfig) {
        const globalVar = (startConfig.variables ?? []).find((v) => v.key === output.key);
        if (globalVar) {
          outputLabel = globalVar.description?.trim() || globalVar.label.trim() || output.key;
        }
      }

      entries.push({
        id: ref,
        ref,
        group: 'node' as const,
        nodeId: node.id,
        nodeLabel,
        nodeType: node.data.nodeType,
        outputKey: output.key,
        outputLabel,
        schemaType: output.valueType,
        schemaTypeLabel: schemaTypeLabel(output.valueType),
        runtimeType,
        formatSummary:
          normalizedValue !== undefined
            ? formatVariableSummaryForSchema(normalizedValue, output.valueType)
            : isFileSchemaType(output.valueType)
              ? formatFileVariableSummary([])
              : undefined,
        sampleValue: value,
        typeMismatch: isTypeMismatch(output.valueType, runtimeType),
        sampleStatus: status
      });
    }
  }

  return entries.map(withFileFieldSpecs);
}

export function buildWorkflowVariableLedger(
  nodes: WorkflowNode[],
  _edges: WorkflowEdge[],
  nodeStates: Record<string, NodeExecutionState> = {}
): WorkflowVariableLedgerEntry[] {
  const hasRun = hasAnyExecutionSample(nodeStates);
  const globalEntries = buildGlobalEntries(nodes, nodeStates, hasRun);
  const nodeEntries = buildNodeEntries(nodes, nodeStates, hasRun);

  const globalKeys = new Set(globalEntries.map((entry) => entry.outputKey));
  const dedupedNodeEntries = nodeEntries.filter((entry) => {
    if (entry.group === 'node' && entry.nodeType === 'start') {
      return !globalKeys.has(entry.outputKey);
    }
    return true;
  });

  return applyDisplayNodeLabels([...globalEntries, ...dedupedNodeEntries]);
}

export function sampleStatusLabel(status: VariableLedgerSampleStatus): string {
  switch (status) {
    case 'sampled':
      return '已采样';
    case 'no_run':
      return '未调试';
    case 'not_executed':
      return '本轮未执行';
    default:
      return status;
  }
}

export type VariableLedgerStats = {
  total: number;
  sampled: number;
  mismatched: number;
};

export function summarizeVariableLedger(entries: WorkflowVariableLedgerEntry[]): VariableLedgerStats {
  return {
    total: entries.length,
    sampled: entries.filter((entry) => entry.sampleStatus === 'sampled').length,
    mismatched: entries.filter((entry) => entry.typeMismatch).length
  };
}

export interface DebugFileVariableValue {
  fileId: string;
  fileName: string;
}

/** 开始节点执行后补全的运行时文件项（FileInfo[] 单条） */
export interface RuntimeFileVariableValue extends DebugFileVariableValue {
  url?: string;
  name?: string;
  mime?: string;
  type?: string;
}

export type FileVariableFieldSource = 'config' | 'runtime';

export interface FileVariableFieldSpec {
  key: keyof RuntimeFileVariableValue | string;
  label: string;
  source: FileVariableFieldSource;
  description: string;
}

/** 文件变量字段说明：配置阶段可填写 vs 开始节点运行时补全 */
export const FILE_VARIABLE_FIELD_SPECS: FileVariableFieldSpec[] = [
  {
    key: 'fileId',
    label: 'fileId',
    source: 'config',
    description: '上传附件后获得的平台 fileId'
  },
  {
    key: 'fileName',
    label: 'fileName',
    source: 'config',
    description: '配置或上传时填写的原始文件名'
  },
  {
    key: 'url',
    label: 'url',
    source: 'runtime',
    description: '开始节点执行时补全的文件访问地址'
  },
  {
    key: 'name',
    label: 'name',
    source: 'runtime',
    description: '开始节点执行时补全的展示名称'
  },
  {
    key: 'mime',
    label: 'mime',
    source: 'runtime',
    description: '开始节点执行时补全的 MIME 类型'
  }
];

/** 文件类型变量配置阶段示例（上传后） */
export const FILE_VARIABLE_ITEM_EXAMPLE: DebugFileVariableValue = {
  fileId: '',
  fileName: ''
};

/** 文件类型变量完整运行时示例（开始节点执行后） */
export const FILE_VARIABLE_RUNTIME_ITEM_EXAMPLE: RuntimeFileVariableValue = {
  fileId: '',
  fileName: '',
  url: '',
  name: '',
  mime: ''
};

export const FILE_VARIABLE_DEFAULT_SHAPE: DebugFileVariableValue[] = [FILE_VARIABLE_ITEM_EXAMPLE];

export const FILE_VARIABLE_RUNTIME_SHAPE: RuntimeFileVariableValue[] = [
  FILE_VARIABLE_RUNTIME_ITEM_EXAMPLE
];

function normalizeFileInfoItem(item: unknown): DebugFileVariableValue | null {
  if (!item || typeof item !== 'object') return null;
  const obj = item as Record<string, unknown>;
  const fileId = String(obj.fileId ?? obj.id ?? '').trim();
  if (!fileId) return null;
  const fileName = String(obj.fileName ?? obj.name ?? fileId).trim() || fileId;
  return { fileId, fileName };
}

/** 保留开始节点运行时补全的 url / name / mime 等字段 */
export function normalizeRuntimeFileInfoItem(item: unknown): RuntimeFileVariableValue | null {
  const base = normalizeFileInfoItem(item);
  if (!base) return null;
  if (!item || typeof item !== 'object') return base;
  const obj = item as Record<string, unknown>;
  const runtime: RuntimeFileVariableValue = { ...base };
  if (obj.url != null && String(obj.url).trim()) runtime.url = String(obj.url).trim();
  if (obj.name != null && String(obj.name).trim()) runtime.name = String(obj.name).trim();
  if (obj.mime != null && String(obj.mime).trim()) runtime.mime = String(obj.mime).trim();
  if (obj.type != null && String(obj.type).trim()) runtime.type = String(obj.type).trim();
  return runtime;
}

export function parseRuntimeFileValueList(raw: string): RuntimeFileVariableValue[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => normalizeRuntimeFileInfoItem(item))
        .filter((item): item is RuntimeFileVariableValue => item !== null);
    }
    const single = normalizeRuntimeFileInfoItem(parsed);
    return single ? [single] : [];
  } catch {
    return [{ fileId: trimmed, fileName: trimmed }];
  }
}

export function hasRuntimeFileEnrichment(item: RuntimeFileVariableValue): boolean {
  return Boolean(item.url?.trim() || item.mime?.trim() || item.name?.trim());
}


function getGlobalVariableOptions(nodes: WorkflowNode[]) {
  const start = nodes.find((node) => node.data.nodeType === 'start');
  if (!start) return [];
  return normalizeStartConfig(start.data.config).variables.filter((variable) => variable.key.trim()).map((variable) => ({
    ref: buildVariableRef(VARIABLE_NODE_ID, variable.key.trim()), nodeId: VARIABLE_NODE_ID,
    nodeLabel: '全局变量', nodeType: 'global', outputKey: variable.key.trim(),
    outputLabel: variable.description?.trim() || variable.label.trim() || variable.key.trim(), valueType: variable.valueType,
  }));
}
function applyDisplayNodeLabels<T extends { nodeId: string; nodeLabel: string }>(items: T[]): T[] {
  const idsByLabel = new Map<string, Set<string>>();
  for (const item of items) {
    const label = item.nodeLabel.trim() || item.nodeId;
    const ids = idsByLabel.get(label) ?? new Set<string>(); ids.add(item.nodeId); idsByLabel.set(label, ids);
  }
  return items.map((item) => {
    const label = item.nodeLabel.trim() || item.nodeId;
    return { ...item, nodeLabel: (idsByLabel.get(label)?.size ?? 0) > 1 ? `${label} · ${item.nodeId.slice(-4)}` : label };
  });
}
