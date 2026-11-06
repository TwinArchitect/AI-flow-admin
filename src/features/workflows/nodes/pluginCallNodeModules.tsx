import { Link2, Terminal } from 'lucide-react';
import { HttpPluginCallConfigPanel, McpCallConfigPanel } from '../components/config-panels/PluginCallConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import { normalizePluginCall, parsePluginCall, serializePluginCall, pluginOutputs, type PluginCallKind } from '../contracts/pluginCallNodeContract';
import { buildErrorCatchHandle, buildSourceHandle } from '../utils/edgeHandles';
import type { WorkflowNodeModule } from './types';

function createPluginModule(kind: PluginCallKind): WorkflowNodeModule {
  const http = kind === 'httpPluginCall';
  return {
    type: kind, backendType: kind, backendRunnable: true,
    definition: { type: kind, name: http ? 'HTTP 工具调用' : 'MCP 工具调用', description: http ? '调用插件中心已注册的 HTTP 工具' : '调用插件中心的远程 MCP 工具', category: '工具', badgeVariant: 'info', iconTone: 'bg-primary text-primary-foreground' },
    icon: http ? Link2 : Terminal, ConfigPanel: http ? HttpPluginCallConfigPanel : McpCallConfigPanel, ExecutionDetails: DefaultNodeExecutionDetails,
    createDefaultConfig: () => ({ ...normalizePluginCall(undefined) }),
    getOutputs: (node) => pluginOutputs(kind, normalizePluginCall(node.data.config).catchError),
    getReferences: (node) => { const c = normalizePluginCall(node.data.config); return http ? c.inputMappings.filter((item) => item.field.valueMode === 'reference').map((item) => ({ value: item.field.value, context: `入参 ${item.key}` })) : c.userChatInput.valueMode === 'reference' ? [{ value: c.userChatInput.value, context: 'MCP 主输入' }] : []; },
    serialize: serializePluginCall, parse: parsePluginCall,
    validate: (node) => {
      const c = normalizePluginCall(node.data.config); const errors: string[] = [];
      if (!(http ? c.httpToolId : c.mcpServerId)) errors.push(`节点 ${node.data.label} 请选择${http ? 'HTTP 工具' : 'MCP 服务'}`);
      if (http) { for (const item of c.inputMappings) if (item.required && !item.field.value.trim()) errors.push(`节点 ${node.data.label} 请配置必填入参 ${item.key}`); }
      else { if (c.transport === 'stdio') errors.push(`节点 ${node.data.label} 不支持 stdio 服务`); if (c.enabledToolNames?.length !== 1) errors.push(`节点 ${node.data.label} 请选择一个 MCP 工具`); if (!c.userChatInput.value.trim()) errors.push(`节点 ${node.data.label} 请配置 MCP 主输入`); }
      return errors;
    },
    validateEdges: (node, _incoming, outgoing) => {
      const c = normalizePluginCall(node.data.config); const success = buildSourceHandle(node.id); const failure = buildErrorCatchHandle(node.id); const errors: string[] = [];
      if (!outgoing.some((edge) => edge.sourceHandle === success)) errors.push(`节点 ${node.data.label} 必须连接成功分支`);
      if (c.catchError && !outgoing.some((edge) => edge.sourceHandle === failure)) errors.push(`节点 ${node.data.label} 必须连接异常分支`);
      if (outgoing.some((edge) => edge.sourceHandle !== success && (!c.catchError || edge.sourceHandle !== failure))) errors.push(`节点 ${node.data.label} 存在无效输出分支`);
      return errors;
    },
    connection: { allowIncoming: true, allowOutgoing: true, deletable: true, requireIncoming: true, requireOutgoing: true, maxIncoming: 1, maxOutgoing: 1 },
    resolveConnectionRules: (node) => ({ allowIncoming: true, allowOutgoing: true, deletable: true, requireIncoming: true, requireOutgoing: true, maxIncoming: 1, maxOutgoing: normalizePluginCall(node.data.config).catchError ? 2 : 1 }),
  };
}
export const httpPluginCallNodeModule = createPluginModule('httpPluginCall');
export const mcpCallNodeModule = createPluginModule('mcpCall');
