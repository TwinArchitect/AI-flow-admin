import { http } from '@/api/client';
export interface KbApiKey {
  id: string; keyName?: string; keyPrefix?: string; status?: number;
  expireTime?: string | null; lastUsedTime?: string | null; createTime?: string;
  apiKey?: string | null;
}
const BASE = '/gpt/kb/api-keys';
function keyPath(id: string) {
  if (!id?.trim()) throw new Error('缺少密钥 ID');
  return `${BASE}/${encodeURIComponent(id)}`;
}
export function listKbApiKeys() { return http.get<KbApiKey[]>(BASE).then((response) => response.data ?? []); }
export function createKbApiKey(payload: { keyName?: string; expireTime?: string } = {}) { return http.post<KbApiKey>(BASE, payload).then((response) => response.data); }
export function disableKbApiKey(id: string) { return http.post<void>(`${keyPath(id)}/disable`, {}).then((response) => response.data); }
export function enableKbApiKey(id: string) { return http.post<void>(`${keyPath(id)}/enable`, {}).then((response) => response.data); }
export function deleteKbApiKey(id: string) { return http.post<void>(keyPath(id)).then((response) => response.data); }
export function formatKeyExpiry(value: string) { return value.trim() ? `${value.trim().replace('T', ' ')}:00`.slice(0, 19) : undefined; }
