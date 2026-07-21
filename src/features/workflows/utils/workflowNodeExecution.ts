import type {
  NodeExecutionState,
  WorkflowExecutionOutcome,
  WorkflowNodeSsePayload,
  WorkflowNodeExecutionStates,
} from '../types/execution';

export function createEmptyNodeExecutionState(): NodeExecutionState {
  return {
    status: 'idle',
    executionLogs: [],
  };
}

const SENSITIVE_FIELD_NAMES = new Set([
  'authorization',
  'apikey',
  'authtoken',
  'accesstoken',
  'refreshtoken',
  'bearertoken',
  'clientsecret',
  'secret',
  'password',
  'passwd',
  'cookie',
  'setcookie',
]);

function isSensitiveFieldName(key: string): boolean {
  return SENSITIVE_FIELD_NAMES.has(key.replace(/[^a-z0-9]/gi, '').toLowerCase());
}

function redactSensitiveDebugValue(value: unknown, key?: string): unknown {
  if (key && isSensitiveFieldName(key)) return '***';
  if (typeof value === 'string') {
    return /^Bearer\s+\S+/i.test(value) ? 'Bearer ***' : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveDebugValue(item));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [
        childKey,
        redactSensitiveDebugValue(childValue, childKey),
      ]),
    );
  }
  return value;
}

function redactDebugRecord(value: Record<string, unknown>): Record<string, unknown> {
  return redactSensitiveDebugValue(value) as Record<string, unknown>;
}

function parseRecordField(value: unknown): Record<string, unknown> | undefined {
  if (value == null) return undefined;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return redactDebugRecord(value as Record<string, unknown>);
  }
  if (typeof value !== 'string' || !value.trim()) return undefined;

  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? redactDebugRecord(parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return redactDebugRecord({ value: value.trim() });
  }
}

export function applyWorkflowNodeSseEvent(
  states: WorkflowNodeExecutionStates,
  eventName: string,
  payload: WorkflowNodeSsePayload,
): WorkflowNodeExecutionStates {
  const nodeId = payload.nodeId;
  const current = states[nodeId] ?? createEmptyNodeExecutionState();
  const inputs = parseRecordField(payload.inputs);
  const outputs = parseRecordField(payload.outputs ?? payload.flowNodeResponse);
  const durationMs = typeof payload.ts === 'number' ? payload.ts : current.durationMs;
  const logLine = payload.log?.trim();
  const succeeded = payload.statusCode === 200;

  return {
    ...states,
    [nodeId]: {
      ...current,
      status: succeeded ? 'success' : 'error',
      durationMs,
      summaryLog: logLine ?? current.summaryLog,
      executionLogs: logLine
        ? [...(current.executionLogs ?? []), logLine]
        : current.executionLogs,
      statusCode: payload.statusCode,
      flowNodeType: payload.flowNodeType || eventName,
      debugInputs: inputs ?? current.debugInputs,
      debugOutputs: outputs ?? current.debugOutputs,
      debugError: succeeded ? null : logLine ?? current.debugError,
    },
  };
}

export function markNodesRunning(
  states: WorkflowNodeExecutionStates,
  nodeIds: string[],
): WorkflowNodeExecutionStates {
  if (nodeIds.length === 0) return states;
  const next = { ...states };

  nodeIds.forEach((nodeId) => {
    const current = next[nodeId] ?? createEmptyNodeExecutionState();
    if (current.status === 'success' || current.status === 'error') return;
    next[nodeId] = { ...current, status: 'running' };
  });

  return next;
}

export function settleWorkflowNodeStates(
  states: WorkflowNodeExecutionStates,
  nodeIds: string[],
  outcome: WorkflowExecutionOutcome,
  message?: string,
): WorkflowNodeExecutionStates {
  const next = { ...states };

  nodeIds.forEach((nodeId) => {
    const current = next[nodeId] ?? createEmptyNodeExecutionState();
    if (current.status === 'success' || current.status === 'error') return;

    if (current.status === 'running') {
      if (outcome === 'cancelled') {
        next[nodeId] = {
          ...current,
          status: 'cancelled',
          summaryLog: message || '运行已中断',
        };
        return;
      }

      if (outcome === 'error') {
        const errorMessage = message || '工作流执行失败';
        next[nodeId] = {
          ...current,
          status: 'error',
          summaryLog: errorMessage,
          debugError: errorMessage,
        };
        return;
      }
    }

    next[nodeId] = {
      ...current,
      status: 'skipped',
      summaryLog: outcome === 'success'
        ? current.status === 'running'
          ? '工作流已完成，但未收到该节点的完成事件'
          : '本次运行未经过该节点'
        : '上游未完成，未执行',
    };
  });

  return next;
}
