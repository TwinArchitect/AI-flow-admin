import { http } from '@/api/client';
import type { HttpToolQuery, HttpToolVO, HttpToolSavePayload, HttpDebugPayload, HttpDebugResult } from './httpTypes';
const BASE = '/gpt/base/plugin/http';
export function queryHttpTools(query: HttpToolQuery) { return http.post<{ records: HttpToolVO[]; total: number }>(`${BASE}/query`, { current: query.current ?? 1, size: query.size ?? 20, name: query.name?.trim() || undefined, category: query.category || undefined, status: query.status ?? undefined }).then((r) => r.data); }
export function getHttpTool(id: string) { return http.get<HttpToolVO>(`${BASE}/get/${encodeURIComponent(id)}`).then((r) => r.data); }
export function saveHttpTool(payload: HttpToolSavePayload) { const { id, ...body } = payload; return http.post<HttpToolVO>(`${BASE}/${id ? 'update' : 'save'}`, id ? payload : body).then((r) => r.data); }
export function deleteHttpTool(id: string) { return http.post(`${BASE}/delete/${encodeURIComponent(id)}`, {}).then((r) => r.data); }
export function deleteHttpToolsBatch(ids: string[]) { return http.post(`${BASE}/deleteBatch`, ids).then((r) => r.data); }
export function debugHttpTool(payload: HttpDebugPayload, invoke = false) { return http.post<HttpDebugResult>(`${BASE}/${invoke ? 'invoke' : 'debug'}`, payload, { timeout: 180000 }).then((r) => r.data); }
