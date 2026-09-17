import type { ContentDelta, MessageBlock, MessageRole } from '@/types';
import type { WorkflowRunResult } from '@/features/workflows/types/execution';
import { normalizeKnowledgeReference } from './knowledgeReference';

const ECHARTS_BLOCK_KIND = 'echarts';
const QUESTION_GUIDE_BLOCK_KIND = 'question-guide';
const REFERENCE_BLOCK_KIND = 'agent-search-citation';
const REFERENCE_IMAGES_BLOCK_KIND = 'agent-search-images';

function blockSignature(block: MessageBlock) {
  return block.type === 'custom'
    ? `${block.kind}:${JSON.stringify(block.payload)}`
    : JSON.stringify(block);
}

function formatWorkflowOutput(value: unknown) {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

/** 运行对话与智能体助手共用的最终纯文本选择规则。 */
export function resolveConversationReply(result: WorkflowRunResult) {
  if (result.answerText.trim()) return result.answerText;

  const conventionalAnswer = formatWorkflowOutput(result.outputs.answer);
  if (conventionalAnswer.trim()) return conventionalAnswer;

  const entries = Object.entries(result.outputs);
  if (entries.length === 1) return formatWorkflowOutput(entries[0][1]) || '（未收到回复内容）';
  if (entries.length > 1) return JSON.stringify(result.outputs, null, 2);
  return '（未收到回复内容）';
}

export function parseConversationText(source: string, role: MessageRole): MessageBlock[] {
  if (!source.trim()) return [];
  if (role !== 'assistant') return [{ type: 'text', text: source }];
  const trimmed = source.trim();
  if (!/^\s*<(?:!doctype|[a-z][a-z0-9-]*)(?:\s|>|\/)/i.test(trimmed)) {
    return [{ type: 'markdown', source }];
  }

  let unwrapped = trimmed;
  for (let index = 0; index < 3; index += 1) {
    const wrapper = /^<(?:p|div|span)(?:\s[^>]*)?>([\s\S]*)<\/(?:p|div|span)>$/i.exec(unwrapped);
    if (!wrapper) break;
    unwrapped = wrapper[1]!.trim();
  }
  unwrapped = unwrapped
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  const looksLikeMarkdown = /#{1,6}(?:\s|[^\s#])/.test(unwrapped)
    || /\|[ \t]*:?-+:?[ \t]*\|/.test(unwrapped)
    || /\*\*[^*]+\*\*/.test(unwrapped);
  const hasStructuralHtml = /<(?:table|ul|ol|h[1-6]|pre|blockquote)\b/i.test(unwrapped);
  if (looksLikeMarkdown && !hasStructuralHtml) {
    return [{ type: 'markdown', source: unwrapped.replace(/<[^>]+>/g, '') }];
  }
  return [{ type: 'html', html: source }];
}

export function conversationBlocksToPlainText(blocks: MessageBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'text') return block.text;
      if (block.type === 'markdown') return block.source;
      if (block.type === 'reasoning') return '';
      if (block.type === 'html') return block.html;
      if (block.type === 'image') return `[图片: ${block.alt ?? block.url}]`;
      return '';
    })
    .join('\n')
    .trim();
}

export function applyConversationDelta(blocks: MessageBlock[], delta: ContentDelta): MessageBlock[] {
  const isTrailingMeta = (block: MessageBlock) => block.type === 'custom'
    && (block.kind === REFERENCE_BLOCK_KIND || block.kind === QUESTION_GUIDE_BLOCK_KIND);
  const trailingStart = blocks.findIndex(isTrailingMeta);
  const content = trailingStart < 0 ? blocks : blocks.slice(0, trailingStart);
  const trailing = trailingStart < 0 ? [] : blocks.slice(trailingStart);

  if (delta.kind === 'append-markdown' || delta.kind === 'append-text') {
    const last = content[content.length - 1];
    if (last && (last.type === 'markdown' || last.type === 'text')) {
      const next = [...content];
      next[next.length - 1] = last.type === 'markdown'
        ? { ...last, source: last.source + delta.text }
        : { ...last, text: last.text + delta.text };
      return [...next, ...trailing];
    }
    const block: MessageBlock = delta.kind === 'append-text'
      ? { type: 'text', text: delta.text }
      : { type: 'markdown', source: delta.text };
    return [...content, block, ...trailing];
  }
  if (delta.kind === 'append-reasoning') {
    const reasoningIndex = blocks.findIndex((block) => block.type === 'reasoning');
    if (reasoningIndex >= 0) {
      const reasoning = blocks[reasoningIndex];
      if (reasoning.type !== 'reasoning') return blocks;
      const next = [...blocks];
      next[reasoningIndex] = { ...reasoning, source: reasoning.source + delta.text };
      return next;
    }
    const insertAt = blocks.findIndex((block) => block.type !== 'reasoning');
    const reasoning: MessageBlock = { type: 'reasoning', source: delta.text };
    return insertAt >= 0
      ? [...blocks.slice(0, insertAt), reasoning, ...blocks.slice(insertAt)]
      : [...blocks, reasoning];
  }
  if (delta.kind === 'add-block') {
    const signature = blockSignature(delta.block);
    let next = blocks.filter((block) => blockSignature(block) !== signature);
    if (delta.block.type === 'custom' && delta.block.kind === REFERENCE_IMAGES_BLOCK_KIND) {
      next = next.filter(
        (block) => block.type !== 'custom' || block.kind !== REFERENCE_IMAGES_BLOCK_KIND,
      );
      const reasoningIndex = next.findIndex((block) => block.type === 'reasoning');
      const insertAt = reasoningIndex >= 0 ? reasoningIndex + 1 : 0;
      return [...next.slice(0, insertAt), delta.block, ...next.slice(insertAt)];
    }
    if (delta.block.type === 'custom' && delta.block.kind === QUESTION_GUIDE_BLOCK_KIND) {
      next = next.filter(
        (block) => block.type !== 'custom' || block.kind !== QUESTION_GUIDE_BLOCK_KIND,
      );
      return [...next, delta.block];
    }
    if (delta.block.type === 'custom' && delta.block.kind === REFERENCE_BLOCK_KIND) {
      const guideIndex = next.findIndex(
        (block) => block.type === 'custom' && block.kind === QUESTION_GUIDE_BLOCK_KIND,
      );
      const withReference = guideIndex < 0
        ? [...next, delta.block]
        : [...next.slice(0, guideIndex), delta.block, ...next.slice(guideIndex)];
      return removeRedundantStructuredConversationText(withReference);
    }
    if (delta.block.type === 'custom' && delta.block.kind === ECHARTS_BLOCK_KIND) {
      const metaIndex = next.findIndex(isTrailingMeta);
      return metaIndex < 0
        ? [...next, delta.block]
        : [...next.slice(0, metaIndex), delta.block, ...next.slice(metaIndex)];
    }
    return [...next, delta.block];
  }
  return blocks;
}

/** 引用已经结构化展示时，移除后端重复推送的整段引用 JSON 正文。 */
export function removeRedundantStructuredConversationText(blocks: MessageBlock[]): MessageBlock[] {
  const hasReference = blocks.some(
    (block) => block.type === 'custom' && block.kind === REFERENCE_BLOCK_KIND,
  );
  if (!hasReference) return blocks;
  return blocks.filter((block) => {
    const source = block.type === 'markdown'
      ? block.source
      : block.type === 'text'
        ? block.text
        : '';
    return !source.trim() || !normalizeKnowledgeReference(source);
  });
}

export function hasVisibleConversationContent(blocks: MessageBlock[]): boolean {
  if (conversationBlocksToPlainText(blocks).trim()) return true;
  return blocks.some((block) => block.type === 'image' || block.type === 'html' || block.type === 'custom');
}
