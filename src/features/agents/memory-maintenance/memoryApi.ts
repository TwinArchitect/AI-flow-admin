import { http } from '@/api/client';
import type { MemoryPageResult, MemoryQueryDto, MemorySaveDto, MemoryUpdateDto, MemoryRecallDebugDto, MemoryRecallDebugVo } from './types';

const BASE = '/gpt/base/memory';
export function queryMemories(params: MemoryQueryDto) {
  return http.post<MemoryPageResult>(`${BASE}/query`, {
    agentId: params.agentId?.trim() || undefined,
    agentName: params.agentName?.trim() || undefined,
    memoryType: params.memoryType || undefined,
    keyword: params.keyword?.trim() || undefined,
    current: params.current ?? 1, size: params.size ?? 20,
  }).then((r) => r.data);
}
export function saveMemory(payload: MemorySaveDto) { return http.post(`${BASE}/save`, payload).then((r) => r.data); }
export function updateMemory(payload: MemoryUpdateDto) { return http.post(`${BASE}/update`, payload).then((r) => r.data); }
export function deleteMemory(id: string) { return http.post(`${BASE}/delete/${encodeURIComponent(id)}`, {}).then((r) => r.data); }
export function deleteMemoriesBatch(ids: string[]) { return http.post(`${BASE}/deleteBatch`, ids).then((r) => r.data); }
export function clearMemories(agentId: string) { return http.post(`${BASE}/clear`, {}, { params: { agentId } }).then((r) => r.data); }
export function pinMemory(id: string, pinned: boolean) { return http.put(`${BASE}/${encodeURIComponent(id)}/pin`, {}, { params: { pinned } }).then((r) => r.data); }
export function debugMemoryRecall(payload: MemoryRecallDebugDto) { return http.post<MemoryRecallDebugVo>(`${BASE}/recall/debug`, payload).then((r) => r.data); }
