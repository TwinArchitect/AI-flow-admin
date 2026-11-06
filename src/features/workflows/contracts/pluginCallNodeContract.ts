import type { WorkflowCanvasNode, WorkflowModule, WorkflowModuleInput, WorkflowOutputSchema, WorkflowValueType } from '../types';
import type { HttpToolVO } from '@/features/agents/tools/httpTypes';
import type { McpServerVO } from '@/features/agents/tools/mcpTypes';
import type { WorkflowCallMapping } from './workflowCallNodeContract';
import { createCanvasNode, DEFAULT_MODULE_VERSION } from './shared';
import { moduleRefToString, stringToModuleRef } from '../utils/variableRefs';

export type PluginCallKind = 'httpPluginCall' | 'mcpCall';
export interface PluginCallConfig {
  httpToolId: string; toolName: string; pluginName: string; pluginRemark: string; method: string;
  mcpServerId: string; serverName: string; serverRemark: string; transport: string;
  headImg: string; enabledToolNames?: string[]; inputMappings: WorkflowCallMapping[];
  userChatInput: { valueMode: 'reference' | 'input'; value: string }; catchError: boolean; isMissing: boolean;
}
const META = new Set(['httpToolId', 'toolName', 'pluginName', 'pluginRemark', 'method', 'mcpServerId', 'serverName', 'serverRemark', 'transport', 'headImg', 'enabledToolNames']);
export function normalizePluginCall(value: unknown): PluginCallConfig {
  const raw = (value ?? {}) as Partial<PluginCallConfig>;
  return {
    httpToolId: String(raw.httpToolId ?? ''), toolName: String(raw.toolName ?? ''), pluginName: String(raw.pluginName ?? ''), pluginRemark: String(raw.pluginRemark ?? ''), method: String(raw.method ?? ''),
    mcpServerId: String(raw.mcpServerId ?? ''), serverName: String(raw.serverName ?? ''), serverRemark: String(raw.serverRemark ?? ''), transport: String(raw.transport ?? ''), headImg: String(raw.headImg ?? ''),
    enabledToolNames: raw.enabledToolNames?.map((name) => name.trim()).filter(Boolean),
    inputMappings: (raw.inputMappings ?? []).filter((item) => item?.key).map((item, index) => ({ ...item, id: item.id || `plugin-map-${index}-${item.key}`, label: item.label || item.key, valueType: item.valueType || 'string', required: Boolean(item.required), fixed: false, field: { valueMode: item.field?.valueMode === 'input' ? 'input' : 'reference', value: String(item.field?.value ?? '') } })),
    userChatInput: { valueMode: raw.userChatInput?.valueMode === 'input' ? 'input' : 'reference', value: String(raw.userChatInput?.value ?? '') }, catchError: Boolean(raw.catchError), isMissing: Boolean(raw.isMissing),
  };
}
export function pluginOutputs(kind: PluginCallKind, catchError = false): WorkflowOutputSchema[] {
  return [{ key: 'answer', label: '响应文本', valueType: 'string' }, ...(kind === 'httpPluginCall' ? [{ key: 'httpRawResponse', label: '原始响应', valueType: 'object' as const }] : []), ...(catchError ? [{ key: 'system_error_text', label: '错误信息', valueType: 'string' as const }] : [])];
}
export function buildHttpPluginConfig(tool: HttpToolVO, previous?: PluginCallConfig): PluginCallConfig {
  return normalizePluginCall({ httpToolId: tool.id, toolName: tool.toolName || '', pluginName: tool.name, pluginRemark: tool.description || '', headImg: tool.avatar || tool.iconUrl || '', method: tool.method, catchError: previous?.catchError,
    inputMappings: (tool.inputParams ?? []).filter((param) => param.asToolParam !== false && param.name?.trim()).map((param, index) => {
      const old = previous?.inputMappings.find((item) => item.key === param.name.trim());
      return { id: old?.id || `http-map-${index}-${param.name}`, key: param.name.trim(), label: param.description?.trim() || param.name, valueType: param.paramType as WorkflowValueType, required: Boolean(param.required), fixed: false, field: old?.field || { valueMode: param.defaultValue ? 'input' : 'reference', value: param.defaultValue ?? '' } };
    }),
  });
}
export function buildMcpPluginConfig(server: McpServerVO, previous?: PluginCallConfig): PluginCallConfig {
  return normalizePluginCall({ mcpServerId: server.id, serverName: server.name, serverRemark: server.description || '', headImg: server.avatar || server.iconUrl || '', transport: server.transport, enabledToolNames: previous?.enabledToolNames, userChatInput: previous?.userChatInput, catchError: previous?.catchError });
}
function fieldInput(key: string, label: string, field: PluginCallConfig['userChatInput'], valueType = 'string', required = false): WorkflowModuleInput {
  let value: unknown = field.value;
  if (field.valueMode === 'reference') {
    value = stringToModuleRef(field.value);
    if (valueType === 'arrayString') value = Array.isArray(value) ? [value] : [];
  }
  return { key, label, valueType, required, renderTypeList: ['reference', 'input'], selectedTypeIndex: field.valueMode === 'reference' ? 0 : 1, value };
}
export function serializePluginCall(node: WorkflowCanvasNode): WorkflowModule {
  const kind = node.data.nodeType as PluginCallKind; const c = normalizePluginCall(node.data.config);
  const keys = kind === 'httpPluginCall' ? ['httpToolId', 'toolName', 'pluginName', 'pluginRemark', 'headImg', 'method'] as const : ['mcpServerId', 'serverName', 'serverRemark', 'headImg', 'transport'] as const;
  const inputs: WorkflowModuleInput[] = keys.map((key) => ({ key, label: key, valueType: 'string', renderTypeList: ['hidden'], required: key === 'httpToolId' || key === 'mcpServerId', value: c[key] }));
  if (kind === 'httpPluginCall') inputs.push(...c.inputMappings.map((item) => fieldInput(item.key, item.label, item.field, item.valueType, item.required)));
  else inputs.push({ key: 'enabledToolNames', label: '工具白名单', valueType: 'string', renderTypeList: ['hidden'], value: c.enabledToolNames?.join(',') || '' }, fieldInput('userChatInput', '用户问题', c.userChatInput, 'string', true));
  return { flowNodeType: kind, nodeId: node.id, name: node.data.label, intro: node.data.description, avatar: `core/workflow/template/${kind}`, version: DEFAULT_MODULE_VERSION, position: node.position, showStatus: true, catchError: c.catchError, inputs, outputs: pluginOutputs(kind, c.catchError).map((output) => ({ ...output, id: output.key, type: output.key === 'system_error_text' ? 'error' : 'static' })) };
}
function parseField(input?: WorkflowModuleInput): PluginCallConfig['userChatInput'] {
  if (!input) return { valueMode: 'reference', value: '' };
  const reference = (input.renderTypeList?.[input.selectedTypeIndex ?? 0] ?? input.renderTypeList?.[0] ?? 'reference') === 'reference';
  const raw = reference && input.valueType === 'arrayString' && Array.isArray(input.value) && Array.isArray(input.value[0]) ? input.value[0] : input.value;
  return { valueMode: reference ? 'reference' : 'input', value: reference ? moduleRefToString(raw) : typeof raw === 'string' ? raw : raw == null ? '' : JSON.stringify(raw) };
}
export function parsePluginCall(module: WorkflowModule): WorkflowCanvasNode {
  const kind = module.flowNodeType as PluginCallKind; const input = (key: string) => module.inputs?.find((item) => item.key === key);
  const metadata = Object.fromEntries([...META].filter((key) => key !== 'enabledToolNames').map((key) => [key, input(key)?.value ?? '']));
  const allow = input('enabledToolNames')?.value;
  return createCanvasNode(kind, module, { ...normalizePluginCall({ ...metadata, catchError: module.catchError,
    enabledToolNames: Array.isArray(allow) ? allow.map(String) : String(allow || '').split(/[,，\s]+/).filter(Boolean), userChatInput: parseField(input('userChatInput')),
    inputMappings: kind === 'httpPluginCall' ? (module.inputs ?? []).filter((item) => !META.has(item.key)).map((item, index) => ({ id: `map-${index}-${item.key}`, key: item.key, label: item.label || item.key, valueType: (item.valueType || 'string') as WorkflowValueType, required: Boolean(item.required), fixed: false, field: parseField(item) })) : [],
  }) });
}
