import type { MessageBlock } from '@/types';
import type { WorkflowRunResult } from '@/features/workflows/types/execution';
import { parseConversationText, removeRedundantStructuredConversationText, resolveConversationReply } from '@/features/message-render/conversationBlocks';
import { appendUniqueMessageBlocks, removeTransientConversationBlocks, resolveConversationResultRichBlocks } from '@/features/message-render/richContent';

const EMPTY_REPLY = '**本轮未生成可展示内容。** 请检查模型输出或工具配置后重试。';

/** 四个对话入口共用的流结束收口：合并结构化结果、去重，并补齐无正文的回复。 */
export function finalizeConversationRun(streamedBlocks: MessageBlock[], result: WorkflowRunResult): MessageBlock[] {
  const merged = removeRedundantStructuredConversationText(
    appendUniqueMessageBlocks(streamedBlocks, resolveConversationResultRichBlocks(result)),
  );
  if (removeTransientConversationBlocks(merged).length) return merged;
  const reply = resolveConversationReply(result).trim();
  return appendUniqueMessageBlocks(merged, parseConversationText(reply && reply !== '（未收到回复内容）' ? reply : EMPTY_REPLY, 'assistant'));
}
