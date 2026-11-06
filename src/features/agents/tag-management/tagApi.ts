import { http } from '@/api/client';
import type { AgentLabel, AgentLabelCategory } from '@/types/agent';

const BASE = '/gpt/base/agent/label';
export type LabelQuery = { pageNum: number; pageSize: number; name?: string; status?: number; category?: AgentLabelCategory };
export type LabelPayload = { id?: string; name: string; category: AgentLabelCategory; description?: string; sort?: number; status?: number };
export const queryLabels = (query: LabelQuery) => http.post<{ records: AgentLabel[]; total: number }>(`${BASE}/query`, query).then(r => r.data);
export const saveLabel = (payload: LabelPayload) => http.post<AgentLabel>(`${BASE}/${payload.id ? 'update' : 'save'}`, payload).then(r => r.data);
// 当前后端使用 POST，参照前端的 DELETE 已过时。
export const deleteLabel = (id: string) => http.post(`${BASE}/delete/${encodeURIComponent(id)}`, {}).then(r => r.data);
