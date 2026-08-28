import { BarChart3 } from 'lucide-react';
import { BaseChartConfigPanel } from '../components/config-panels/BaseChartConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import {
  BASE_CHART_NODE_DESCRIPTION,
  BASE_CHART_NODE_OUTPUTS,
  createDefaultBaseChartConfig,
  getBaseChartReferences,
  parseBaseChartModule,
  serializeBaseChartNode,
  validateBaseChartNode,
} from '../contracts/baseChartNodeContract';
import type { BaseChartNodeConfig } from '../types';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function ConfigPanel({ config, variables, onUpdate }: NodeConfigPanelProps) {
  return <BaseChartConfigPanel config={config as Record<string, unknown>} variables={variables} onUpdate={onUpdate as (config: Partial<BaseChartNodeConfig>) => void} />;
}

export const baseChartNodeModule: WorkflowNodeModule = {
  type: 'baseChart',
  backendType: 'chartVisual',
  backendRunnable: true,
  definition: {
    type: 'baseChart',
    name: '基础图表',
    description: BASE_CHART_NODE_DESCRIPTION,
    category: '数据',
    tone: 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400',
    iconTone: 'bg-violet-500 text-white',
  },
  icon: BarChart3,
  createDefaultConfig: () => ({ ...createDefaultBaseChartConfig() }),
  ConfigPanel,
  ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: () => BASE_CHART_NODE_OUTPUTS,
  getReferences: getBaseChartReferences,
  serialize: serializeBaseChartNode,
  parse: parseBaseChartModule,
  validate: validateBaseChartNode,
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
