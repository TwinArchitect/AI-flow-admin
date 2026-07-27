import { MessageSquare } from 'lucide-react';
import { ReplyConfigPanel } from '../components/config-panels/ReplyConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import {
  DEFAULT_REPLY_CONFIG,
  normalizeReplyConfig,
  parseReplyModule,
  serializeReplyNode,
  validateReplyNode,
} from '../contracts/replyNodeContract';
import type { ReplyNodeConfig } from '../types';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function ConfigPanel({ config, variables, onUpdate }: NodeConfigPanelProps) {
  return (
    <ReplyConfigPanel
      config={config as Record<string, unknown>}
      variables={variables}
      onUpdate={onUpdate as (config: Partial<ReplyNodeConfig>) => void}
    />
  );
}

export const replyNodeModule: WorkflowNodeModule = {
  type: 'reply',
  backendType: 'answerNode',
  backendRunnable: true,
  definition: {
    type: 'reply',
    name: '指定回复',
    description: '输出固定文本或变量内容',
    category: '基础',
    tone: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    iconTone: 'bg-emerald-500 text-white',
  },
  icon: MessageSquare,
  createDefaultConfig: () => ({ ...DEFAULT_REPLY_CONFIG }),
  ConfigPanel,
  ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: () => [],
  getReferences: (node) => [{
    value: normalizeReplyConfig(node.data.config).content,
    context: `节点 ${node.data.label} 的回复内容`,
  }],
  serialize: serializeReplyNode,
  parse: parseReplyModule,
  validate: validateReplyNode,
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
