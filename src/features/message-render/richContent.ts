import type { ChatContentBlock, ChatContentBlockType, MessageBlock } from '@/types';
import type { WorkflowNodeSsePayload, WorkflowRunResult } from '../workflows/types/execution';
import { applyConversationDelta } from './conversationBlocks';
import { normalizeKnowledgeReference } from './knowledgeReference';

export const ECHARTS_BLOCK_KIND = 'echarts';
export const DATA_TABLE_BLOCK_KIND = 'data-table';
export const REFERENCE_BLOCK_KIND = 'agent-search-citation';
export const REFERENCE_IMAGES_BLOCK_KIND = 'agent-search-images';
export const QUESTION_GUIDE_BLOCK_KIND = 'question-guide';

export type ConversationContentLifecycle = 'transient' | 'durable';

interface TransientConversationCapability {
  kind: string;
  lifecycle: 'transient';
  merge: 'append' | 'replace-kind';
}

interface DurableConversationCapability {
  kind: string;
  lifecycle: 'durable';
  merge: 'append' | 'replace-kind';
  persistType: ChatContentBlockType;
  serialize: (block: Extract<MessageBlock, { type: 'custom' }>) => Record<string, unknown> | null;
  restore: (data: Record<string, unknown>) => MessageBlock;
}

export type ConversationContentCapability =
  | TransientConversationCapability
  | DurableConversationCapability;

const conversationCapabilitiesByKind = new Map<string, ConversationContentCapability>();
const durableCapabilitiesByPersistType = new Map<ChatContentBlockType, DurableConversationCapability>();
const conversationLifecyclesByBlockType = new Map<MessageBlock['type'], ConversationContentLifecycle>([
  ['reasoning', 'transient'],
  ['image', 'transient'],
]);

/** 每种对话内容只能在这里声明一次生命周期及持久化契约。 */
function registerConversationCapability(capability: ConversationContentCapability) {
  conversationCapabilitiesByKind.set(capability.kind, capability);
  if (capability.lifecycle === 'durable') {
    durableCapabilitiesByPersistType.set(capability.persistType, capability);
  }
}

export interface EChartsBlockPayload {
  option: Record<string, unknown>;
}

export interface DataTableBlockPayload {
  title?: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  total: number;
}

export interface ReferenceBlockPayload {
  data: Record<string, unknown>;
  suppressImages?: boolean;
}

export interface ReferenceImagesBlockPayload {
  imageUrls: string[];
}

export interface QuestionGuideBlockPayload {
  questions: string[];
  workflowRunId?: string;
  taskId?: string;
}

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!text || (!text.startsWith('{') && !text.startsWith('['))) return value;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return value;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  const parsed = parseJson(value);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : null;
}

function resolveOutputs(payload: WorkflowNodeSsePayload) {
  return payload.outputs
    ?? asRecord(payload.flowNodeResponse)
    ?? {};
}

function isEChartsOption(value: unknown): value is Record<string, unknown> {
  const option = asRecord(value);
  return Boolean(option && (Array.isArray(option.series) || option.xAxis || option.dataset));
}

function chartBase64Block(value: unknown): MessageBlock | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const base64 = value.trim();
  return {
    type: 'image',
    url: base64.startsWith('data:')
      ? base64
      : `data:image/png;base64,${base64.replace(/^data:image\/\w+;base64,/, '')}`,
    alt: '图表',
  };
}

function resolveChartBlocks(payload: WorkflowNodeSsePayload): MessageBlock[] {
  const outputs = resolveOutputs(payload);
  const response = asRecord(payload.flowNodeResponse);
  const chartData = outputs.chartData
    ?? outputs.chart_data
    ?? response?.chartData
    ?? response?.chart_data;
  if (isEChartsOption(chartData)) return [chartBlock(asRecord(chartData)!)];
  const fallback = chartBase64Block(
    outputs.chartBase64
      ?? outputs.chart_base64
      ?? response?.chartBase64
      ?? response?.chart_base64,
  );
  return fallback ? [fallback] : [];
}

function tablePayload(value: unknown, title?: string): DataTableBlockPayload | null {
  const parsed = parseJson(value);
  const rows = Array.isArray(parsed)
    ? parsed.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    : [];
  if (!rows.length) return null;
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))].slice(0, 30);
  if (!columns.length) return null;
  return { title, columns, rows: rows.slice(0, 200), total: rows.length };
}

function chartBlock(option: Record<string, unknown>): MessageBlock {
  return { type: 'custom', kind: ECHARTS_BLOCK_KIND, payload: { option } satisfies EChartsBlockPayload };
}

function tableBlock(table: DataTableBlockPayload): MessageBlock {
  return { type: 'custom', kind: DATA_TABLE_BLOCK_KIND, payload: table };
}

function referenceBlock(data: Record<string, unknown>): MessageBlock {
  return { type: 'custom', kind: REFERENCE_BLOCK_KIND, payload: { data } satisfies ReferenceBlockPayload };
}

function referenceBlocks(value: unknown): MessageBlock[] {
  const data = normalizeKnowledgeReference(value);
  if (!data) return [];
  const blocks: MessageBlock[] = [];
  if (data.imageUrls.length) {
    blocks.push({
      type: 'custom',
      kind: REFERENCE_IMAGES_BLOCK_KIND,
      payload: { imageUrls: data.imageUrls } satisfies ReferenceImagesBlockPayload,
    });
  }
  blocks.push({
    type: 'custom',
    kind: REFERENCE_BLOCK_KIND,
    payload: {
      data: data as unknown as Record<string, unknown>,
      suppressImages: data.imageUrls.length > 0,
    } satisfies ReferenceBlockPayload,
  });
  return blocks;
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeQuestions(value: unknown) {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];
  return [...new Set(parsed
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean))].slice(0, 3);
}

function questionGuideBlock(payload: QuestionGuideBlockPayload): MessageBlock {
  return { type: 'custom', kind: QUESTION_GUIDE_BLOCK_KIND, payload };
}

registerConversationCapability({
  kind: ECHARTS_BLOCK_KIND,
  lifecycle: 'durable',
  merge: 'append',
  persistType: 'echarts',
  serialize: (block) => {
    const payload = block.payload as EChartsBlockPayload;
    return payload?.option ?? null;
  },
  restore: chartBlock,
});

registerConversationCapability({
  kind: REFERENCE_BLOCK_KIND,
  lifecycle: 'durable',
  merge: 'append',
  persistType: 'reference',
  serialize: (block) => {
    const payload = block.payload as ReferenceBlockPayload;
    return payload?.data ?? null;
  },
  restore: referenceBlock,
});

registerConversationCapability({
  kind: REFERENCE_IMAGES_BLOCK_KIND,
  lifecycle: 'transient',
  merge: 'replace-kind',
});

registerConversationCapability({
  kind: QUESTION_GUIDE_BLOCK_KIND,
  lifecycle: 'transient',
  merge: 'replace-kind',
});

type NodeResolver = (payload: WorkflowNodeSsePayload) => MessageBlock[];

const NODE_RESOLVERS = new Map<string, NodeResolver>([
  ['chartVisual', resolveChartBlocks],
  ['baseChart', resolveChartBlocks],
  ['databaseQuery', (payload) => {
    const table = tablePayload(resolveOutputs(payload).result, '查询结果');
    return table ? [tableBlock(table)] : [];
  }],
  ['datasetSearchNode', (payload) => {
    const outputs = resolveOutputs(payload);
    return resolveReferenceBlocks(payload, outputs);
  }],
  ['datasetSearch', (payload) => {
    const outputs = resolveOutputs(payload);
    return resolveReferenceBlocks(payload, outputs);
  }],
]);

function resolveReferenceBlocks(
  payload: WorkflowNodeSsePayload,
  outputs: Record<string, unknown>,
) {
  const root = payload as unknown as Record<string, unknown>;
  const nestedData = asRecord(root.data);
  const nestedResponse = asRecord(nestedData?.flowNodeResponse);
  const response = asRecord(payload.flowNodeResponse);
  const candidates = [
    response?.agentSearchData,
    response?.quoteQA,
    outputs.agentSearchData,
    outputs.quoteQA,
    root.agentSearchData,
    root.quoteQA,
    nestedData?.agentSearchData,
    nestedData?.quoteQA,
    nestedResponse?.agentSearchData,
    nestedResponse?.quoteQA,
  ];
  for (const candidate of candidates) {
    const blocks = referenceBlocks(candidate);
    if (blocks.length) return blocks;
  }
  return [];
}

export function resolveWorkflowNodeRichBlocks(
  eventName: string,
  payload: WorkflowNodeSsePayload,
): MessageBlock[] {
  const type = payload.flowNodeType || eventName;
  const resolver = NODE_RESOLVERS.get(type) ?? NODE_RESOLVERS.get(eventName);
  if (resolver) return resolver(payload);

  const outputs = resolveOutputs(payload);
  if (isEChartsOption(outputs.chartData)) return [chartBlock(asRecord(outputs.chartData)!)];
  const response = asRecord(payload.flowNodeResponse);
  const fallbackImage = chartBase64Block(
    outputs.chartBase64
      ?? outputs.chart_base64
      ?? response?.chartBase64
      ?? response?.chart_base64,
  );
  if (fallbackImage) return [fallbackImage];
  return [];
}

export function resolveWorkflowResultRichBlocks(result: WorkflowRunResult): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  Object.entries(result.outputs).forEach(([key, value]) => {
    if (isEChartsOption(value)) {
      blocks.push(chartBlock(asRecord(value)!));
      return;
    }
    const valueRecord = asRecord(value);
    if (key === 'agentSearchData' || key === 'quoteQA' || valueRecord?.contentType === 'reference') {
      const references = referenceBlocks(value);
      if (references.length) {
        blocks.push(...references);
        return;
      }
    }
    const table = tablePayload(value, key);
    if (table) blocks.push(tableBlock(table));
  });
  return blocks;
}

/**
 * 对话内容的唯一准入规则：只有明确注册 transient / durable 生命周期的内容才能进入。
 * 两个对话入口共同调用；是否落库由 registry 生命周期决定。
 */
export function filterConversationRichBlocks(blocks: MessageBlock[]) {
  return blocks.filter((block) => getConversationContentLifecycle(block) !== null);
}

export function getConversationContentLifecycle(block: MessageBlock): ConversationContentLifecycle | null {
  const blockLifecycle = conversationLifecyclesByBlockType.get(block.type);
  if (blockLifecycle) return blockLifecycle;
  if (block.type !== 'custom') return null;
  return conversationCapabilitiesByKind.get(block.kind)?.lifecycle ?? null;
}

/** transient 返回 null；durable 必须通过注册时声明的 codec 序列化。 */
export function serializeDurableConversationBlock(
  block: MessageBlock,
  nodeId?: string,
): ChatContentBlock | null {
  if (block.type !== 'custom') return null;
  const capability = conversationCapabilitiesByKind.get(block.kind);
  if (!capability || capability.lifecycle !== 'durable') return null;
  const data = capability.serialize(block);
  if (!data) return null;
  return {
    type: capability.persistType,
    ...(nodeId ? { nodeId } : {}),
    data,
  };
}

/** 历史只可能恢复 durable；未知或已下线类型安全忽略。 */
export function restoreDurableConversationBlock(content: ChatContentBlock): MessageBlock | null {
  const capability = durableCapabilitiesByPersistType.get(content.type);
  return capability?.restore(content.data) ?? null;
}

export function resolveConversationNodeRichBlocks(
  eventName: string,
  payload: WorkflowNodeSsePayload,
) {
  return filterConversationRichBlocks(resolveWorkflowNodeRichBlocks(eventName, payload));
}

export function resolveConversationResultRichBlocks(result: WorkflowRunResult) {
  return filterConversationRichBlocks(resolveWorkflowResultRichBlocks(result));
}

/** 解析不属于节点状态机的对话辅助事件。 */
export function resolveConversationSpecialEventBlocks(eventName: string, payload: unknown) {
  const row = asRecord(payload);
  if (!row) return [];
  const embeddedEvent = asString(row.event);
  if (
    eventName !== 'question_guide'
    && eventName !== 'questionGuide'
    && embeddedEvent !== 'questionGuide'
  ) {
    return [];
  }

  const response = asRecord(row.flowNodeResponse);
  const data = asRecord(row.data);
  const outputs = asRecord(row.outputs);
  const questions = [response?.questions, row.questions, data?.questions, outputs?.questions]
    .map(normalizeQuestions)
    .find((items) => items.length > 0) ?? [];
  if (!questions.length) return [];

  return filterConversationRichBlocks([questionGuideBlock({
    questions,
    workflowRunId: asString(row.workflow_run_id) ?? asString(row.workflowRunId),
    taskId: asString(row.task_id) ?? asString(row.taskId),
  })]);
}

export function appendUniqueMessageBlocks(current: MessageBlock[], incoming: MessageBlock[]) {
  if (!incoming.length) return current;
  let next = current;
  incoming.forEach((block) => {
    next = applyConversationDelta(next, { kind: 'add-block', block });
  });
  return next;
}

/** 开始下一轮提问前移除上一轮临时交互，持久化内容保持不变。 */
export function removeTransientConversationBlocks(blocks: MessageBlock[]) {
  return blocks.filter((block) => getConversationContentLifecycle(block) !== 'transient');
}
