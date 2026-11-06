import type { HttpToolSavePayload, HttpInputParamDto } from './httpTypes';
export const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
export const BODY_TYPES = ['none', 'form-data', 'x-www-form-urlencoded', 'json', 'xml', 'raw-text'];
export const PARAM_TYPES = ['string', 'number', 'boolean', 'object', 'array'];
export function newHttpTool(): HttpToolSavePayload {
  return { name: '', toolName: '', description: '', category: '实用工具', avatar: 'plugin-avatar:link', status: 0, method: 'POST', baseUrl: '', timeoutMs: 30000, bodyType: 'none', bodyContent: '', authorType: 'custom', inputParams: [], requestParams: [], requestHeaders: [] };
}
export function validateHttpTool(form: HttpToolSavePayload) {
  if (!form.name.trim() || !form.baseUrl.trim()) throw new Error('请填写工具名称和请求地址');
  if (!/^[a-zA-Z0-9_-]+$/.test(form.toolName?.trim() ?? '')) throw new Error('调用名称仅支持英文字母、数字、下划线和连字符');
  const url = new URL(form.baseUrl.replace(/\{\{[^}]+\}\}/g, 'value'));
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('请求地址必须使用 HTTP 或 HTTPS');
  const names = (form.inputParams ?? []).map((p) => p.name.trim());
  if (names.some((name) => !name) || new Set(names).size !== names.length) throw new Error('输入参数名不能为空或重复');
  for (const row of [...form.requestParams ?? [], ...form.requestHeaders ?? []]) {
    if (row.keyName.trim() && row.valueMode === 'input_ref' && !names.includes(row.valueText ?? '')) throw new Error('请求配置引用了不存在的输入参数');
  }
  return { ...form, name: form.name.trim(), toolName: form.toolName?.trim(), description: form.description?.trim(), baseUrl: form.baseUrl.trim(), timeoutMs: Math.max(1000, Number(form.timeoutMs) || 30000), inputParams: form.inputParams?.map((p, sortOrder) => ({ ...p, name: p.name.trim(), sortOrder })), requestParams: form.requestParams?.filter((p) => p.keyName.trim()).map((p, sortOrder) => ({ ...p, keyName: p.keyName.trim(), sortOrder })), requestHeaders: form.requestHeaders?.filter((p) => p.keyName.trim()).map((p, sortOrder) => ({ ...p, keyName: p.keyName.trim(), sortOrder })) };
}
export function makeDebugInputs(text: string) {
  const inputs: unknown = text.trim() ? JSON.parse(text) : {};
  if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs)) throw new Error('输入参数必须是 JSON 对象');
  return inputs as Record<string, unknown>;
}
export function sampleDebugInputs(params: HttpInputParamDto[]) {
  const sample: Record<string, unknown> = {};
  for (const param of params) {
    if (param.asToolParam === false) continue;
    const value = param.defaultValue ?? '';
    sample[param.name] = value !== ''
      ? param.paramType === 'number' ? Number(value) : param.paramType === 'boolean' ? value === 'true' : value
      : param.paramType === 'number' ? 0 : param.paramType === 'boolean' ? false : '';
  }
  return JSON.stringify(sample, null, 2);
}
/** 解析命令文本，绝不执行 shell。 */
export function parseCurl(text: string): Partial<HttpToolSavePayload> {
  const tokens = (text.replace(/\\\r?\n/g, ' ').match(/'[^']*'|"(?:\\.|[^"\\])*"|[^\s]+/g) ?? []).map((s) => s.replace(/^(['"])([\s\S]*)\1$/, '$2'));
  if (tokens.shift()?.toLowerCase() !== 'curl') throw new Error('请输入 cURL 命令');
  let method = ''; let baseUrl = ''; let bodyContent = '';
  const requestHeaders: NonNullable<HttpToolSavePayload['requestHeaders']> = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (['-X', '--request'].includes(token)) method = tokens[++i]?.toUpperCase() ?? '';
    else if (['-H', '--header'].includes(token)) { const value = tokens[++i] ?? ''; const split = value.indexOf(':'); if (split > 0) requestHeaders.push({ keyName: value.slice(0, split).trim(), valueMode: 'literal', valueText: value.slice(split + 1).trim() }); }
    else if (['-d', '--data', '--data-raw', '--data-binary'].includes(token)) bodyContent = tokens[++i] ?? '';
    else if (token === '--url') baseUrl = tokens[++i] ?? '';
    else if (/^https?:\/\//i.test(token)) baseUrl = token;
  }
  if (!baseUrl) throw new Error('cURL 中未找到 HTTP 请求地址');
  return { baseUrl, method: METHODS.includes(method) ? method : bodyContent ? 'POST' : 'GET', bodyContent, bodyType: bodyContent ? /^[\[{]/.test(bodyContent.trim()) ? 'json' : 'raw-text' : 'none', requestHeaders, requestParams: [] };
}
