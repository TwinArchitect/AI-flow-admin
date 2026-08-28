import { create } from 'zustand';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import type { Connection, EdgeChange, NodeChange, XYPosition } from '@xyflow/react';
import type {
  EdgeLineMode,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
  WorkflowNodeType,
} from '../types';
import { getNodeModule } from '../nodes/registry';
import { createLoopBundle, syncLoopMetadata } from '../utils/loopLayout';

interface Snapshot {
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
}

const initialNodes: WorkflowCanvasNode[] = [
  {
    id: 'start',
    type: 'start',
    position: { x: 80, y: 180 },
    data: {
      label: '开始',
      nodeType: 'start',
      description: '接收用户输入并启动流程',
      config: getNodeModule('start').createDefaultConfig(),
    },
  },
  {
    id: 'end',
    type: 'end',
    position: { x: 420, y: 180 },
    data: {
      label: '结束',
      nodeType: 'end',
      description: '返回最终响应',
      config: getNodeModule('end').createDefaultConfig(),
    },
  },
];

const initialEdges: WorkflowCanvasEdge[] = [];

const MAX_HISTORY = 50;

interface WorkflowCanvasState {
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
  edgeLineMode: EdgeLineMode;
  selectedNodeId: string | null;
  past: Snapshot[];
  future: Snapshot[];
  onNodesChange: (changes: NodeChange<WorkflowCanvasNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowCanvasEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: WorkflowNodeType, position: XYPosition, parentId?: string) => void;
  updateNodeParent: (nodeId: string, parentId: string | undefined, position: XYPosition) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  deleteNode: (nodeId: string) => void;
  removeEdgesBySourceHandle: (handleId: string) => void;
  setEdgeLineMode: (mode: EdgeLineMode) => void;
  setSelectedNodeId: (id: string | null) => void;
  saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  replaceWorkflow: (nodes: WorkflowCanvasNode[], edges: WorkflowCanvasEdge[]) => void;
  resetToNewWorkflow: () => void;
  toJSON: () => { nodes: WorkflowCanvasNode[]; edges: WorkflowCanvasEdge[] };
}

function pushSnapshot(
  past: Snapshot[],
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
) {
  const next = [...past, { nodes, edges }];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

export const useWorkflowCanvasStore = create<WorkflowCanvasState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  edgeLineMode: 'solid',
  selectedNodeId: null,
  past: [],
  future: [],

  replaceWorkflow: (nodes, edges) => set({
    nodes,
    edges,
    selectedNodeId: null,
    past: [],
    future: [],
  }),

  resetToNewWorkflow: () => set({
    nodes: initialNodes,
    edges: [],
    selectedNodeId: null,
    past: [],
    future: [],
  }),

  onNodesChange: (changes) => {
    const { nodes, edges, past } = get();
    const hasStructuralChange = changes.some((change) => change.type === 'remove' || change.type === 'add');

    const applyChanges = () => {
      const resizedLoops = new Map(
        changes.flatMap((change) => {
          if (change.type !== 'dimensions' || !change.dimensions) return [];
          const node = nodes.find((item) => item.id === change.id);
          if (node?.data.nodeType !== 'loop') return [];
          return [[change.id, change.dimensions] as const];
        }),
      );

      return applyNodeChanges(changes, nodes).map((node) => {
        const dimensions = resizedLoops.get(node.id);
        if (!dimensions) return node;
        return {
          ...node,
          style: {
            ...node.style,
            width: dimensions.width,
            height: dimensions.height,
          },
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              nodeWidth: dimensions.width,
              nodeHeight: dimensions.height,
            },
          },
        };
      });
    };

    if (hasStructuralChange) {
      set({
        nodes: applyChanges(),
        past: pushSnapshot(past, nodes, edges),
        future: [],
      });
      return;
    }

    set({ nodes: applyChanges() });
  },

  onEdgesChange: (changes) => {
    const { nodes, edges, past } = get();
    const hasStructuralChange = changes.some((change) => change.type === 'remove' || change.type === 'add');

    if (hasStructuralChange) {
      set({
        edges: applyEdgeChanges(changes, edges),
        past: pushSnapshot(past, nodes, edges),
        future: [],
      });
      return;
    }

    set({ edges: applyEdgeChanges(changes, edges) });
  },

  onConnect: (connection) => {
    const { nodes, edges, past } = get();
    set({
      edges: addEdge({ ...connection, animated: false }, edges),
      past: pushSnapshot(past, nodes, edges),
      future: [],
    });
  },

  addNode: (type, position, parentId) => {
    const { nodes, edges, past } = get();
    if (type === 'loop') {
      const bundle = createLoopBundle(position);
      set({
        nodes: [...nodes, ...bundle],
        selectedNodeId: bundle[0].id,
        past: pushSnapshot(past, nodes, edges),
        future: [],
      });
      return;
    }
    const module = getNodeModule(type);
    const def = module.definition;
    const node: WorkflowCanvasNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      parentId,
      zIndex: parentId ? 1 : undefined,
      data: {
        label: def.name,
        nodeType: type,
        description: def.description,
        config: module.createDefaultConfig(),
      },
    };

    set({
      nodes: syncLoopMetadata([...nodes, node]),
      selectedNodeId: node.id,
      past: pushSnapshot(past, nodes, edges),
      future: [],
    });
  },

  updateNodeParent: (nodeId, parentId, position) => {
    const { nodes, edges, past } = get();
    const current = nodes.find((node) => node.id === nodeId);
    if (!current || (current.parentId === parentId && current.position.x === position.x && current.position.y === position.y)) return;
    set({
      nodes: syncLoopMetadata(nodes.map((node) => node.id === nodeId ? { ...node, parentId, position, zIndex: parentId ? 1 : undefined } : node)),
      past: pushSnapshot(past, nodes, edges),
      future: [],
    });
  },

  updateNodeConfig: (nodeId, config) => {
    const { nodes, edges, past } = get();
    set({
      nodes: nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config: { ...node.data.config, ...config } } }
          : node,
      ),
      past: pushSnapshot(past, nodes, edges),
      future: [],
    });
  },

  updateNodeLabel: (nodeId, label) => {
    const { nodes, edges, past } = get();
    set({
      nodes: nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, label } } : node,
      ),
      past: pushSnapshot(past, nodes, edges),
      future: [],
    });
  },

  deleteNode: (nodeId) => {
    const { nodes, edges, past, selectedNodeId } = get();
    const removing = new Set([nodeId, ...nodes.filter((node) => node.parentId === nodeId).map((node) => node.id)]);
    set({
      nodes: syncLoopMetadata(nodes.filter((node) => !removing.has(node.id))),
      edges: edges.filter((edge) => !removing.has(edge.source) && !removing.has(edge.target)),
      selectedNodeId: selectedNodeId && removing.has(selectedNodeId) ? null : selectedNodeId,
      past: pushSnapshot(past, nodes, edges),
      future: [],
    });
  },

  removeEdgesBySourceHandle: (handleId) => {
    const { nodes, edges, past } = get();
    const nextEdges = edges.filter((edge) => edge.sourceHandle !== handleId);
    if (nextEdges.length === edges.length) return;
    set({
      edges: nextEdges,
      past: pushSnapshot(past, nodes, edges),
      future: [],
    });
  },

  setEdgeLineMode: (mode) => set({ edgeLineMode: mode }),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  saveSnapshot: () => {
    const { nodes, edges, past } = get();
    set({ past: pushSnapshot(past, nodes, edges), future: [] });
  },

  undo: () => {
    const { past, nodes, edges, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: past.slice(0, -1),
      future: [{ nodes, edges }, ...future],
      selectedNodeId: null,
    });
  },

  redo: () => {
    const { future, nodes, edges, past } = get();
    if (future.length === 0) return;

    const next = future[0];
    set({
      nodes: next.nodes,
      edges: next.edges,
      past: pushSnapshot(past, nodes, edges),
      future: future.slice(1),
      selectedNodeId: null,
    });
  },

  toJSON: () => ({
    nodes: get().nodes,
    edges: get().edges,
  }),
}));
