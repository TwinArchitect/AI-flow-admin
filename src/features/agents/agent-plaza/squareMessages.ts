import type { AgentOpenChatMessage, ChatContentBlock, MessageBlock } from '@/types';
import type { WorkflowDebugFile } from '@/features/workflows/api/workflowDebugApi';
import { resolveWorkflowFileType } from '@/features/workflows/api/workflowDebugApi';
import { apiMessagesToUiMessages } from '../overview/utils/overviewMessages';
import { parseStringToBlocks } from '../overview/utils/blockHelpers';

export type SquareChatContent =
  | ChatContentBlock
  | { type: 'attachment'; data: { fileId: string; fileName: string } };
export type SquareChatRecord = Omit<AgentOpenChatMessage, 'contents'> & {
  contents?: SquareChatContent[] | null;
};

export function attachmentBlocks(files: WorkflowDebugFile[]): MessageBlock[] {
  return files.map((file) => ({
    type: 'custom',
    kind: 'attachment',
    payload: {
      fileId: file.id,
      fileName: file.name,
      variant: resolveWorkflowFileType(file.name) === 'image' ? 'image' : 'file',
      previewUrl: `/gpt/file/online?id=${encodeURIComponent(file.id)}`,
      downloadUrl: `/gpt/file/download?id=${encodeURIComponent(file.id)}`,
    },
  }));
}

export function saveSquareQuestion(question: string, files: WorkflowDebugFile[]) {
  return (
    question.trim() ||
    (files.length ? `（附件：${files.map((file) => file.name).join('、')}）` : '')
  );
}

export function restoreSquareMessages(records: SquareChatRecord[]) {
  return records.flatMap((record) => {
    const files = (record.contents ?? []).flatMap<WorkflowDebugFile>((content) =>
      content.type === 'attachment' && content.data.fileId
        ? [
            {
              id: String(content.data.fileId),
              name: String(content.data.fileName || content.data.fileId),
            },
          ]
        : []
    );
    const contents = (record.contents ?? []).filter(
      (content): content is ChatContentBlock => content.type !== 'attachment'
    );
    const messages = apiMessagesToUiMessages([{ ...record, contents }]);
    const marker = record.question.lastIndexOf('[[agent-files]]');
    const text = (marker >= 0 ? record.question.slice(0, marker) : record.question).trim();
    const placeholder = saveSquareQuestion('', files);
    messages[0].blocks = [
      ...attachmentBlocks(files),
      ...(text && (!files.length || text !== placeholder) ? parseStringToBlocks(text, 'user') : []),
    ];
    return messages;
  });
}
