import type { ContentDelta } from '@/types';
import type { WorkflowNodeSsePayload } from '@/features/workflows/types/execution';
import {
  resolveConversationNodeRichBlocks,
  resolveConversationSpecialEventBlocks,
} from './richContent';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function parsePayload(data: string) {
  try {
    return asRecord(JSON.parse(data) as unknown);
  } catch {
    return null;
  }
}

function isWorkflowNodePayload(value: Record<string, unknown>): value is WorkflowNodeSsePayload {
  return typeof value.nodeId === 'string'
    && typeof value.flowNodeType === 'string'
    && typeof value.statusCode === 'number';
}

function messageDeltas(payload: Record<string, unknown>): ContentDelta[] {
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  const choice = asRecord(choices[0]);
  const delta = asRecord(choice?.delta);
  const message = asRecord(choice?.message);
  const content = [delta?.content, message?.content, payload.content]
    .find((value): value is string => typeof value === 'string' && Boolean(value));
  const reasoning = [
    delta?.reasoning_content,
    message?.reasoning_content,
    payload.reasoning_content,
  ].find((value): value is string => typeof value === 'string' && Boolean(value));

  const result: ContentDelta[] = [];
  if (reasoning) result.push({ kind: 'append-reasoning', text: reasoning });
  if (content) result.push({ kind: 'append-markdown', text: content });
  return result;
}

function blockDeltas(blocks: ReturnType<typeof resolveConversationSpecialEventBlocks>): ContentDelta[] {
  return blocks.map((block) => ({ kind: 'add-block' as const, block }));
}

/** 唯一 SSE 对话内容解析入口；节点执行状态仍由工作流调试体系单独消费。 */
export function parseSseToConversationDeltas(eventName: string, data: string): ContentDelta[] {
  if (!data || data === '[DONE]') return [];
  const payload = parsePayload(data);
  if (!payload) return [];

  if (eventName === 'message') {
    const embeddedEvent = typeof payload.event === 'string' ? payload.event.trim() : '';
    if (!embeddedEvent || embeddedEvent === 'message') return messageDeltas(payload);
    if (isWorkflowNodePayload(payload)) {
      return blockDeltas(resolveConversationNodeRichBlocks(embeddedEvent, payload));
    }
    return blockDeltas(resolveConversationSpecialEventBlocks(embeddedEvent, payload));
  }

  if (isWorkflowNodePayload(payload)) {
    return blockDeltas(resolveConversationNodeRichBlocks(eventName, payload));
  }
  return blockDeltas(resolveConversationSpecialEventBlocks(eventName, payload));
}
