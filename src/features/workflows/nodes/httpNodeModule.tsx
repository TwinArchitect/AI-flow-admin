import { Globe } from 'lucide-react';
import { HttpConfigPanel } from '../components/config-panels/HttpConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import {
  createDefaultHttpConfig,
  getHttpReferences,
  normalizeHttpConfig,
  parseHttpModule,
  resolveHttpNodeOutputs,
  serializeHttpNode,
  validateHttpNode,
} from '../contracts/httpNodeContract';
import type { HttpNodeConfig } from '../types';
import { buildErrorCatchHandle, buildSourceHandle } from '../utils/edgeHandles';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function ConfigPanel({ nodeId, config, variables, onUpdate, onRemoveSourceHandle }: NodeConfigPanelProps) {
  return (
    <HttpConfigPanel
      nodeId={nodeId}
      config={config as Record<string, unknown>}
      variables={variables}
      onUpdate={onUpdate as (config: Partial<HttpNodeConfig>) => void}
      onRemoveSourceHandle={onRemoveSourceHandle}
    />
  );
}

export const httpNodeModule: WorkflowNodeModule = {
  type: 'http',
  backendType: 'httpRequest468',
  backendRunnable: true,
  definition: {
    type: 'http',
    name: 'HTTP 请求',
    description: '调用外部接口获取数据',
    category: '工具',
    tone: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
    iconTone: 'bg-blue-500 text-white',
  },
  icon: Globe,
  createDefaultConfig: createDefaultHttpConfig,
  ConfigPanel,
  ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: resolveHttpNodeOutputs,
  getReferences: getHttpReferences,
  serialize: serializeHttpNode,
  parse: parseHttpModule,
  validate: validateHttpNode,
  validateEdges: (node, _incoming, outgoing) => {
    const errors: string[] = [];
    const successHandle = buildSourceHandle(node.id);
    const errorHandle = buildErrorCatchHandle(node.id);
    const catchError = normalizeHttpConfig(node.data.config).catchError;
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
    maxOutgoing: normalizeHttpConfig(node.data.config).catchError ? 2 : 1,
  }),
};
