import { LLM_NODE_OUTPUTS, START_NODE_OUTPUTS } from '../config/workflowProtocol';
import type { EndNodeConfig, LlmNodeConfig, WorkflowCanvasEdge, WorkflowCanvasNode } from '../types';
import { parseVariableRefs } from './variableRefs';

const SUPPORTED_NODE_TYPES = new Set(['start', 'llm', 'end']);

function hasCycle(edges: WorkflowCanvasEdge[]) {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const adjacency = new Map<string, string[]>();

  edges.forEach((edge) => {
    const next = adjacency.get(edge.source) ?? [];
    next.push(edge.target);
    adjacency.set(edge.source, next);
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

function buildOutputMap(nodes: WorkflowCanvasNode[]) {
  const outputs = new Map<string, Set<string>>();

  nodes.forEach((node) => {
    if (node.data.nodeType === 'start') {
      outputs.set(node.id, new Set(START_NODE_OUTPUTS.map((output) => output.key)));
    }
    if (node.data.nodeType === 'llm') {
      outputs.set(node.id, new Set(LLM_NODE_OUTPUTS.map((output) => output.key)));
    }
    if (node.data.nodeType === 'end') {
      const config = node.data.config as EndNodeConfig;
      outputs.set(node.id, new Set((config.outputVariables ?? []).map((output) => output.key)));
    }
  });

  return outputs;
}

function validateReference(
  value: string,
  context: string,
  outputs: Map<string, Set<string>>,
  errors: string[],
) {
  parseVariableRefs(value).forEach((ref) => {
    const nodeOutputs = outputs.get(ref.nodeId);
    if (!nodeOutputs) {
      errors.push(`${context} 引用了不存在的节点 ${ref.nodeId}`);
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

  const outputs = buildOutputMap(nodes);
  nodes.forEach((node) => {
    if (node.data.nodeType === 'llm') {
      const config = node.data.config as LlmNodeConfig;
      validateReference(config.userChatInput ?? '', `节点 ${node.data.label} 的用户输入`, outputs, errors);
    }

    if (node.data.nodeType === 'end') {
      const config = node.data.config as EndNodeConfig;
      (config.outputVariables ?? []).forEach((variable) => {
        validateReference(variable.value, `结束节点输出 ${variable.key}`, outputs, errors);
      });
    }
  });

  return errors;
}
