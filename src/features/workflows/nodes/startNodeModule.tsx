import { Play } from 'lucide-react';
import { StartConfigPanel } from '../components/config-panels/StartConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import {
  DEFAULT_START_CONFIG,
  normalizeStartConfig,
  parseStartModule,
  resolveStartNodeOutputs,
  serializeStartNode,
  serializeStartVariables,
  validateStartNode,
} from '../contracts/startNodeContract';
import type { StartNodeConfig } from '../types';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function ConfigPanel({ config, onUpdate }: NodeConfigPanelProps) {
  return (
    <StartConfigPanel
      config={config as Record<string, unknown>}
      onUpdate={onUpdate as (config: Partial<StartNodeConfig>) => void}
    />
  );
}

export const startNodeModule: WorkflowNodeModule = {
  type: 'start',
  backendType: 'workflowStart',
  backendRunnable: true,
  definition: {
    type: 'start',
    name: '开始',
    description: '工作流入口',
    category: '系统',
    tone: 'bg-success/10 text-success border-success/20',
    iconTone: 'bg-success text-white',
  },
  icon: Play,
  createDefaultConfig: () => ({
    ...DEFAULT_START_CONFIG,
    variables: DEFAULT_START_CONFIG.variables.map((variable) => ({ ...variable })),
  }),
  ConfigPanel,
  ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: resolveStartNodeOutputs,
  getReferences: () => [],
  serialize: serializeStartNode,
  serializeChatVariables: (node) =>
    serializeStartVariables(normalizeStartConfig(node.data.config)),
  parse: (module, context) => parseStartModule(module, context.variables),
  validate: validateStartNode,
  connection: {
    allowIncoming: false,
    allowOutgoing: true,
    deletable: false,
    requireOutgoing: true,
    maxIncoming: 0,
    maxOutgoing: 1,
  },
};
