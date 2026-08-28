import { http } from '@/api/client';
import type {
  AgentOpenChatGroup,
  AgentOpenChatMessage,
  ChatMessageLikes,
  ChatMessageSavePayload,
} from '@/types';

const GROUP_BASE = '/gpt/base/chat/group';
const MESSAGE_BASE = '/gpt/base/chat/message';

export function queryChatGroups() {
  return http.get<AgentOpenChatGroup[]>(`${GROUP_BASE}/query`).then((response) => response.data);
}

export function saveChatGroup(groupName: string) {
  return http
    .post<AgentOpenChatGroup>(`${GROUP_BASE}/save`, { groupName })
    .then((response) => response.data);
}

export function deleteChatGroup(id: string) {
  return http.delete<void>(`${GROUP_BASE}/delete/${encodeURIComponent(id)}`);
}

export function queryChatMessages(groupId: string) {
  return http
    .get<AgentOpenChatMessage[]>(`${MESSAGE_BASE}/query/${encodeURIComponent(groupId)}`)
    .then((response) => response.data);
}

export function saveChatMessage(payload: ChatMessageSavePayload) {
  return http
    .post<AgentOpenChatMessage>(`${MESSAGE_BASE}/save`, { ...payload, likes: payload.likes ?? 0 })
    .then((response) => response.data);
}

export function updateChatMessageLikes(messageId: string, likes: ChatMessageLikes) {
  const query = new URLSearchParams({ messageId, likes: String(likes) });
  return http.post<void>(`${MESSAGE_BASE}/update/likes?${query.toString()}`);
}
