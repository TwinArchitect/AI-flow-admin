import { authFetch } from '@/lib/authSession';
import { http } from '@/api/client';
import type {
  AgentOpenModel,
  ModelCategoriesResult,
  ModelDebugPayload,
  ModelDebugResult,
  ModelQuery,
  ModelSavePayload,
} from './types';

type PageResult<T> = { records: T[]; total: number };

export async function getModelCategories() {
  const response = await http.get<ModelCategoriesResult>('/gpt/base/model/categories');
  return response.data;
}

export async function queryModels(params: ModelQuery) {
  const response = await http.post<PageResult<AgentOpenModel>>('/gpt/base/model/query', params);
  return response.data;
}

export async function getModel(id: string) {
  const response = await http.get<AgentOpenModel>(`/gpt/base/model/get/${id}`);
  return response.data;
}

export async function saveModel(payload: ModelSavePayload) {
  const { id: _id, ...body } = payload;
  const response = await http.post('/gpt/base/model/save', body);
  return response.data;
}

export async function updateModel(payload: ModelSavePayload & { id: string }) {
  const response = await http.post('/gpt/base/model/update', payload);
  return response.data;
}

export async function deleteModel(id: string) {
  const response = await http.post(`/gpt/base/model/delete/${id}`);
  return response.data;
}

export async function debugModel(payload: ModelDebugPayload) {
  const response = await http.post<ModelDebugResult>('/gpt/base/model/debug', payload);
  return response.data;
}

function buildDebugBody(payload: ModelDebugPayload) {
  return {
    id: payload.id,
    prompt: payload.prompt,
    text: payload.text,
    query: payload.query,
    documents: payload.documents,
    imageBase64: payload.imageBase64,
    timeoutSeconds: payload.timeoutSeconds ?? 30
  };
}

export type ModelDebugStreamChunk = {
  content?: string;
  reasoningContent?: string;
  /** 模型上游 SSE 的原始 data 载荷，仅 /debug/stream 调试接口返回。 */
  rawData?: string;
};

export type ModelDebugStreamCallbacks = {
  onChunk?: (chunk: ModelDebugStreamChunk) => void;
  onDone?: (result: ModelDebugResult) => void;
  onError?: (message: string) => void;
};

function parseSseEvents(buffer: string): { events: Array<{ event: string; data: string }>; remainder: string } {
  const events: Array<{ event: string; data: string }> = [];
  const blocks = buffer.split(/\r?\n\r?\n/);
  const remainder = blocks.pop() ?? '';

  for (const block of blocks) {
    if (!block.trim()) continue;
    let eventName = 'message';
    const dataLines: string[] = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }
    if (dataLines.length) {
      events.push({ event: eventName, data: dataLines.join('\n') });
    }
  }

  return { events, remainder };
}

function handleModelDebugSseEvent(
  eventName: string,
  data: string,
  callbacks: ModelDebugStreamCallbacks
): ModelDebugResult | null {
  if (!data || data === '[DONE]') return null;

  if (eventName === 'chunk') {
    try {
      const payload = JSON.parse(data) as ModelDebugStreamChunk;
      callbacks.onChunk?.(payload);
    } catch {
      /* ignore malformed chunk */
    }
    return null;
  }

  if (eventName === 'done') {
    const result = JSON.parse(data) as ModelDebugResult;
    callbacks.onDone?.(result);
    return result;
  }

  if (eventName === 'error') {
    let message = '模型调用失败';
    try {
      const payload = JSON.parse(data) as ModelDebugResult;
      message = payload.errorMessage || message;
    } catch {
      message = data.slice(0, 300) || message;
    }
    callbacks.onError?.(message);
    throw new Error(message);
  }

  return null;
}

/** 流式模型调试 — POST /gpt/base/model/debug/stream */
export async function debugModelStream(
  payload: ModelDebugPayload,
  callbacks: ModelDebugStreamCallbacks = {},
  signal?: AbortSignal
): Promise<ModelDebugResult> {
  const res = await authFetch('/gpt/base/model/debug/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(buildDebugBody(payload)),
    signal
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    let message = `HTTP ${res.status}`;
    try {
      const errJson = JSON.parse(errorText) as { message?: string };
      if (errJson.message) message = errJson.message;
    } catch {
      if (errorText.trim()) message = errorText.slice(0, 300);
    }
    callbacks.onError?.(message);
    throw new Error(message);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    const message = '响应体不可读';
    callbacks.onError?.(message);
    throw new Error(message);
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult: ModelDebugResult | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parsed = parseSseEvents(buffer);
      buffer = parsed.remainder;
      for (const evt of parsed.events) {
        const result = handleModelDebugSseEvent(evt.event, evt.data, callbacks);
        if (result) finalResult = result;
      }
    }

    if (buffer.trim()) {
      const parsed = parseSseEvents(`${buffer}\n\n`);
      for (const evt of parsed.events) {
        const result = handleModelDebugSseEvent(evt.event, evt.data, callbacks);
        if (result) finalResult = result;
      }
    }

    if (!finalResult) {
      const message = '未收到模型完成事件';
      callbacks.onError?.(message);
      throw new Error(message);
    }

    if (!finalResult.success) {
      const message = finalResult.errorMessage || '模型调用失败';
      callbacks.onError?.(message);
      throw new Error(message);
    }

    return finalResult;
  } catch (err) {
    if (signal?.aborted) throw err;
    const message = err instanceof Error ? err.message : 'SSE 连接异常';
    if (!(err instanceof Error && err.message === message)) {
      callbacks.onError?.(message);
    }
    throw err instanceof Error ? err : new Error(message);
  }
}
