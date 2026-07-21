import { Square } from 'lucide-react';
import { EndConfigPanel } from '../components/config-panels/EndConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import {
  DEFAULT_END_CONFIG,
  normalizeEndConfig,
  parseEndModule,
  resolveEndNodeOutputs,
  serializeEndNode,
  validateEndNode,
} from '../contracts/endNodeContract';
import type { EndNodeConfig } from '../types';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function ConfigPanel({ config, variables, onUpdate }: NodeConfigPanelProps) {
  return (
    <EndConfigPanel
      config={config as Record<string, unknown>}
      variables={variables}
      onUpdate={onUpdate as (config: Partial<EndNodeConfig>) => void}
    />
  );
}

export const endNodeModule: WorkflowNodeModule = {
  type: 'end',
  backendType: 'workflowEnd',
  backendRunnable: true,
  definition: {
    type: 'end',
    name: '结束',
    description: '工作流出口',
    category: '系统',
    tone: 'bg-muted text-muted-foreground border-border',
    iconTone: 'bg-muted-foreground text-background',
  },
  icon: Square,
  createDefaultConfig: () => ({
    ...DEFAULT_END_CONFIG,
    outputVariables: DEFAULT_END_CONFIG.outputVariables.map((variable) => ({ ...variable })),
  }),
  ConfigPanel,
  ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: resolveEndNodeOutputs,
  getReferences: (node) =>
    normalizeEndConfig(node.data.config).outputVariables.map((variable) => ({
      value: variable.value,
      context: `结束节点输出 ${variable.key.trim() || '未命名字段'}`,
    })),
  serialize: serializeEndNode,
  parse: parseEndModule,
  validate: validateEndNode,
  connection: {
    allowIncoming: true,
    allowOutgoing: false,
    deletable: false,
    requireIncoming: true,
    maxOutgoing: 0,
  },
};
