import { Plus } from 'lucide-react';
import { ConcatConfigPanel } from '../components/config-panels/ConcatConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import {
  CONCAT_NODE_DESCRIPTION,
  CONCAT_NODE_OUTPUTS,
  DEFAULT_CONCAT_CONFIG,
  normalizeConcatConfig,
  parseConcatModule,
  serializeConcatNode,
  validateConcatNode,
} from '../contracts/concatNodeContract';
import type { ConcatNodeConfig } from '../types';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function ConfigPanel({ config, variables, onUpdate }: NodeConfigPanelProps) {
  return (
    <ConcatConfigPanel
      config={config as Record<string, unknown>}
      variables={variables}
      onUpdate={onUpdate as (config: Partial<ConcatNodeConfig>) => void}
    />
  );
}

export const concatNodeModule: WorkflowNodeModule = {
  type: 'concat',
  backendType: 'textEditor',
  backendRunnable: true,
  definition: {
    type: 'concat',
    name: '文本拼接',
    description: CONCAT_NODE_DESCRIPTION,
    category: '基础',
    tone: 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400',
    iconTone: 'bg-sky-500 text-white',
  },
  icon: Plus,
  createDefaultConfig: () => ({ ...DEFAULT_CONCAT_CONFIG }),
  ConfigPanel,
  ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: () => CONCAT_NODE_OUTPUTS,
  getReferences: (node) => [{
    value: normalizeConcatConfig(node.data.config).template,
    context: `节点 ${node.data.label} 的拼接模板`,
  }],
  serialize: serializeConcatNode,
  parse: parseConcatModule,
  validate: validateConcatNode,
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
