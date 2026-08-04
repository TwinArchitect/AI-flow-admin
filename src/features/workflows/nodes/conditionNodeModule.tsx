import { GitBranch } from 'lucide-react';
import { ConditionConfigPanel } from '../components/config-panels/ConditionConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import {
  CONDITION_NODE_DESCRIPTION,
  CONDITION_NODE_OUTPUTS,
  createDefaultConditionConfig,
  getConditionReferences,
  normalizeConditionConfig,
  parseConditionModule,
  serializeConditionNode,
  validateConditionNode,
} from '../contracts/conditionNodeContract';
import type { ConditionNodeConfig } from '../types';
import {
  buildConditionElseHandle,
  buildConditionSourceHandle,
  getConditionBranchLabel,
} from '../utils/edgeHandles';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function ConfigPanel({
  nodeId,
  config,
  variables,
  onUpdate,
  onRemoveSourceHandle,
}: NodeConfigPanelProps) {
  return (
    <ConditionConfigPanel
      nodeId={nodeId}
      config={config as Record<string, unknown>}
      variables={variables}
      onUpdate={onUpdate as (config: Partial<ConditionNodeConfig>) => void}
      onRemoveSourceHandle={onRemoveSourceHandle}
    />
  );
}

export const conditionNodeModule: WorkflowNodeModule = {
  type: 'condition',
  backendType: 'ifElseNode',
  backendRunnable: true,
  definition: {
    type: 'condition',
    name: '判断器',
    description: CONDITION_NODE_DESCRIPTION,
    category: '逻辑',
    tone: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400',
    iconTone: 'bg-orange-500 text-white',
  },
  icon: GitBranch,
  createDefaultConfig: () => ({ ...createDefaultConditionConfig() }),
  ConfigPanel,
  ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: () => CONDITION_NODE_OUTPUTS,
  getReferences: getConditionReferences,
  serialize: serializeConditionNode,
  parse: parseConditionModule,
  validate: validateConditionNode,
  validateEdges: (node, _incoming, outgoing) => {
    const branchCount = normalizeConditionConfig(node.data.config).branches.length;
    const expectedHandles = [
      ...Array.from({ length: branchCount }, (_, index) => (
        buildConditionSourceHandle(node.id, index)
      )),
      buildConditionElseHandle(node.id),
    ];
    const errors: string[] = [];
    expectedHandles.forEach((handle, index) => {
      if (!outgoing.some((edge) => edge.sourceHandle === handle)) {
        const label = index < branchCount ? getConditionBranchLabel(index) : 'ELSE';
        errors.push(`节点 ${node.data.label} 必须连接 ${label} 分支`);
      }
    });
    if (outgoing.some((edge) => !expectedHandles.includes(edge.sourceHandle ?? ''))) {
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
    maxOutgoing: 2,
  },
  resolveConnectionRules: (node) => ({
    allowIncoming: true,
    allowOutgoing: true,
    deletable: true,
    requireIncoming: true,
    requireOutgoing: true,
    maxIncoming: 1,
    maxOutgoing: normalizeConditionConfig(node.data.config).branches.length + 1,
  }),
  getBranchHandles: (node) => {
    const branchCount = normalizeConditionConfig(node.data.config).branches.length;
    return [
      ...Array.from({ length: branchCount }, (_, index) => ({
        id: buildConditionSourceHandle(node.id, index),
        label: getConditionBranchLabel(index),
        description: index === 0 ? '首个命中分支' : '继续判断',
        tone: 'primary' as const,
      })),
      {
        id: buildConditionElseHandle(node.id),
        label: 'ELSE',
        description: '全部未命中',
        tone: 'muted' as const,
      },
    ];
  },
};
