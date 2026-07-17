import type { ImportanceLevel, MemoryCategory } from './types';

const categoryLabelMap: Record<MemoryCategory, string> = {
  preference: '用户习惯',
  fact: '系统事实',
  episodic: '会话摘要',
  behavior: '行为特征',
};

const importanceLabelMap: Record<ImportanceLevel, string> = {
  critical: '非常核心',
  high: '中高匹配',
  medium: '普通检索',
  low: '次要参考',
};

export function categoryLabel(category: MemoryCategory): string {
  return categoryLabelMap[category];
}

export function importanceLabel(importance: ImportanceLevel): string {
  return importanceLabelMap[importance];
}

export function formatDate(value?: string): string {
  if (!value) return '-';
  return value.slice(0, 16);
}
