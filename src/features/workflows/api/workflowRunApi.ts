import type {
  WorkflowBackendPayload,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
} from '../types';
import type { WorkflowRunEvent, WorkflowRunResult } from '../utils/workflowExecution';

export interface WorkflowRunRequest {
  appId: string;
  chatId?: string;
  chatGroupId?: string;
  message: Array<{ role: string; content: string }>;
  variables?: Record<string, unknown>;
  debug?: boolean;
}

export interface RunWorkflowStreamRequest {
  request: WorkflowRunRequest;
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
  payload: WorkflowBackendPayload;
  onNodeEvent: (event: WorkflowRunEvent) => void;
}

export async function runWorkflowStream({
  request,
  onNodeEvent,
}: RunWorkflowStreamRequest): Promise<WorkflowRunResult> {
  const raw = localStorage.getItem('auth-storage');
  const state = raw ? JSON.parse(raw).state : {};
  const headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  });

  if (state?.token) {
    headers.set('token', state.token);
    headers.set('Authorization', `Bearer ${state.token}`);
  }
  if (state?.tenantId) headers.set('tenant_id', state.tenantId);

  const response = await fetch('/gpt/base/workflows/run', {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('响应体不可读');

  const decoder = new TextDecoder();
  const nodeOutputs: Record<string, Record<string, unknown>> = {};
  let buffer = '';
  let answerText = '';
  let executionError = '';

  function handleEvent(eventName: string, data: string) {
    if (!data || data === '[DONE]') return;

    if (eventName === 'message') {
      try {
        const message = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        answerText += message.choices?.[0]?.delta?.content ?? '';
      } catch {
        answerText += data;
      }
      return;
    }

    try {
      const payload = JSON.parse(data) as {
        nodeId?: string;
        status?: WorkflowRunEvent['status'];
        statusCode?: number;
        message?: string;
        log?: string;
        outputs?: Record<string, unknown>;
      };
      if (payload.nodeId) {
        const status = payload.status
          ?? (payload.statusCode && payload.statusCode >= 400 ? 'error' : 'success');
        const eventMessage = payload.message ?? payload.log ?? eventName;
        if (status === 'error' || eventName.toLowerCase().includes('error')) {
          executionError = eventMessage;
        }
        onNodeEvent({ nodeId: payload.nodeId, status, message: eventMessage });
        nodeOutputs[payload.nodeId] = payload.outputs ?? payload;
      }
    } catch {
      // ignore non-json debug events
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

  if (executionError) {
    throw new Error(executionError);
  }

  return {
    outputs: { answer: answerText },
    nodeOutputs,
  };
}
