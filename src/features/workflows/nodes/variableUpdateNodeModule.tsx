import { Variable } from 'lucide-react';
import { VariableUpdateConfigPanel } from '../components/config-panels/VariableUpdateConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import {
  createDefaultVariableUpdateConfig,
  getVariableUpdateReferences,
  parseVariableUpdateModule,
  serializeVariableUpdateNode,
  validateVariableUpdateNode,
  VARIABLE_UPDATE_NODE_DESCRIPTION,
} from '../contracts/variableUpdateNodeContract';
import type { VariableUpdateNodeConfig } from '../types';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function ConfigPanel({ config, variables, onUpdate }: NodeConfigPanelProps) {
  return (
    <VariableUpdateConfigPanel
      config={config as Record<string, unknown>}
      variables={variables}
      onUpdate={onUpdate as (config: Partial<VariableUpdateNodeConfig>) => void}
    />
  );
}

export const variableUpdateNodeModule: WorkflowNodeModule = {
  type: 'variableUpdate',
  backendType: 'variableUpdate',
  backendRunnable: true,
  definition: {
    type: 'variableUpdate',
    name: '变量更新',
    description: VARIABLE_UPDATE_NODE_DESCRIPTION,
    category: '基础',
    tone: 'bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400',
    iconTone: 'bg-teal-500 text-white',
  },
  icon: Variable,
  createDefaultConfig: () => ({ ...createDefaultVariableUpdateConfig() }),
  ConfigPanel,
  ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: () => [],
  getReferences: getVariableUpdateReferences,
  serialize: serializeVariableUpdateNode,
  parse: parseVariableUpdateModule,
  validate: validateVariableUpdateNode,
  connection: {
    allowIncoming: true,
    allowOutgoing: true,
    deletable: true,
    requireIncoming: true,
    requireOutgoing: true,
    maxIncoming: 1,
    maxOutgoing: 1,
  },
};
