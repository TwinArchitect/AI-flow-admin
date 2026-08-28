import type { XYPosition } from '@xyflow/react';
import { getNodeModule } from '../nodes/registry';
import { LOOP_HEIGHT, LOOP_WIDTH, normalizeLoopConfig } from '../contracts/loopNodeContract';
import type { WorkflowCanvasNode } from '../types';

export function isLoopChild(node: WorkflowCanvasNode) {
  return Boolean(node.parentId);
}

export function getAbsoluteNodePosition(node: WorkflowCanvasNode, nodes: WorkflowCanvasNode[]): XYPosition {
  if (!node.parentId) return node.position;
  const parent = nodes.find((item) => item.id === node.parentId);
  if (!parent) return node.position;
  const parentPosition = getAbsoluteNodePosition(parent, nodes);
  return { x: parentPosition.x + node.position.x, y: parentPosition.y + node.position.y };
}

export function findLoopAtPosition(position: XYPosition, nodes: WorkflowCanvasNode[], excludeId?: string) {
  return nodes.find((node) => {
    if (node.id === excludeId || node.data.nodeType !== 'loop' || node.parentId) return false;
    const config = normalizeLoopConfig(node.data.config);
    return position.x >= node.position.x
      && position.x <= node.position.x + config.nodeWidth
      && position.y >= node.position.y
      && position.y <= node.position.y + config.nodeHeight;
  });
}

export function attachNodeToLoop(node: WorkflowCanvasNode, loop: WorkflowCanvasNode, absolutePosition: XYPosition): WorkflowCanvasNode {
  return {
    ...node,
    parentId: loop.id,
    position: { x: absolutePosition.x - loop.position.x, y: absolutePosition.y - loop.position.y },
    zIndex: 1,
  };
}

export function resolveNodeParent(node: WorkflowCanvasNode, nodes: WorkflowCanvasNode[], absolutePosition: XYPosition) {
  if (node.data.nodeType === 'loop' || node.data.nodeType === 'start' || node.data.nodeType === 'end') {
    return { ...node, parentId: undefined, position: absolutePosition, zIndex: undefined };
  }
  if (node.data.nodeType === 'loopStart' || node.data.nodeType === 'loopBreak') return node;
  const loop = findLoopAtPosition({ x: absolutePosition.x + 110, y: absolutePosition.y + 70 }, nodes, node.id);
  if (loop) return attachNodeToLoop(node, loop, absolutePosition);
  return { ...node, parentId: undefined, position: absolutePosition, zIndex: undefined };
}

export function syncLoopMetadata(nodes: WorkflowCanvasNode[]) {
  return nodes.map((node) => {
    if (node.data.nodeType !== 'loop') return node;
    const config = normalizeLoopConfig(node.data.config);
    const children = nodes.filter((item) => item.parentId === node.id);
    return {
      ...node,
      style: { ...(node.style ?? {}), width: config.nodeWidth || LOOP_WIDTH, height: config.nodeHeight || LOOP_HEIGHT },
      zIndex: 0,
      data: { ...node.data, config: { ...config, childrenNodeIds: children.map((item) => item.id) } },
    };
  });
}

export function createLoopBundle(position: XYPosition): WorkflowCanvasNode[] {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const loopId = `loop-${suffix}`;
  const startId = `loopStart-${suffix}`;
  const breakId = `loopBreak-${suffix}`;
  const loopModule = getNodeModule('loop');
  const config = { ...loopModule.createDefaultConfig(), childrenNodeIds: [startId, breakId] };
  return [
    {
      id: loopId,
      type: 'loop',
      position,
      style: { width: LOOP_WIDTH, height: LOOP_HEIGHT },
      zIndex: 0,
      data: { label: loopModule.definition.name, nodeType: 'loop', description: loopModule.definition.description, config },
    },
    {
      id: startId,
      type: 'loopStart',
      parentId: loopId,
      position: { x: 48, y: 92 },
      zIndex: 1,
      data: { label: '循环开始', nodeType: 'loopStart', description: '每轮循环的起点，输出当前索引与当前项', config: getNodeModule('loopStart').createDefaultConfig() },
    },
    {
      id: breakId,
      type: 'loopBreak',
      parentId: loopId,
      position: { x: 540, y: 250 },
      zIndex: 1,
      data: { label: '循环终止', nodeType: 'loopBreak', description: '执行到此节点时终止剩余循环', config: {} },
    },
  ];
}
