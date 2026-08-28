import { FileText } from 'lucide-react';
import { ReadFilesConfigPanel } from '../components/config-panels/ReadFilesConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import {
  createDefaultReadFilesConfig,
  getReadFilesReferences,
  normalizeReadFilesConfig,
  parseReadFilesModule,
  READ_FILES_NODE_DESCRIPTION,
  READ_FILES_NODE_OUTPUTS,
  serializeReadFilesNode,
  validateReadFilesNode,
} from '../contracts/readFilesNodeContract';
import type { ReadFilesNodeConfig } from '../types';
import { buildErrorCatchHandle, buildSourceHandle } from '../utils/edgeHandles';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function ConfigPanel({ nodeId, config, variables, onUpdate, onRemoveSourceHandle }: NodeConfigPanelProps) {
  return (
    <ReadFilesConfigPanel
      nodeId={nodeId}
      config={config as Record<string, unknown>}
      variables={variables}
      onUpdate={onUpdate as (config: Partial<ReadFilesNodeConfig>) => void}
      onRemoveSourceHandle={onRemoveSourceHandle}
    />
  );
}

export const readFilesNodeModule: WorkflowNodeModule = {
  type: 'readFiles',
  backendType: 'readFiles',
  backendRunnable: true,
  definition: {
    type: 'readFiles',
    name: '文件解析',
    description: READ_FILES_NODE_DESCRIPTION,
    category: '数据',
    tone: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400',
    iconTone: 'bg-cyan-500 text-white',
  },
  icon: FileText,
  createDefaultConfig: () => ({ ...createDefaultReadFilesConfig() }),
  ConfigPanel,
  ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: () => READ_FILES_NODE_OUTPUTS,
  getReferences: getReadFilesReferences,
  serialize: serializeReadFilesNode,
  parse: parseReadFilesModule,
  validate: validateReadFilesNode,
  validateEdges: (node, _incoming, outgoing) => {
    const errors: string[] = [];
    const successHandle = buildSourceHandle(node.id);
    const errorHandle = buildErrorCatchHandle(node.id);
    const catchError = normalizeReadFilesConfig(node.data.config).catchError;
    if (!outgoing.some((edge) => edge.sourceHandle === successHandle)) {
      errors.push(`节点 ${node.data.label} 必须连接成功分支`);
    }
    if (catchError && !outgoing.some((edge) => edge.sourceHandle === errorHandle)) {
      errors.push(`节点 ${node.data.label} 已开启错误捕获，必须连接异常分支`);
    }
    if (!catchError && outgoing.some((edge) => edge.sourceHandle === errorHandle)) {
      errors.push(`节点 ${node.data.label} 未开启错误捕获，不能保留异常分支`);
    }
    if (outgoing.some((edge) => ![successHandle, errorHandle].includes(edge.sourceHandle ?? ''))) {
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
    maxOutgoing: normalizeReadFilesConfig(node.data.config).catchError ? 2 : 1,
  }),
};
