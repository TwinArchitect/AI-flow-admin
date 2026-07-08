import type {
  EndNodeConfig,
  LlmNodeConfig,
  StartNodeConfig,
  WorkflowBackendPayload,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
} from '../types';
import { parseVariableRef } from './variableRefs';

export interface WorkflowRunEvent {
  nodeId: string;
  status: 'running' | 'success' | 'error';
  message?: string;
}

export interface WorkflowRunResult {
  outputs: Record<string, unknown>;
  nodeOutputs: Record<string, Record<string, unknown>>;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function topoSort(nodes: WorkflowCanvasNode[], edges: WorkflowCanvasEdge[]) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  const adjacency = new Map<string, string[]>();

  edges.forEach((edge) => {
    adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  });

  const queue = nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0);
  const ordered: WorkflowCanvasNode[] = [];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) continue;
    ordered.push(node);

    (adjacency.get(node.id) ?? []).forEach((nextId) => {
      const nextDegree = (indegree.get(nextId) ?? 0) - 1;
      indegree.set(nextId, nextDegree);
      if (nextDegree === 0) {
        const nextNode = nodeMap.get(nextId);
        if (nextNode) queue.push(nextNode);
      }
    });
  }

  return ordered;
}

function resolveReference(value: string, nodeOutputs: Record<string, Record<string, unknown>>) {
  const ref = parseVariableRef(value);
  if (!ref) return value;
  return nodeOutputs[ref.nodeId]?.[ref.outputKey] ?? '';
}

function runStartNode(node: WorkflowCanvasNode) {
  const config = node.data.config as StartNodeConfig;
  const inputKey = config.variables[0]?.key || 'userChatInput';

  return {
    [inputKey]: config.sampleInput,
    userChatInput: config.sampleInput,
  };
}

function runLlmNode(node: WorkflowCanvasNode, nodeOutputs: Record<string, Record<string, unknown>>) {
  const config = node.data.config as LlmNodeConfig;
  const input = String(resolveReference(config.userChatInput, nodeOutputs));
  const model = config.model?.model || '未选择模型';

  return {
    answerText: `[Mock ${model}] ${input || '已完成处理'}`,
    history: [
      { obj: 'Human', value: input },
      { obj: 'AI', value: `[Mock ${model}] ${input || '已完成处理'}` },
    ],
    reasoningText: config.advanced.aiChatReasoning ? 'Mock reasoning enabled.' : '',
  };
}

function runEndNode(node: WorkflowCanvasNode, nodeOutputs: Record<string, Record<string, unknown>>) {
  const config = node.data.config as EndNodeConfig;

  return Object.fromEntries(
    (config.outputVariables ?? [])
      .filter((variable) => variable.key.trim())
      .map((variable) => [variable.key.trim(), resolveReference(variable.value, nodeOutputs)]),
  );
}

export async function executeWorkflowMock(
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
  _payload: WorkflowBackendPayload,
  onEvent: (event: WorkflowRunEvent) => void,
): Promise<WorkflowRunResult> {
  const ordered = topoSort(nodes, edges);
  const nodeOutputs: Record<string, Record<string, unknown>> = {};
  let finalOutputs: Record<string, unknown> = {};

  for (const node of ordered) {
    onEvent({ nodeId: node.id, status: 'running', message: '执行中' });
    await delay(360);

    try {
      if (node.data.nodeType === 'start') {
        nodeOutputs[node.id] = runStartNode(node);
      } else if (node.data.nodeType === 'llm') {
        nodeOutputs[node.id] = runLlmNode(node, nodeOutputs);
      } else if (node.data.nodeType === 'end') {
        nodeOutputs[node.id] = runEndNode(node, nodeOutputs);
        finalOutputs = nodeOutputs[node.id];
      }

      onEvent({ nodeId: node.id, status: 'success', message: '完成' });
    } catch (error) {
      onEvent({
        nodeId: node.id,
        status: 'error',
        message: error instanceof Error ? error.message : '执行失败',
      });
      throw error;
    }
  }

  return {
    outputs: finalOutputs,
    nodeOutputs,
  };
}
