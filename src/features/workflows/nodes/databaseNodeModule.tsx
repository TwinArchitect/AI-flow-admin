import { Database } from 'lucide-react';
import { DatabaseConfigPanel } from '../components/config-panels/DatabaseConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import {
  createDefaultDatabaseConfig,
  DATABASE_NODE_DESCRIPTION,
  DATABASE_NODE_OUTPUTS,
  getDatabaseReferences,
  normalizeDatabaseConfig,
  parseDatabaseModule,
  serializeDatabaseNode,
  validateDatabaseNode,
} from '../contracts/databaseNodeContract';
import type { DatabaseNodeConfig } from '../types';
import { buildErrorCatchHandle, buildSourceHandle } from '../utils/edgeHandles';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function ConfigPanel({ nodeId, config, variables, onUpdate, onRemoveSourceHandle }: NodeConfigPanelProps) {
  return (
    <DatabaseConfigPanel
      nodeId={nodeId}
      config={config as Record<string, unknown>}
      variables={variables}
      onUpdate={onUpdate as (config: Partial<DatabaseNodeConfig>) => void}
      onRemoveSourceHandle={onRemoveSourceHandle}
    />
  );
}

export const databaseNodeModule: WorkflowNodeModule = {
  type: 'database',
  backendType: 'databaseQuery',
  backendRunnable: true,
  definition: {
    type: 'database',
    name: '数据库',
    description: DATABASE_NODE_DESCRIPTION,
    category: '数据',
    tone: 'bg-emerald-600/10 text-emerald-700 border-emerald-600/20 dark:text-emerald-400',
    iconTone: 'bg-emerald-600 text-white',
  },
  icon: Database,
  createDefaultConfig: () => ({ ...createDefaultDatabaseConfig() }),
  ConfigPanel,
  ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: () => DATABASE_NODE_OUTPUTS,
  getReferences: getDatabaseReferences,
  serialize: serializeDatabaseNode,
  parse: parseDatabaseModule,
  validate: validateDatabaseNode,
  validateEdges: (node, _incoming, outgoing) => {
    const errors: string[] = [];
    const successHandle = buildSourceHandle(node.id);
    const errorHandle = buildErrorCatchHandle(node.id);
    const catchError = normalizeDatabaseConfig(node.data.config).catchError;
    if (!outgoing.some((edge) => edge.sourceHandle === successHandle)) errors.push(`节点 ${node.data.label} 必须连接成功分支`);
    if (catchError && !outgoing.some((edge) => edge.sourceHandle === errorHandle)) errors.push(`节点 ${node.data.label} 已开启错误捕获，必须连接异常分支`);
    if (!catchError && outgoing.some((edge) => edge.sourceHandle === errorHandle)) errors.push(`节点 ${node.data.label} 未开启错误捕获，不能保留异常分支`);
    if (outgoing.some((edge) => ![successHandle, errorHandle].includes(edge.sourceHandle ?? ''))) errors.push(`节点 ${node.data.label} 存在无法识别的输出分支`);
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
    maxOutgoing: normalizeDatabaseConfig(node.data.config).catchError ? 2 : 1,
  }),
};
