import { BrainCircuit } from 'lucide-react';
import { LlmConfigPanel } from '../components/config-panels/LlmConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import {
  DEFAULT_LLM_CONFIG,
  LLM_NODE_OUTPUTS,
  normalizeLlmConfig,
  parseLlmModule,
  serializeLlmNode,
  validateLlmNode,
} from '../contracts/llmNodeContract';
import type { LlmNodeConfig } from '../types';
import { buildErrorCatchHandle, buildSourceHandle } from '../utils/edgeHandles';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function ConfigPanel({ nodeId, config, variables, onUpdate, onRemoveSourceHandle }: NodeConfigPanelProps) {
  return (
    <LlmConfigPanel
      nodeId={nodeId}
      config={config as Record<string, unknown>}
      variables={variables}
      onUpdate={onUpdate as (config: Partial<LlmNodeConfig>) => void}
      onRemoveSourceHandle={onRemoveSourceHandle}
    />
  );
}

export const llmNodeModule: WorkflowNodeModule = {
  type: 'llm',
  backendType: 'chatNode',
  backendRunnable: true,
  definition: {
    type: 'llm',
    name: '大模型',
    description: '调用模型生成、理解或推理文本',
    category: '基础',
    tone: 'bg-primary/10 text-primary border-primary/20',
    iconTone: 'bg-primary text-primary-foreground',
  },
  icon: BrainCircuit,
  createDefaultConfig: () => ({
    ...DEFAULT_LLM_CONFIG,
    model: DEFAULT_LLM_CONFIG.model ? { ...DEFAULT_LLM_CONFIG.model } : null,
    advanced: { ...DEFAULT_LLM_CONFIG.advanced },
  }),
  ConfigPanel,
  ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: () => LLM_NODE_OUTPUTS,
  getReferences: (node) => {
    const config = normalizeLlmConfig(node.data.config);
    return [
      {
        value: config.systemPrompt,
        context: `节点 ${node.data.label} 的系统提示词`,
        acceptedValueTypes: ['string'],
      },
      {
        value: config.userChatInput,
        context: `节点 ${node.data.label} 的用户输入`,
        acceptedValueTypes: ['string'],
      },
      ...config.fileUrlRefs.map((value) => ({
        value,
        context: `节点 ${node.data.label} 的文件输入`,
        acceptedValueTypes: ['file', 'array', 'arrayString'],
      })),
    ];
  },
  serialize: serializeLlmNode,
  parse: parseLlmModule,
  validate: validateLlmNode,
  validateEdges: (node, _incoming, outgoing) => {
    const errors: string[] = [];
    const successHandle = buildSourceHandle(node.id);
    const errorHandle = buildErrorCatchHandle(node.id);
    const catchError = normalizeLlmConfig(node.data.config).catchError;
    if (!outgoing.some((edge) => edge.sourceHandle === successHandle)) {
      errors.push(`节点 ${node.data.label} 必须连接成功分支`);
    }
    if (catchError && !outgoing.some((edge) => edge.sourceHandle === errorHandle)) {
      errors.push(`节点 ${node.data.label} 已开启异常处理，必须连接异常分支`);
    }
    if (!catchError && outgoing.some((edge) => edge.sourceHandle === errorHandle)) {
      errors.push(`节点 ${node.data.label} 未开启异常处理，不能保留异常分支`);
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
    maxOutgoing: normalizeLlmConfig(node.data.config).catchError ? 2 : 1,
  }),
};
