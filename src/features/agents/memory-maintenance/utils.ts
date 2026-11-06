import type { MemoryRecallStrategy, MemorySource, MemoryType } from './types';

export const MEMORY_TYPE_OPTIONS: { value: MemoryType; label: string }[] = [
  { value: 'profile', label: '身份/画像' },
  { value: 'preference', label: '偏好' },
  { value: 'fact', label: '事实' },
  { value: 'constraint', label: '约束' }
];

export function memoryTypeLabel(type?: string) {
  return MEMORY_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type ?? '事实';
}

export function memorySourceLabel(source?: MemorySource | string) {
  if (source === 'extract') return '对话凝练';
  if (source === 'manual') return '手工录入';
  return source || '—';
}

export function memoryStrategyLabel(strategy?: MemoryRecallStrategy) {
  if (strategy === 'vector') return '语义召回';
  if (strategy === 'keyword') return '关键词兜底';
  if (strategy === 'empty') return '暂无记忆';
  return strategy || '未知';
}

export function formatMemoryTime(value?: string) {
  if (!value) return '—';
  return value.replace('T', ' ').slice(0, 16);
}

export function isMemoryPinned(pinned?: number) {
  return pinned === 1;
}
