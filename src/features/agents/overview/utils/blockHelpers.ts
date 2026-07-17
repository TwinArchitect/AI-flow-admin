/**
 * 消息块渲染辅助函数（简化版 message-render）
 * 完整版 message-render 包含 SSE 解析、注册渲染器等，当前只保留静态渲染需求。
 */

import type { MessageBlock, ContentDelta, MessageRole } from '@/types';

/** 将字符串解析为消息块列表 */
export function parseStringToBlocks(source: string, role: MessageRole): MessageBlock[] {
  if (!source.trim()) return [];
  if (role === 'assistant') {
    return [{ type: 'markdown', source }];
  }
  return [{ type: 'text', text: source }];
}

/** 将消息块转为纯文本 */
export function blocksToPlainText(blocks: MessageBlock[]): string {
  return blocks
    .map((b) => {
      if (b.type === 'text') return b.text;
      if (b.type === 'markdown') return b.source;
      if (b.type === 'reasoning') return b.source;
      if (b.type === 'html') return b.html;
      if (b.type === 'image') return `[图片: ${b.alt ?? b.url}]`;
      return '';
    })
    .join('\n')
    .trim();
}

/** 应用内容增量到现有块列表 */
export function applyContentDelta(blocks: MessageBlock[], delta: ContentDelta): MessageBlock[] {
  if (delta.kind === 'append-markdown' || delta.kind === 'append-text') {
    const text = delta.kind === 'append-markdown' ? delta.text : delta.text;
    const last = blocks[blocks.length - 1];
    if (last && (last.type === 'markdown' || last.type === 'text')) {
      const next = [...blocks];
      next[next.length - 1] = {
        ...last,
        ...(last.type === 'markdown' ? { source: last.source + text } : { text: last.text + text })
      };
      return next;
    }
    return [...blocks, { type: 'markdown', source: text }];
  }
  if (delta.kind === 'append-reasoning') {
    const last = blocks[blocks.length - 1];
    if (last && last.type === 'reasoning') {
      const next = [...blocks];
      next[next.length - 1] = { ...last, source: last.source + delta.text };
      return next;
    }
    return [...blocks, { type: 'reasoning', source: delta.text }];
  }
  if (delta.kind === 'add-block') {
    return [...blocks, delta.block];
  }
  return blocks;
}
