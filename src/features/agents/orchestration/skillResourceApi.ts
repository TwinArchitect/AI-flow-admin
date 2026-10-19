import { http } from '@/api/client';

export interface HttpToolResource { id: string; name: string; toolName?: string | null; description?: string | null; method?: string | null }
export interface McpServerResource { id: string; name: string; description?: string | null; transport?: string | null }
interface PageResult<T> { records?: T[] }

export function queryHttpToolResources(name?: string) {
  return http.post<PageResult<HttpToolResource>>('/gpt/base/plugin/http/query', { current: 1, size: 50, name: name?.trim() || undefined, status: 0 }).then((response) => response.data);
}

export function queryMcpServerResources(name?: string) {
  return http.post<PageResult<McpServerResource>>('/gpt/base/plugin/mcp/query', { current: 1, size: 50, name: name?.trim() || undefined, status: 0 }).then((response) => response.data);
}

export function getHttpToolResource(id: string) {
  return http.get<HttpToolResource>(`/gpt/base/plugin/http/get/${encodeURIComponent(id)}`).then((response) => response.data);
}

export function getMcpServerResource(id: string) {
  return http.get<McpServerResource>(`/gpt/base/plugin/mcp/get/${encodeURIComponent(id)}?withTools=false`).then((response) => response.data);
}
