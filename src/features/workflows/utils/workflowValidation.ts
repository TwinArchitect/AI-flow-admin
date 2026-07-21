import { getNodeConnectionRules, getNodeModule } from '../nodes/registry';
import type { WorkflowCanvasEdge, WorkflowCanvasNode } from '../types';
import { parseVariableRefs } from './variableRefs';
import {
  normalizeStartConfig,
  VARIABLE_NODE_ID,
} from '../contracts/startNodeContract';

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

function getReachableNodeIds(startId: string, edges: WorkflowCanvasEdge[], reverse = false) {
  const adjacency = new Map<string, string[]>();
  edges.forEach((edge) => {
    const from = reverse ? edge.target : edge.source;
    const to = reverse ? edge.source : edge.target;
    adjacency.set(from, [...(adjacency.get(from) ?? []), to]);
  });
  const reachable = new Set<string>();
  const queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || reachable.has(current)) continue;
    reachable.add(current);
    queue.push(...(adjacency.get(current) ?? []));
  }
  return reachable;
}

function buildOutputMap(nodes: WorkflowCanvasNode[]) {
  const outputs = new Map(
    nodes.map((node) => [
      node.id,
      new Map(
        getNodeModule(node.data.nodeType).getOutputs(node)
          .map((output) => [output.key, output.valueType] as const),
      ),
    ]),
  );
  const startNode = nodes.find((node) => node.data.nodeType === 'start');
  if (startNode) {
    outputs.set(
      VARIABLE_NODE_ID,
      new Map(
        normalizeStartConfig(startNode.data.config).variables
          .filter((variable) => variable.key.trim())
          .map((variable) => [variable.key.trim(), variable.valueType] as const),
      ),
    );
  }
  return outputs;
}

function validateReference(
  value: string,
  context: string,
  outputs: ReturnType<typeof buildOutputMap>,
  upstreamNodeIds: Set<string>,
  errors: string[],
  acceptedValueTypes?: string[],
) {
  parseVariableRefs(value).forEach((ref) => {
    const nodeOutputs = outputs.get(ref.nodeId);
    if (!nodeOutputs) {
      errors.push(`${context} 引用了不存在的节点 ${ref.nodeId}`);
      return;
    }
    if (ref.nodeId !== VARIABLE_NODE_ID && !upstreamNodeIds.has(ref.nodeId)) {
      errors.push(`${context} 只能引用当前节点的上游输出 ${ref.raw}`);
      return;
    }
    const outputType = nodeOutputs.get(ref.outputKey);
    if (!outputType) {
      errors.push(`${context} 引用了不存在的输出 ${ref.raw}`);
      return;
    }
    if (acceptedValueTypes?.length && !acceptedValueTypes.includes(outputType)) {
      errors.push(`${context} 需要 ${acceptedValueTypes.join('/')} 类型，不能引用 ${outputType} 输出 ${ref.raw}`);
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
  if (new Set(edges.map((edge) => edge.id)).size !== edges.length) {
    errors.push('连线 ID 不能重复');
  }

  const unsupportedNodes = nodes.filter(
    (node) => !getNodeModule(node.data.nodeType).backendRunnable,
  );
  if (unsupportedNodes.length > 0) {
    errors.push(`当前真实运行暂不支持这些节点：${unsupportedNodes.map((node) => node.data.label).join('、')}`);
  }

  const starts = nodes.filter((node) => node.data.nodeType === 'start');
  const ends = nodes.filter((node) => node.data.nodeType === 'end');
  if (starts.length !== 1) errors.push('工作流必须有且仅有一个开始节点');
  if (ends.length !== 1) errors.push('工作流必须有且仅有一个结束节点');

  edges.forEach((edge) => {
    if (!nodeMap.has(edge.source)) errors.push(`连线 ${edge.id} 的源节点不存在`);
    if (!nodeMap.has(edge.target)) errors.push(`连线 ${edge.id} 的目标节点不存在`);
    if (edge.source === edge.target) errors.push(`节点不能连接自身：${edge.id}`);
  });
  if (hasCycle(edges)) errors.push('工作流存在环路，请检查连线');

  if (starts.length === 1 && ends.length === 1) {
    const reachableFromStart = getReachableNodeIds(starts[0].id, edges);
    const canReachEnd = getReachableNodeIds(ends[0].id, edges, true);
    if (!reachableFromStart.has(ends[0].id)) {
      errors.push('开始节点与结束节点之间不存在可执行路径');
    }
    nodes.forEach((node) => {
      if (!reachableFromStart.has(node.id)) {
        errors.push(`节点 ${node.data.label} 无法从开始节点到达`);
      } else if (!canReachEnd.has(node.id)) {
        errors.push(`节点 ${node.data.label} 无法到达结束节点`);
      }
    });
  }

  nodes.forEach((node) => {
    const module = getNodeModule(node.data.nodeType);
    const rules = getNodeConnectionRules(node);
    const incoming = edges.filter((edge) => edge.target === node.id);
    const outgoing = edges.filter((edge) => edge.source === node.id);
    errors.push(...module.validate(node));
    errors.push(...(module.validateEdges?.(node, incoming, outgoing) ?? []));

    if (!rules.allowIncoming && incoming.length > 0) {
      errors.push(`节点 ${node.data.label} 不能有输入连线`);
    }
    if (!rules.allowOutgoing && outgoing.length > 0) {
      errors.push(`节点 ${node.data.label} 不能有输出连线`);
    }
    if (rules.requireIncoming && incoming.length === 0) {
      errors.push(`节点 ${node.data.label} 必须连接上游节点`);
    }
    if (rules.requireOutgoing && outgoing.length === 0) {
      errors.push(`节点 ${node.data.label} 必须连接下游节点`);
    }
    if (rules.maxIncoming != null && incoming.length > rules.maxIncoming) {
      errors.push(`节点 ${node.data.label} 的输入连线不能超过 ${rules.maxIncoming} 条`);
    }
    if (rules.maxOutgoing != null && outgoing.length > rules.maxOutgoing) {
      errors.push(`节点 ${node.data.label} 的输出连线不能超过 ${rules.maxOutgoing} 条`);
    }
  });

  const outputs = buildOutputMap(nodes);
  nodes.forEach((node) => {
    const upstream = getUpstreamNodeIds(node.id, edges);
    getNodeModule(node.data.nodeType).getReferences(node).forEach((reference) => {
      validateReference(
        reference.value,
        reference.context,
        outputs,
        upstream,
        errors,
        reference.acceptedValueTypes,
      );
    });
  });

  return errors;
}
