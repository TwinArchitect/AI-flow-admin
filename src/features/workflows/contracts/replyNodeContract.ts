import type {
  ReplyNodeConfig,
  WorkflowCanvasNode,
  WorkflowModule,
} from '../types';
import { createCanvasNode, parseStringInput } from './shared';

export const REPLY_CONTENT_MAX_LENGTH = 100000;

export const DEFAULT_REPLY_CONFIG: ReplyNodeConfig = {
  content: '',
};

export function normalizeReplyConfig(config: unknown): ReplyNodeConfig {
  const raw = (config ?? {}) as Partial<ReplyNodeConfig>;
  return {
    content: typeof raw.content === 'string' ? raw.content : '',
  };
}

export function serializeReplyNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeReplyConfig(node.data.config);
  return {
    flowNodeType: 'answerNode',
    avatar: 'core/workflow/template/reply',
    name: node.data.label,
    intro: node.data.description,
    version: '4.9.7',
    nodeId: node.id,
    position: node.position,
    inputs: [
      {
        key: 'text',
        label: '回复的内容',
        valueType: 'any',
        required: true,
        renderTypeList: ['textarea', 'reference'],
        value: config.content,
        isRichText: false,
        maxLength: REPLY_CONTENT_MAX_LENGTH,
        description: '向用户发送指定回复，支持引用上游变量',
        placeholder: '输入指定回复内容',
      },
    ],
    outputs: [],
  };
}

export function parseReplyModule(module: WorkflowModule) {
  return createCanvasNode('reply', module, {
    content: parseStringInput(module.inputs ?? [], 'text'),
  });
}

export function validateReplyNode(node: WorkflowCanvasNode) {
  const { content } = normalizeReplyConfig(node.data.config);
  const errors: string[] = [];
  if (!content.trim()) errors.push(`节点 ${node.data.label} 的回复内容不能为空`);
  if (content.length > REPLY_CONTENT_MAX_LENGTH) {
    errors.push(`节点 ${node.data.label} 的回复内容不能超过 ${REPLY_CONTENT_MAX_LENGTH} 个字符`);
  }
  return errors;
}
