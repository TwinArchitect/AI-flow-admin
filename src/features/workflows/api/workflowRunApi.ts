import { useAuthStore } from '@/stores/auth';
import type {
  WorkflowFinishedSsePayload,
  WorkflowNodeSsePayload,
  WorkflowRunResult,
} from '../types/execution';

export interface WorkflowRunRequest {
  appId: string;
  chatId?: string;
  chatGroupId?: string;
  message: Array<{ role: string; content: string }>;
  variables?: Record<string, unknown>;
  files?: Array<{
    type: 'image' | 'document' | 'video';
    fileId: string;
    content: null;
  }>;
  debug?: boolean;
}

export interface RunWorkflowStreamRequest {
  request: WorkflowRunRequest;
  onNodeEvent: (eventName: string, payload: WorkflowNodeSsePayload) => void;
  onWorkflowFinished?: (payload: WorkflowFinishedSsePayload) => void;
  onMessageDelta?: (text: string) => void;
  onReasoningDelta?: (text: string) => void;
  signal?: AbortSignal;
}

export async function runWorkflowStream({
  request,
  onNodeEvent,
  onWorkflowFinished,
  onMessageDelta,
  onReasoningDelta,
  signal,
}: RunWorkflowStreamRequest): Promise<WorkflowRunResult> {
  const { token, tenantId, clear } = useAuthStore.getState();
  const headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  });

  if (token) {
    headers.set('token', token);
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (tenantId) headers.set('tenant_id', tenantId);

  const response = await fetch('/gpt/base/workflows/run', {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    if (response.status === 401) clear();
    const message = await response.text().catch(() => '');
    throw new Error(message || `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('响应体不可读');

  const decoder = new TextDecoder();
  const nodeOutputs: Record<string, Record<string, unknown>> = {};
  let buffer = '';
  let answerText = '';
  let reasoningText = '';
  let fatalNodeError = '';
  let finishedPayload: WorkflowFinishedSsePayload | undefined;

  function handleEvent(eventName: string, data: string) {
    if (!data || data === '[DONE]') return;

    if (eventName === 'message') {
      try {
        const message = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string; reasoning_content?: string } }>;
        };
        const delta = message.choices?.[0]?.delta?.content ?? '';
        const reasoningDelta = message.choices?.[0]?.delta?.reasoning_content ?? '';
        answerText += delta;
        reasoningText += reasoningDelta;
        if (delta) onMessageDelta?.(delta);
        if (reasoningDelta) onReasoningDelta?.(reasoningDelta);
      } catch {
        // 非 JSON message 不属于当前后端契约，忽略而不猜测其含义。
      }
      return;
    }

    try {
      const payload = JSON.parse(data) as unknown;
      if (eventName === 'workflow_finished') {
        const finished = payload as WorkflowFinishedSsePayload;
        if (finished?.event === 'workflow_finished' && finished.data?.status) {
          finishedPayload = finished;
          onWorkflowFinished?.(finished);
        }
        return;
      }
      if (!payload || typeof payload !== 'object') return;
      const nodePayload = payload as Partial<WorkflowNodeSsePayload>;
      if (
        typeof nodePayload.nodeId !== 'string'
        || typeof nodePayload.flowNodeType !== 'string'
        || typeof nodePayload.statusCode !== 'number'
      ) {
        return;
      }
      const strictPayload = nodePayload as WorkflowNodeSsePayload;
      onNodeEvent(eventName, strictPayload);
      const outputs = strictPayload.outputs
        ?? (strictPayload.flowNodeResponse && typeof strictPayload.flowNodeResponse === 'object'
          ? strictPayload.flowNodeResponse as Record<string, unknown>
          : undefined);
      if (outputs) nodeOutputs[strictPayload.nodeId] = outputs;
      if (strictPayload.statusCode === 503) {
        fatalNodeError = strictPayload.log || `${strictPayload.flowNodeType} 执行失败`;
      }
    } catch {
      // 无法解析的事件不参与运行状态判断。
    }
  }

  function flushEvents(force = false) {
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = force ? '' : (blocks.pop() ?? '');

    blocks.forEach((block) => {
      if (!block.trim()) return;
      let eventName = 'message';
      const dataLines: string[] = [];
      block.split(/\r?\n/).forEach((line) => {
        if (line.startsWith('event:')) eventName = line.slice(6).trim();
        if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
      });
      handleEvent(eventName, dataLines.join('\n'));
    });
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    flushEvents();
  }

  if (buffer.trim()) {
    buffer += '\n\n';
    flushEvents(true);
  }

  if (fatalNodeError) {
    throw new Error(fatalNodeError);
  }
  if (!finishedPayload) {
    throw new Error('工作流连接已结束，但未收到 workflow_finished 终态事件');
  }
  if (finishedPayload.data.status !== 'succeeded') {
    throw new Error(finishedPayload.data.error || '工作流执行失败');
  }

  return {
    outputs: finishedPayload.data.outputs ?? {},
    nodeOutputs,
    answerText,
    reasoningText,
    workflowRunId: finishedPayload.workflow_run_id ?? finishedPayload.data.id,
  };
}
