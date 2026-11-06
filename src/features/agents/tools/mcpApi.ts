import { http } from '@/api/client';
import type { McpServerVO, McpServerSavePayload, McpServerQuery, McpTestConnectPayload, McpTestConnectResult, McpToolsEnablePayload, McpInvokePayload, McpInvokeResult } from './mcpTypes';
const BASE = '/gpt/base/plugin/mcp';
export function queryMcpServers(query: McpServerQuery) { return http.post<{ records: McpServerVO[]; total: number }>(`${BASE}/query`, { ...query, name: query.name?.trim() || undefined, current: query.current ?? 1, size: query.size ?? 12 }).then((r) => r.data); }
export function getMcpServer(id: string) { return http.get<McpServerVO>(`${BASE}/get/${encodeURIComponent(id)}`, { params: { withTools: true } }).then((r) => r.data); }
export function saveMcpServer(payload: McpServerSavePayload) { const { id, ...body } = payload; return http.post<McpServerVO>(`${BASE}/${id ? 'update' : 'save'}`, id ? payload : body).then((r) => r.data); }
export function deleteMcpServer(id: string) { return http.post(`${BASE}/delete/${encodeURIComponent(id)}`, {}).then((r) => r.data); }
export function deleteMcpServersBatch(ids: string[]) { return http.post(`${BASE}/deleteBatch`, ids).then((r) => r.data); }
export function testMcpConnect(payload: McpTestConnectPayload) { return http.post<McpTestConnectResult>(`${BASE}/testConnect`, payload, { timeout: 180000 }).then((r) => r.data); }
export function enableMcpTools(payload: McpToolsEnablePayload) { return http.post(`${BASE}/tools/enable`, payload).then((r) => r.data); }
export function syncMcpTools(id: string) { return http.post<McpTestConnectResult>(`${BASE}/tools/sync/${encodeURIComponent(id)}`, {}, { timeout: 180000 }).then((r) => r.data); }
export function invokeMcpTool(payload: McpInvokePayload) { return http.post<McpInvokeResult>(`${BASE}/invoke`, payload, { timeout: 180000 }).then((r) => r.data); }
