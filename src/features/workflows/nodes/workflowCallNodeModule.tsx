import { Workflow } from 'lucide-react';
import { WorkflowCallConfigPanel } from '../components/config-panels/WorkflowCallConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import { normalizeWorkflowCallConfig, parseWorkflowCallModule, serializeWorkflowCallNode, WORKFLOW_CALL_DESCRIPTION } from '../contracts/workflowCallNodeContract';
import { buildErrorCatchHandle, buildSourceHandle } from '../utils/edgeHandles';
import type { WorkflowNodeModule } from './types';

export const workflowCallNodeModule: WorkflowNodeModule = {
  type: 'workflowCall', backendType: 'workflowCall', backendRunnable: true,
  definition: { type: 'workflowCall', name: '工作流插件', description: WORKFLOW_CALL_DESCRIPTION, category: '工具', tone: 'bg-primary/10 text-primary-text border-primary/20', iconTone: 'bg-primary text-primary-foreground' },
  icon: Workflow, ConfigPanel: WorkflowCallConfigPanel, ExecutionDetails: DefaultNodeExecutionDetails,
  createDefaultConfig: () => ({ ...normalizeWorkflowCallConfig(undefined) }),
  getOutputs: node => {
    const c = normalizeWorkflowCallConfig(node.data.config);
    return [...c.exposedOutputs, ...(c.catchError ? [{ key: 'system_error_text', label: '错误信息', valueType: 'string' as const }] : [])];
  },
  getReferences: node => normalizeWorkflowCallConfig(node.data.config).inputMappings.filter(m => m.field.valueMode === 'reference').map(m => ({ value: m.field.value, context: `入参 ${m.key}` })),
  serialize: serializeWorkflowCallNode, parse: parseWorkflowCallModule,
  validate: node => normalizeWorkflowCallConfig(node.data.config).agentId ? [] : [`节点 ${node.data.label} 请选择工作流`],
  validateEdges: (node, _incoming, outgoing) => {
    const errors: string[] = [];
    const c = normalizeWorkflowCallConfig(node.data.config);
    const success = buildSourceHandle(node.id), failure = buildErrorCatchHandle(node.id);
    if (!outgoing.some(e => e.sourceHandle === success)) errors.push(`节点 ${node.data.label} 必须连接成功分支`);
    if (c.catchError && !outgoing.some(e => e.sourceHandle === failure)) errors.push(`节点 ${node.data.label} 必须连接异常分支`);
    if (outgoing.some(e => e.sourceHandle !== success && (!c.catchError || e.sourceHandle !== failure))) errors.push(`节点 ${node.data.label} 存在无效输出分支`);
    return errors;
  },
  connection: { allowIncoming: true, allowOutgoing: true, deletable: true, requireIncoming: true, requireOutgoing: true, maxIncoming: 1, maxOutgoing: 1 },
  resolveConnectionRules: node => ({ allowIncoming: true, allowOutgoing: true, deletable: true, requireIncoming: true, requireOutgoing: true, maxIncoming: 1, maxOutgoing: normalizeWorkflowCallConfig(node.data.config).catchError ? 2 : 1 }),
};
