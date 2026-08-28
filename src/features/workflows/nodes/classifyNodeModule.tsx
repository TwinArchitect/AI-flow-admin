import { Search } from 'lucide-react';
import { ClassifyConfigPanel } from '../components/config-panels/ClassifyConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import {
  CLASSIFY_DEFAULT_AGENT_KEY,
  CLASSIFY_NODE_DESCRIPTION,
  CLASSIFY_NODE_OUTPUTS,
  createDefaultClassifyConfig,
  getClassifyCustomAgents,
  getClassifyReferences,
  normalizeClassifyConfig,
  parseClassifyModule,
  serializeClassifyNode,
  validateClassifyNode,
} from '../contracts/classifyNodeContract';
import type { ClassifyNodeConfig } from '../types';
import { buildClassifySourceHandle } from '../utils/edgeHandles';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function ConfigPanel({
  nodeId,
  config,
  variables,
  onUpdate,
  onRemoveSourceHandle,
}: NodeConfigPanelProps) {
  return (
    <ClassifyConfigPanel
      nodeId={nodeId}
      config={config as Record<string, unknown>}
      variables={variables}
      onUpdate={onUpdate as (config: Partial<ClassifyNodeConfig>) => void}
      onRemoveSourceHandle={onRemoveSourceHandle}
    />
  );
}

function getAgents(nodeConfig: unknown) {
  return normalizeClassifyConfig(nodeConfig).agents;
}

export const classifyNodeModule: WorkflowNodeModule = {
  type: 'classify',
  backendType: 'classifyQuestion',
  backendRunnable: true,
  definition: {
    type: 'classify',
    name: '意图识别',
    description: CLASSIFY_NODE_DESCRIPTION,
    category: '逻辑',
    tone: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
    iconTone: 'bg-amber-500 text-white',
  },
  icon: Search,
  createDefaultConfig: () => ({ ...createDefaultClassifyConfig() }),
  ConfigPanel,
  ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: () => CLASSIFY_NODE_OUTPUTS,
  getReferences: getClassifyReferences,
  serialize: serializeClassifyNode,
  parse: parseClassifyModule,
  validate: validateClassifyNode,
  validateEdges: (node, _incoming, outgoing) => {
    const agents = getAgents(node.data.config);
    const errors: string[] = [];
    agents.forEach((agent) => {
      const handle = buildClassifySourceHandle(node.id, agent.key);
      if (!outgoing.some((edge) => edge.sourceHandle === handle)) {
        const label = agent.key === CLASSIFY_DEFAULT_AGENT_KEY ? '默认' : agent.value || agent.key;
        errors.push(`节点 ${node.data.label} 必须连接「${label}」分支`);
      }
    });
    const expectedHandles = new Set(
      agents.map((agent) => buildClassifySourceHandle(node.id, agent.key)),
    );
    if (outgoing.some((edge) => !expectedHandles.has(edge.sourceHandle ?? ''))) {
      errors.push(`节点 ${node.data.label} 存在无法识别的输出分支`);
    }
    return errors;
  },
  connection: {
    allowIncoming: true,
    allowOutgoing: true,
    deletable: true,
    requireIncoming: true,
    requireOutgoing: true,
    maxIncoming: 1,
    maxOutgoing: 1,
  },
  resolveConnectionRules: (node) => ({
    allowIncoming: true,
    allowOutgoing: true,
    deletable: true,
    requireIncoming: true,
    requireOutgoing: true,
    maxIncoming: 1,
    maxOutgoing: getAgents(node.data.config).length,
  }),
  getBranchHandles: (node) => {
    const agents = getAgents(node.data.config);
    const customKeys = new Set(getClassifyCustomAgents(agents).map((agent) => agent.key));
    return agents.map((agent) => ({
      id: buildClassifySourceHandle(node.id, agent.key),
      label: agent.value || '未命名分类',
      description: customKeys.has(agent.key) ? '意图命中' : '默认分支',
      tone: customKeys.has(agent.key) ? 'primary' as const : 'muted' as const,
    }));
  },
};
