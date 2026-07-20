import {
  resolveEndNodeOutputs,
  validateEndNode,
} from '../contracts/endNodeContract';
import { LLM_NODE_OUTPUTS, validateLlmNode } from '../contracts/llmNodeContract';
import { START_NODE_OUTPUTS, validateStartNode } from '../contracts/startNodeContract';
import type { LlmNodeConfig, WorkflowCanvasEdge, WorkflowCanvasNode } from '../types';
import { parseVariableRefs } from './variableRefs';

const SUPPORTED_NODE_TYPES = new Set(['start', 'llm', 'end']);

function hasCycle(edges: WorkflowCanvasEdge[]) {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const adjacency = new Map<string, string[]>();

  edges.forEach((edge) => {
    adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
  });

  function visit(nodeId: string): boolean {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visiting.add(nodeId);
    for (const next of adjacency.get(nodeId) ?? []) {
      if (visit(next)) return true;
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  }

  return [...adjacency.keys()].some((nodeId) => visit(nodeId));
}

function getUpstreamNodeIds(nodeId: string, edges: WorkflowCanvasEdge[]) {
  const incoming = new Map<string, string[]>();
  edges.forEach((edge) => {
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge.source]);
  });

  const upstream = new Set<string>();
  const queue = [...(incoming.get(nodeId) ?? [])];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || upstream.has(current)) continue;
    upstream.add(current);
    queue.push(...(incoming.get(current) ?? []));
  }
  return upstream;
}

function buildOutputMap(nodes: WorkflowCanvasNode[]) {
  return new Map(
    nodes.map((node) => {
      if (node.data.nodeType === 'start') {
        return [node.id, new Set(START_NODE_OUTPUTS.map((output) => output.key))] as const;
      }
      if (node.data.nodeType === 'llm') {
        return [node.id, new Set(LLM_NODE_OUTPUTS.map((output) => output.key))] as const;
      }
      return [node.id, new Set(resolveEndNodeOutputs(node).map((output) => output.key))] as const;
    }),
  );
}

function validateReference(
  value: string,
  context: string,
  outputs: Map<string, Set<string>>,
  upstreamNodeIds: Set<string>,
  errors: string[],
) {
  parseVariableRefs(value).forEach((ref) => {
    const nodeOutputs = outputs.get(ref.nodeId);
    if (!nodeOutputs) {
      errors.push(`${context} 引用了不存在的节点 ${ref.nodeId}`);
      return;
    }
    if (!upstreamNodeIds.has(ref.nodeId)) {
      errors.push(`${context} 只能引用当前节点的上游输出 ${ref.raw}`);
      return;
    }
    if (!nodeOutputs.has(ref.outputKey)) {
      errors.push(`${context} 引用了不存在的输出 ${ref.raw}`);
    }
  });
}

export function validateWorkflowForBackend(
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
) {
  const errors: string[] = [];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  if (nodeMap.size !== nodes.length) errors.push('节点 ID 不能重复');

  const unsupportedNodes = nodes.filter((node) => !SUPPORTED_NODE_TYPES.has(node.data.nodeType));
  if (unsupportedNodes.length > 0) {
    errors.push(`当前真实运行仅支持开始、LLM、结束节点：${unsupportedNodes.map((node) => node.data.label).join('、')}`);
  }

  const starts = nodes.filter((node) => node.data.nodeType === 'start');
  const llms = nodes.filter((node) => node.data.nodeType === 'llm');
  const ends = nodes.filter((node) => node.data.nodeType === 'end');
  if (starts.length !== 1) errors.push('工作流必须有且仅有一个开始节点');
  if (llms.length < 1) errors.push('工作流至少需要一个 LLM 节点');
  if (ends.length !== 1) errors.push('工作流必须有且仅有一个结束节点');

  edges.forEach((edge) => {
    if (!nodeMap.has(edge.source)) errors.push(`连线 ${edge.id} 的源节点不存在`);
    if (!nodeMap.has(edge.target)) errors.push(`连线 ${edge.id} 的目标节点不存在`);
  });
  if (hasCycle(edges)) errors.push('工作流存在环路，请检查连线');

  nodes.forEach((node) => {
    const incoming = edges.filter((edge) => edge.target === node.id);
    const outgoing = edges.filter((edge) => edge.source === node.id);
    if (node.data.nodeType === 'start') {
      errors.push(...validateStartNode(node));
      if (incoming.length > 0) errors.push('开始节点不能有输入连线');
      if (outgoing.length === 0) errors.push('开始节点必须连接下游节点');
    }
    if (node.data.nodeType === 'llm') {
      errors.push(...validateLlmNode(node));
      if (incoming.length === 0) errors.push(`节点 ${node.data.label} 必须连接上游节点`);
      if (outgoing.length === 0) errors.push(`节点 ${node.data.label} 必须连接下游节点`);
    }
    if (node.data.nodeType === 'end') {
      errors.push(...validateEndNode(node));
      if (incoming.length === 0) errors.push('结束节点必须连接上游节点');
      if (outgoing.length > 0) errors.push('结束节点不能有输出连线');
    }
  });

  const outputs = buildOutputMap(nodes);
  nodes.forEach((node) => {
    const upstream = getUpstreamNodeIds(node.id, edges);
    if (node.data.nodeType === 'llm') {
      const config = node.data.config as LlmNodeConfig;
      validateReference(
        config.userChatInput ?? '',
        `节点 ${node.data.label} 的用户输入`,
        outputs,
        upstream,
        errors,
      );
    }
    if (node.data.nodeType === 'end') {
      resolveEndNodeOutputs(node).forEach((output) => {
        const config = node.data.config as { outputVariables?: Array<{ key: string; value: string }> };
        const value = config.outputVariables?.find((variable) => variable.key.trim() === output.key)?.value ?? '';
        validateReference(value, `结束节点输出 ${output.key}`, outputs, upstream, errors);
      });
    }
  });

  return errors;
}
