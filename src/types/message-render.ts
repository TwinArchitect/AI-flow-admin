/**
 * 消息渲染块类型（简化版）
 *
 * 完整版见原型 message-render 模块，当前只保留页面所需的核心类型。
 */

/** 可渲染消息块 */
export type MessageBlock =
  | { type: 'text'; text: string }
  | { type: 'markdown'; source: string }
  | { type: 'reasoning'; source: string }
  | { type: 'html'; html: string }
  | { type: 'image'; url: string; alt?: string }
  | { type: 'custom'; kind: string; payload: unknown };

export type MessageRole = 'user' | 'assistant' | 'system';

export interface OverviewUiMessage {
  id: string;
  backendId?: string;
  role: 'user' | 'assistant';
  blocks: MessageBlock[];
  customType?: string;
  likes?: number;
  timestamp: string;
}

/** 内容增量（SSE） */
export type ContentDelta =
  | { kind: 'append-markdown'; text: string }
  | { kind: 'append-reasoning'; text: string }
  | { kind: 'append-text'; text: string }
  | { kind: 'add-block'; block: MessageBlock };
