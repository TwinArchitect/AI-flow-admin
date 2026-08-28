/**
 * 消息块渲染辅助函数（简化版 message-render）
 * 完整版 message-render 包含 SSE 解析、注册渲染器等，当前只保留静态渲染需求。
 */

export {
  applyConversationDelta as applyContentDelta,
  conversationBlocksToPlainText as blocksToPlainText,
  parseConversationText as parseStringToBlocks,
} from '@/features/message-render/conversationBlocks';
