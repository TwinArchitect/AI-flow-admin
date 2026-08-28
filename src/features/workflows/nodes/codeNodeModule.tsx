import { Code2 } from 'lucide-react';
import { CodeConfigPanel } from '../components/config-panels/CodeConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import {
  CODE_NODE_DESCRIPTION,
  createDefaultCodeConfig,
  getCodeReferences,
  normalizeCodeConfig,
  parseCodeModule,
  resolveCodeNodeOutputs,
  serializeCodeNode,
  validateCodeNode,
} from '../contracts/codeNodeContract';
import type { CodeNodeConfig } from '../types';
import { buildErrorCatchHandle, buildSourceHandle } from '../utils/edgeHandles';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function ConfigPanel({ nodeId, config, variables, onUpdate, onRemoveSourceHandle }: NodeConfigPanelProps) {
  return (
    <CodeConfigPanel
      nodeId={nodeId}
      config={config as Record<string, unknown>}
      variables={variables}
      onUpdate={onUpdate as (config: Partial<CodeNodeConfig>) => void}
      onRemoveSourceHandle={onRemoveSourceHandle}
    />
  );
}

export const codeNodeModule: WorkflowNodeModule = {
  type: 'code',
  backendType: 'code',
  backendRunnable: true,
  definition: {
    type: 'code',
    name: '代码执行',
    description: CODE_NODE_DESCRIPTION,
    category: '逻辑',
    tone: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400',
    iconTone: 'bg-orange-500 text-white',
  },
  icon: Code2,
  createDefaultConfig: () => ({ ...createDefaultCodeConfig() }),
  ConfigPanel,
  ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: resolveCodeNodeOutputs,
  getReferences: getCodeReferences,
  serialize: serializeCodeNode,
  parse: parseCodeModule,
  validate: validateCodeNode,
  validateEdges: (node, _incoming, outgoing) => {
    const errors: string[] = [];
    const successHandle = buildSourceHandle(node.id);
    const errorHandle = buildErrorCatchHandle(node.id);
    const catchError = normalizeCodeConfig(node.data.config).catchError;
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
    maxOutgoing: normalizeCodeConfig(node.data.config).catchError ? 2 : 1,
  }),
};
