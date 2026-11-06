import type { McpServerSavePayload, McpServerVO, McpToolVO } from './mcpTypes';
export type McpForm = McpServerSavePayload & { headersText: string; envText: string; argsText: string; tools: McpToolVO[] };
export function newMcpForm(): McpForm { return { name: '', serverKey: '', description: '', category: '实用工具', avatar: 'plugin-avatar:terminal', status: 0, transport: 'streamable_http', url: '', authType: 'none', authToken: '', authHeaderName: 'X-Api-Key', timeoutMs: 30000, command: '', cwd: '', headersText: '{}', envText: '{}', argsText: '', tools: [] }; }
export function mcpFromVo(vo: McpServerVO): McpForm { return { ...newMcpForm(), id: vo.id, name: vo.name, serverKey: vo.serverKey, description: vo.description || '', category: vo.category || '实用工具', avatar: vo.avatar || vo.iconUrl || 'plugin-avatar:terminal', status: Number(vo.status) === 1 ? 1 : 0, transport: vo.transport, url: vo.url || '', authType: vo.authType || 'none', authToken: vo.authToken === '******' ? '' : vo.authToken || '', authHeaderName: vo.authHeaderName || 'X-Api-Key', timeoutMs: vo.timeoutMs ?? 30000, command: vo.command || '', cwd: vo.cwd || '', argsText: vo.args?.join('\n') || '', headersText: JSON.stringify(vo.headers || {}, null, 2), envText: JSON.stringify(vo.env || {}, null, 2), tools: vo.tools ?? [] }; }
export function parseStringRecord(text: string): Record<string, string> { const parsed: unknown = JSON.parse(text.trim() || '{}'); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('配置必须为 JSON 对象'); return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, String(value ?? '')])); }
export function mcpPayload(form: McpForm): McpServerSavePayload {
  if (!form.name.trim() || !form.serverKey.trim()) throw new Error('请填写服务名称和服务标识');
  const remote = form.transport !== 'stdio';
  if (remote ? !form.url?.trim() : !form.command?.trim()) throw new Error(remote ? '请填写服务地址' : '请填写启动命令');
  const payload: McpServerSavePayload = { id: form.id, name: form.name.trim(), serverKey: form.serverKey.trim(), description: form.description?.trim(), category: form.category?.trim() || '实用工具', avatar: form.avatar || 'plugin-avatar:terminal', status: form.status ?? 0, transport: form.transport, authorType: 'custom' };
  if (remote) { Object.assign(payload, { url: form.url?.trim(), authType: form.authType, authHeaderName: form.authHeaderName?.trim() || 'X-Api-Key', headers: parseStringRecord(form.headersText), timeoutMs: Math.max(1000, form.timeoutMs || 30000) }); if (form.authToken?.trim() && form.authToken !== '******') payload.authToken = form.authToken.trim(); }
  else { payload.command = form.command?.trim(); payload.args = form.argsText.split(/\r?\n/).map((value) => value.trim()).filter(Boolean); payload.env = parseStringRecord(form.envText); payload.cwd = form.cwd?.trim() || undefined; }
  return payload;
}
export function mcpToolsPayload(serverId: string, tools: McpToolVO[]) {
  const aliases = tools.map((tool) => tool.nameAlias?.trim()).filter((value): value is string => Boolean(value));
  if (new Set(aliases).size !== aliases.length) throw new Error('工具别名不能重复');
  return { serverId, enabledToolNames: tools.filter((tool) => tool.enabled !== false).map((tool) => tool.toolName), nameAliases: Object.fromEntries(tools.filter((tool) => tool.nameAlias?.trim()).map((tool) => [tool.toolName, tool.nameAlias!.trim()])) };
}
export function importMcpJson(raw: string): Partial<McpForm> {
  let parsed = JSON.parse(raw) as Record<string, unknown>;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('请输入 MCP JSON 对象');
  if (parsed.mcpServers && typeof parsed.mcpServers === 'object') { const entry = Object.entries(parsed.mcpServers)[0]; if (!entry) throw new Error('mcpServers 不能为空'); parsed = { ...entry[1] as object, serverKey: entry[0] }; }
  const result: Partial<McpForm> = {};
  if (typeof parsed.serverKey === 'string') result.serverKey = parsed.serverKey;
  if (typeof parsed.name === 'string') result.name = parsed.name;
  const type = String(parsed.type || parsed.transport || '').toLowerCase();
  if (parsed.url || type.includes('http') || type === 'sse') { result.transport = type === 'sse' ? 'sse' : 'streamable_http'; result.url = String(parsed.url || ''); result.headersText = JSON.stringify(parsed.headers || {}, null, 2); }
  else if (parsed.command || type === 'stdio') { result.transport = 'stdio'; result.command = String(parsed.command || ''); result.argsText = Array.isArray(parsed.args) ? parsed.args.join('\n') : ''; result.envText = JSON.stringify(parsed.env || {}, null, 2); result.cwd = String(parsed.cwd || ''); }
  else throw new Error('未识别到服务地址或启动命令');
  return result;
}
