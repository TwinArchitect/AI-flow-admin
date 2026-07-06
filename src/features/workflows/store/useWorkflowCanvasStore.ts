import { create } from 'zustand';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import type { Connection, EdgeChange, NodeChange, XYPosition } from '@xyflow/react';
import type { EdgeLineMode, WorkflowCanvasEdge, WorkflowCanvasNode, WorkflowNodeType } from '../types';
import { NODE_DEF_MAP } from '../config/nodeDefs';
import { DEFAULT_LLM_CONFIG, getDefaultNodeConfig } from '../config/nodeDefaults';

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
      config: getDefaultNodeConfig('start'),
    },
  },
  {
    id: 'llm-demo',
    type: 'llm',
    position: { x: 380, y: 160 },
    data: {
      label: '意图理解',
      nodeType: 'llm',
      description: '识别用户问题并生成结构化意图',
      config: {
        ...DEFAULT_LLM_CONFIG,
        temperature: 0.4,
        systemPrompt: '你是一个严谨的业务助手，请识别用户意图并输出简洁结论。',
      },
    },
  },
  {
    id: 'end',
    type: 'end',
    position: { x: 700, y: 180 },
    data: {
      label: '结束',
      nodeType: 'end',
      description: '返回最终响应',
      config: getDefaultNodeConfig('end'),
    },
  },
];

const initialEdges: WorkflowCanvasEdge[] = [
  { id: 'start-llm-demo', source: 'start', target: 'llm-demo', animated: true },
  { id: 'llm-demo-end', source: 'llm-demo', target: 'end' },
];

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
  addNode: (type: WorkflowNodeType, position: XYPosition) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  deleteNode: (nodeId: string) => void;
  setEdgeLineMode: (mode: EdgeLineMode) => void;
  setSelectedNodeId: (id: string | null) => void;
  saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;
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

  onNodesChange: (changes) => {
    const { nodes, edges, past } = get();
    const hasStructuralChange = changes.some((change) => change.type === 'remove' || change.type === 'add');

    if (hasStructuralChange) {
      set({
        nodes: applyNodeChanges(changes, nodes),
        past: pushSnapshot(past, nodes, edges),
        future: [],
      });
      return;
    }

    set({ nodes: applyNodeChanges(changes, nodes) });
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

  addNode: (type, position) => {
    const { nodes, edges, past } = get();
    const def = NODE_DEF_MAP[type];
    const node: WorkflowCanvasNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: {
        label: def.name,
        nodeType: type,
        description: def.description,
        config: getDefaultNodeConfig(type),
      },
    };

    set({
      nodes: [...nodes, node],
      selectedNodeId: node.id,
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
    set({
      nodes: nodes.filter((node) => node.id !== nodeId),
      edges: edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      selectedNodeId: selectedNodeId === nodeId ? null : selectedNodeId,
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
