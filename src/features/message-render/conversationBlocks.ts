import type { ContentDelta, MessageBlock, MessageRole } from '@/types';
import type { WorkflowRunResult } from '@/features/workflows/types/execution';

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
  return role === 'assistant'
    ? [{ type: 'markdown', source }]
    : [{ type: 'text', text: source }];
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
  if (delta.kind === 'append-markdown' || delta.kind === 'append-text') {
    const last = blocks[blocks.length - 1];
    if (last && (last.type === 'markdown' || last.type === 'text')) {
      const next = [...blocks];
      next[next.length - 1] = last.type === 'markdown'
        ? { ...last, source: last.source + delta.text }
        : { ...last, text: last.text + delta.text };
      return next;
    }
    return [...blocks, { type: 'markdown', source: delta.text }];
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
  if (delta.kind === 'add-block') return [...blocks, delta.block];
  return blocks;
}
