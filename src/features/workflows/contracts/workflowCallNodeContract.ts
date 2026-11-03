import type { WorkflowCanvasNode, WorkflowModule, WorkflowModuleInput, WorkflowOutputSchema, WorkflowValueType } from '../types';
import { createCanvasNode, DEFAULT_MODULE_VERSION } from './shared';
import { moduleRefToString, stringToModuleRef } from '../utils/variableRefs';

export interface WorkflowCallMapping {
  id: string;
  key: string;
  label: string;
  valueType: WorkflowValueType;
  required: boolean;
  fixed: boolean;
  field: { valueMode: 'reference' | 'input'; value: string };
}
export interface WorkflowCallConfig {
  agentId: string;
  agentName: string;
  agentRemark: string;
  headImg?: string;
  publishedOnly: true;
  isMissing: boolean;
  inputMappings: WorkflowCallMapping[];
  exposedOutputs: WorkflowOutputSchema[];
  catchError: boolean;
}
export const WORKFLOW_CALL_DESCRIPTION = '阻塞调用已发布的子工作流，并将其结束节点输出暴露给下游';
const metaKeys = new Set(['agentId', 'publishedOnly', 'agentName', 'agentRemark', 'headImg']);
const userQuestion = (): WorkflowCallMapping => ({ id: 'fixed-userChatInput', key: 'userChatInput', label: '用户问题', valueType: 'string', required: true, fixed: true, field: { valueMode: 'reference', value: '' } });
export function normalizeWorkflowCallConfig(value: unknown): WorkflowCallConfig {
  const raw = (value ?? {}) as Partial<WorkflowCallConfig>;
  const mappings = (Array.isArray(raw.inputMappings) ? raw.inputMappings : []).filter(item => item?.key?.trim()).map((item, index) => ({
    ...item, id: item.id || `map-${index}-${item.key}`, key: item.key.trim(), label: item.label || item.key,
    valueType: item.valueType || 'string', fixed: item.key === 'userChatInput' || Boolean(item.fixed),
    required: item.key === 'userChatInput' || Boolean(item.required),
    field: { valueMode: item.field?.valueMode === 'input' ? 'input' as const : 'reference' as const, value: String(item.field?.value ?? '') },
  }));
  if (!mappings.some(item => item.key === 'userChatInput')) mappings.unshift(userQuestion());
  return {
    agentId: String(raw.agentId ?? '').trim(), agentName: String(raw.agentName ?? ''), agentRemark: String(raw.agentRemark ?? ''), headImg: raw.headImg,
    publishedOnly: true, isMissing: Boolean(raw.isMissing), inputMappings: mappings,
    exposedOutputs: (raw.exposedOutputs ?? []).filter(item => item?.key?.trim()).map(item => ({ ...item, key: item.key.trim(), label: item.label || item.key })), catchError: Boolean(raw.catchError),
  };
}

export function buildWorkflowCallFromSetting(setting: unknown, meta: { agentId: string; agentName: string; agentRemark?: string; headImg?: string }, previous?: WorkflowCallConfig): WorkflowCallConfig {
  let parsed = setting;
  for (let i = 0; i < 2 && typeof parsed === 'string'; i++) parsed = JSON.parse(parsed);
  if (!parsed || typeof parsed !== 'object') throw new Error('目标工作流配置为空');
  const payload = parsed as {
    modules?: WorkflowModule[];
    nodes?: Array<{ id?: string; type?: string; data?: { config?: { resultRef?: unknown; outputVariables?: Array<{ key?: string; value?: unknown }> } } }>;
    chatConfig?: { variables?: Array<{ key: string; label?: string; valueType?: WorkflowValueType; required?: boolean; system?: boolean }> };
  };
  let modules = payload.modules;
  if (!Array.isArray(modules) && Array.isArray(payload.nodes) && payload.nodes.length) {
    // 这里只推导目标调用 schema，无需导入其他节点或依赖画布 registry。
    const legacyEnd = payload.nodes.find(node => node.type === 'end' || node.type === 'workflowEnd');
    const config = legacyEnd?.data?.config ?? {};
    const variables = 'resultRef' in config
      ? config.resultRef ? [{ key: 'result', value: config.resultRef }] : []
      : config.outputVariables ?? [];
    const outputs = variables.filter(v => String(v.key ?? '').trim()).map(v => ({ id: String(v.key).trim(), key: String(v.key).trim(), label: String(v.key).trim(), type: 'static', valueType: 'string' }));
    modules = legacyEnd ? [{ flowNodeType: 'workflowEnd', nodeId: legacyEnd.id || 'end', name: '结束', position: { x: 0, y: 0 }, inputs: [], outputs }] : [];
  }
  if (!Array.isArray(modules)) throw new Error('目标工作流配置缺少 modules 或有效的 nodes');
  const defs = [userQuestion(), ...(payload.chatConfig?.variables ?? []).filter(v => !v.system && v.key && v.key !== 'files' && v.key !== 'userChatInput').map((v, i) => ({
    id: `map-${i}-${v.key}`, key: v.key, label: v.label || v.key, valueType: v.valueType || 'string' as const, required: v.required === true, fixed: false,
    field: { valueMode: 'reference' as const, value: '' },
  }))];
  const end = modules.find(m => m.flowNodeType === 'workflowEnd');
  let outputs: WorkflowOutputSchema[] = (end?.outputs ?? []).filter(o => o.type !== 'error' && o.key !== 'system_error_text' && o.key?.trim()).map(o => ({ key: o.key.trim(), label: o.label || o.key, valueType: (o.valueType || 'string') as WorkflowValueType }));
  if (!outputs.length) outputs = (end?.inputs ?? []).filter(o => o.key?.trim() && o.key !== 'resultRef').map(o => ({ key: o.key.trim(), label: o.label || o.key, valueType: (o.valueType || 'string') as WorkflowValueType }));
  return normalizeWorkflowCallConfig({ ...meta, inputMappings: defs.map(def => {
    const existing = previous?.inputMappings.find(old => old.key === def.key);
    return { ...def, id: existing?.id || def.id, field: existing?.field ?? def.field };
  }), exposedOutputs: outputs, catchError: previous?.catchError ?? false });
}

function mappingInput(item: WorkflowCallMapping): WorkflowModuleInput {
  let value: unknown = item.field.value;
  if (item.field.valueMode === 'reference') {
    value = stringToModuleRef(item.field.value);
    if (item.valueType === 'arrayString') value = Array.isArray(value) ? [value] : [];
  }
  return { key: item.key, label: item.label, valueType: item.valueType, required: item.required, renderTypeList: ['reference', 'input'], selectedTypeIndex: item.field.valueMode === 'reference' ? 0 : 1, value, ...(item.fixed ? { description: '对应子流程用户消息（message）' } : {}) };
}
export function serializeWorkflowCallNode(node: WorkflowCanvasNode): WorkflowModule {
  const c = normalizeWorkflowCallConfig(node.data.config);
  return {
    flowNodeType: 'workflowCall', avatar: 'core/workflow/template/workflowCall', version: DEFAULT_MODULE_VERSION, nodeId: node.id, name: node.data.label, intro: node.data.description || WORKFLOW_CALL_DESCRIPTION,
    position: node.position, showStatus: true, catchError: c.catchError, agentId: c.agentId || undefined, publishedOnly: true,
    inputs: [
      { key: 'agentId', label: '目标工作流', valueType: 'string', required: true, renderTypeList: ['hidden'], value: c.agentId },
      { key: 'publishedOnly', label: '仅已发布', valueType: 'boolean', renderTypeList: ['hidden'], value: true },
      ...(['agentName', 'agentRemark', 'headImg'] as const).map(key => ({ key, label: { agentName: '工作流名称', agentRemark: '工作流描述', headImg: '头像' }[key], valueType: 'string', renderTypeList: ['hidden'], value: c[key] || '' })),
      ...c.inputMappings.map(mappingInput),
    ],
    outputs: [...c.exposedOutputs.map(o => ({ ...o, id: o.key, type: 'static', description: '' })), ...(c.catchError ? [{ id: 'system_error_text', key: 'system_error_text', label: '错误信息', type: 'error', valueType: 'string', description: '' }] : [])],
  };
}
export function parseWorkflowCallModule(module: WorkflowModule): WorkflowCanvasNode {
  const input = (key: string) => module.inputs?.find(i => i.key === key)?.value;
  const mappings = (module.inputs ?? []).filter(i => i.key && !metaKeys.has(i.key)).map((i, index): WorkflowCallMapping => {
    const types = i.renderTypeList ?? ['reference'];
    const selected = i.selectedTypeIndex ?? 0;
    const reference = (types[selected] ?? types[0]) === 'reference';
    const raw = reference && i.valueType === 'arrayString' && Array.isArray(i.value) && Array.isArray(i.value[0]) ? i.value[0] : i.value;
    return { id: `map-${index}-${i.key}`, key: i.key, label: i.label || i.key, valueType: (i.valueType || 'string') as WorkflowValueType, required: Boolean(i.required), fixed: i.key === 'userChatInput', field: { valueMode: reference ? 'reference' : 'input', value: reference ? moduleRefToString(raw) : typeof raw === 'string' ? raw : raw == null ? '' : JSON.stringify(raw) } };
  });
  return createCanvasNode('workflowCall', module, { ...normalizeWorkflowCallConfig({
    agentId: String(module.agentId || input('agentId') || ''), agentName: String(input('agentName') || module.name || ''), agentRemark: String(input('agentRemark') || module.intro || ''), headImg: String(input('headImg') || ''),
    inputMappings: mappings, exposedOutputs: (module.outputs ?? []).filter(o => o.type !== 'error' && o.key !== 'system_error_text' && o.key?.trim()).map(o => ({ key: o.key, label: o.label || o.key, valueType: (o.valueType || 'string') as WorkflowValueType })), catchError: module.catchError,
  }) });
}
