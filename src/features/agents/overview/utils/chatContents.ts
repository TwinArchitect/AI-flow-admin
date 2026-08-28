import type { ChatContentBlock, MessageBlock } from '@/types';
import {
  restoreDurableConversationBlock,
  serializeDurableConversationBlock,
} from '@/features/message-render/richContent';

function contentSignature(content: ChatContentBlock) {
  return `${content.type}:${JSON.stringify(content.data)}`;
}

export function appendPersistedRichBlocks(
  current: ChatContentBlock[],
  blocks: MessageBlock[],
  nodeId?: string,
) {
  const signatures = new Set(current.map(contentSignature));
  const next = [...current];
  blocks.forEach((block) => {
    const content = serializeDurableConversationBlock(block, nodeId);
    if (!content) return;
    const signature = contentSignature(content);
    if (signatures.has(signature)) return;
    signatures.add(signature);
    next.push(content);
  });
  return next;
}

export function restorePersistedRichBlocks(
  blocks: MessageBlock[],
  contents?: ChatContentBlock[] | null,
) {
  if (!contents?.length) return blocks;
  return [
    ...blocks,
    ...contents.flatMap<MessageBlock>((content) => {
      const restored = restoreDurableConversationBlock(content);
      return restored ? [restored] : [];
    }),
  ];
}
