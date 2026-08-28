import { BookOpen } from 'lucide-react';
import { DatasetSearchConfigPanel } from '../components/config-panels/DatasetSearchConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import {
  createDefaultDatasetSearchConfig,
  DATASET_SEARCH_NODE_DESCRIPTION,
  DATASET_SEARCH_NODE_OUTPUTS,
  getDatasetSearchReferences,
  normalizeDatasetSearchConfig,
  parseDatasetSearchModule,
  serializeDatasetSearchNode,
  validateDatasetSearchNode,
} from '../contracts/datasetSearchNodeContract';
import type { DatasetSearchNodeConfig } from '../types';
import { buildErrorCatchHandle, buildSourceHandle } from '../utils/edgeHandles';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function ConfigPanel({ nodeId, config, variables, onUpdate, onRemoveSourceHandle }: NodeConfigPanelProps) {
  return <DatasetSearchConfigPanel
    nodeId={nodeId}
    config={config as Record<string, unknown>}
    variables={variables}
    onUpdate={onUpdate as (config: Partial<DatasetSearchNodeConfig>) => void}
    onRemoveSourceHandle={onRemoveSourceHandle}
  />;
}

export const datasetSearchNodeModule: WorkflowNodeModule = {
  type: 'knowledge', backendType: 'datasetSearchNode', backendRunnable: true,
  definition: {
    type: 'knowledge', name: '知识库搜索', description: DATASET_SEARCH_NODE_DESCRIPTION,
    category: '数据',
    tone: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
    iconTone: 'bg-blue-500 text-white',
  },
  icon: BookOpen,
  createDefaultConfig: () => ({ ...createDefaultDatasetSearchConfig() }),
  ConfigPanel,
  ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: () => DATASET_SEARCH_NODE_OUTPUTS,
  getReferences: getDatasetSearchReferences,
  serialize: serializeDatasetSearchNode,
  parse: parseDatasetSearchModule,
  validate: validateDatasetSearchNode,
  validateEdges: (node, _incoming, outgoing) => {
    const errors: string[] = [];
    const successHandle = buildSourceHandle(node.id);
    const errorHandle = buildErrorCatchHandle(node.id);
    const catchError = normalizeDatasetSearchConfig(node.data.config).catchError;
    if (!outgoing.some((edge) => edge.sourceHandle === successHandle)) errors.push(`节点 ${node.data.label} 必须连接成功分支`);
    if (catchError && !outgoing.some((edge) => edge.sourceHandle === errorHandle)) errors.push(`节点 ${node.data.label} 已开启错误捕获，必须连接异常分支`);
    if (!catchError && outgoing.some((edge) => edge.sourceHandle === errorHandle)) errors.push(`节点 ${node.data.label} 未开启错误捕获，不能保留异常分支`);
    return errors;
  },
  connection: {
    allowIncoming: true, allowOutgoing: true, deletable: true,
    requireIncoming: true, requireOutgoing: true, maxIncoming: 1, maxOutgoing: 1,
  },
  resolveConnectionRules: (node) => ({
    allowIncoming: true, allowOutgoing: true, deletable: true,
    requireIncoming: true, requireOutgoing: true, maxIncoming: 1,
    maxOutgoing: normalizeDatasetSearchConfig(node.data.config).catchError ? 2 : 1,
  }),
};
