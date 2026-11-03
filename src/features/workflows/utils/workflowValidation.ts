import { getVariableUpstreamNodes } from './loopVariableScope';
import { getNodeConnectionRules, getNodeModule } from '../nodes/registry';
import type { WorkflowCanvasEdge, WorkflowCanvasNode } from '../types';
import { parseVariableRef, parseVariableRefs } from './variableRefs';
import { normalizeLoopConfig } from '../contracts/loopNodeContract';
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
  loopIds: Set<string> = new Set(),
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
      errors.push(loopIds.has(ref.nodeId)
        ? `${context} 引用的循环旧输出 ${ref.raw} 已不可用，请重新选择 {{${ref.nodeId}.results}}（字符串数组），不要直接沿用旧输出类型`
        : `${context} 引用了不存在的输出 ${ref.raw}`);
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
  if (ends.length < 1) errors.push('工作流必须至少有一个结束节点');

  edges.forEach((edge) => {
    if (!nodeMap.has(edge.source)) errors.push(`连线 ${edge.id} 的源节点不存在`);
    if (!nodeMap.has(edge.target)) errors.push(`连线 ${edge.id} 的目标节点不存在`);
    if (edge.source === edge.target) errors.push(`节点不能连接自身：${edge.id}`);
  });
  nodes.forEach((node) => {
    const hasConnection = edges.some((edge) => edge.source === node.id || edge.target === node.id);
    if (!hasConnection && node.data.nodeType !== 'loopBreak') errors.push(`节点 ${node.data.label} 不能是孤立节点`);
  });
  if (hasCycle(edges)) errors.push('工作流存在环路，请检查连线');

  if (starts.length === 1 && ends.length > 0) {
    const topLevelIds = new Set(nodes.filter((node) => !node.parentId).map((node) => node.id));
    const topLevelEdges = edges.filter((edge) => topLevelIds.has(edge.source) && topLevelIds.has(edge.target));
    const reachableFromStart = getReachableNodeIds(starts[0].id, topLevelEdges);
    // 判断器的未连接分支可直接结束当前路径。
    const pathEnds = [...ends, ...nodes.filter((node) => !node.parentId && node.data.nodeType === 'condition')];
    const canReachEnd = new Set(
      pathEnds.flatMap((end) => [...getReachableNodeIds(end.id, topLevelEdges, true)]),
    );
    if (!pathEnds.some((end) => reachableFromStart.has(end.id))) {
      errors.push('开始节点与结束节点之间不存在可执行路径');
    }
    nodes.filter((node) => !node.parentId).forEach((node) => {
      if (!reachableFromStart.has(node.id)) {
        errors.push(`节点 ${node.data.label} 无法从开始节点到达`);
      } else if (!canReachEnd.has(node.id)) {
        errors.push(`节点 ${node.data.label} 无法到达结束节点`);
      }
    });
  }

  nodes.filter((node) => node.data.nodeType === 'loop').forEach((loop) => {
    const children = nodes.filter((node) => node.parentId === loop.id);
    const startsInLoop = children.filter((node) => node.data.nodeType === 'loopStart');
    if (startsInLoop.length !== 1) errors.push(`循环体 ${loop.data.label} 必须有且仅有一个循环开始节点`);
    if (children.some((node) => node.data.nodeType === 'loop')) errors.push(`循环体 ${loop.data.label} 不支持嵌套循环`);
    if (startsInLoop.length === 1) {
      const childIds = new Set(children.map((node) => node.id));
      const childEdges = edges.filter((edge) => childIds.has(edge.source) && childIds.has(edge.target));
      const reachable = getReachableNodeIds(startsInLoop[0].id, childEdges);
      children.filter((node) => node.data.nodeType !== 'loopBreak').forEach((node) => {
        if (!reachable.has(node.id)) errors.push(`循环体 ${loop.data.label} 内的节点 ${node.data.label} 无法从循环开始节点到达`);
      });
    }
    const config = normalizeLoopConfig(loop.data.config);
    const arrayRef = parseVariableRef(config.loopRunInputArray);
    if (config.loopRunMode === 'array' && arrayRef && nodeMap.get(arrayRef.nodeId)?.parentId === loop.id) {
      errors.push(`循环体 ${loop.data.label} 的输入数组不能引用自身内部节点`);
    }
    // Collection may use an upstream/global value or a loop-body output. Scope validation is shared with the picker.
    const outputRef = parseVariableRef(config.loopOutputSource);
    if (outputRef?.nodeId === loop.id) errors.push(`循环体 ${loop.data.label} 的收集结果不能引用自身输出`);
  });

  nodes.filter((node) => node.parentId).forEach((node) => {
    const parent = nodeMap.get(node.parentId!);
    if (parent?.data.nodeType !== 'loop') errors.push(`节点 ${node.data.label} 的父容器不是有效循环体`);
  });
  nodes.filter((node) => (node.data.nodeType === 'loopStart' || node.data.nodeType === 'loopBreak') && !node.parentId)
    .forEach((node) => errors.push(`内部节点 ${node.data.label} 必须位于循环体内`));
  edges.forEach((edge) => {
    const sourceParent = nodeMap.get(edge.source)?.parentId ?? null;
    const targetParent = nodeMap.get(edge.target)?.parentId ?? null;
    if (sourceParent !== targetParent) errors.push(`连线 ${edge.id} 不能跨越循环体边界`);
  });

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
    const canEndLoopIteration = Boolean(node.parentId)
      && node.data.nodeType !== 'loopStart'
      && node.data.nodeType !== 'loopBreak';
    if (rules.requireOutgoing && outgoing.length === 0 && !canEndLoopIteration) {
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
  const loopIds = new Set(nodes.filter((node) => node.data.nodeType === 'loop').map((node) => node.id));
  nodes.forEach((node) => {
    const baseUpstream = new Set(getVariableUpstreamNodes(node.id, nodes, edges).map((source) => source.id));
    getNodeModule(node.data.nodeType).getReferences(node).forEach((reference) => {
      const upstream = new Set(baseUpstream);
      const visibleOutputs = new Map(outputs);
      if (node.data.nodeType === 'loop' && reference.loopCollection) {
        nodes.filter((item) => item.parentId === node.id).forEach((child) => {
          upstream.add(child.id);
          if (child.data.nodeType === 'reply') visibleOutputs.set(child.id, new Map([['text', 'string']]));
        });
      }
      validateReference(reference.value, reference.context, visibleOutputs, upstream, errors, reference.acceptedValueTypes, loopIds);
    });
  });

  return errors;
}
