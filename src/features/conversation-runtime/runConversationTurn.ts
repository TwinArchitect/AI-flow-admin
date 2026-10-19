import type { ContentDelta, MessageBlock } from '@/types';
import type { WorkflowFinishedSsePayload, WorkflowNodeSsePayload, WorkflowRunResult } from '@/features/workflows/types/execution';
import { runWorkflowStream, type WorkflowRunRequest } from '@/features/workflows/api/workflowRunApi';
import { applyConversationDelta } from '@/features/message-render/conversationBlocks';
import { upsertDebugTrace, type PreviewDebugTrace } from './ExecutionTraceMonitor';
import { finalizeConversationRun } from './finalizeConversationRun';

export interface ConversationTurnOptions {
  request: WorkflowRunRequest;
  signal?: AbortSignal;
  onBlocks?: (blocks: MessageBlock[], delta?: ContentDelta) => void;
  onTraces?: (traces: PreviewDebugTrace[]) => void;
  onNodeEvent?: (eventName: string, payload: WorkflowNodeSsePayload) => void;
  onWorkflowFinished?: (payload: WorkflowFinishedSsePayload) => void;
}

export interface ConversationTurnResult {
  blocks: MessageBlock[];
  traces: PreviewDebugTrace[];
  result: WorkflowRunResult;
}

/** 正式助手、两种调试与弹窗助手共用同一套增量、监控和收尾规则。 */
export async function runConversationTurn(options: ConversationTurnOptions): Promise<ConversationTurnResult> {
  let blocks: MessageBlock[] = [];
  let traces: PreviewDebugTrace[] = [];
  const result = await runWorkflowStream({
    request: options.request,
    signal: options.signal,
    onNodeEvent: (name, payload) => options.onNodeEvent?.(name, payload),
    onWorkflowFinished: (payload) => options.onWorkflowFinished?.(payload),
    onContentDelta: (delta) => {
      blocks = applyConversationDelta(blocks, delta);
      options.onBlocks?.(blocks, delta);
    },
    onDebugEvent: (name, payload) => {
      const next = upsertDebugTrace(traces, name, payload);
      if (next === traces) return;
      traces = next;
      options.onTraces?.(traces);
    },
  });
  blocks = finalizeConversationRun(blocks, result);
  options.onBlocks?.(blocks);
  return { blocks, traces, result };
}
