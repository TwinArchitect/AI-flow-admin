/**
 * 聊天消息类型
 */

export type ChatMessageLikes = 0 | 1 | 2;

export interface AgentOpenChatGroup {
  id: string;
  groupName: string;
  messageCount?: number;
  lastQuestion?: string;
  lastChatTime?: string;
  creator?: string;
  tenantId?: string;
  createTime?: string;
}

export interface AgentOpenChatMessage {
  id: string;
  groupId?: string;
  agentId?: string;
  question: string;
  answer: string;
  likes?: ChatMessageLikes;
  messageId?: string;
  tokenCount?: number;
  responseTime?: number;
  createTime?: string;
}

export interface ChatMessageSavePayload {
  groupId: string;
  agentId?: string;
  question: string;
  answer: string;
  responseTime?: number;
  likes?: ChatMessageLikes;
}
