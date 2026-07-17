/**
 * 对话消息工具函数
 * 迁移映射：原生 JS 工具 → 不变（不涉及样式）
 */

import type { AgentOpenChatMessage, OverviewUiMessage, MessageBlock } from '@/types';
import { parseStringToBlocks } from './blockHelpers';
import { resolveCustomTypeFromQuestion } from '../data/testAgents';

export function formatChatTime(value?: string): string {
  if (!value) {
    return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

export function apiMessagesToUiMessages(records: AgentOpenChatMessage[]): OverviewUiMessage[] {
  const result: OverviewUiMessage[] = [];
  for (const record of records) {
    const ts = formatChatTime(record.createTime);
    const customType = resolveCustomTypeFromQuestion(record.question);
    result.push({
      id: `${record.id}-q`,
      role: 'user',
      blocks: parseStringToBlocks(record.question, 'user'),
      timestamp: ts
    });
    result.push({
      id: `${record.id}-a`,
      backendId: record.id,
      role: 'assistant',
      blocks: parseStringToBlocks(record.answer, 'assistant'),
      customType,
      likes: record.likes ?? 0,
      timestamp: ts
    });
  }
  return result;
}

export function buildGroupTitle(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '新对话';
  return trimmed.length > 12 ? `${trimmed.slice(0, 12)}...` : trimmed;
}

export function defaultGroupName(): string {
  return `新对话_${new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })}`;
}

const STOPPED_GENERATION_MARKDOWN = '*（已终止生成）*';

export function buildStoppedBlock(): MessageBlock[] {
  return parseStringToBlocks(STOPPED_GENERATION_MARKDOWN, 'assistant');
}
