import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import isEqual from 'lodash-es/isEqual';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import type { FitViewOptions, NodeChange, NodeMouseHandler, NodeTypes } from '@xyflow/react';
import { Loader2, Map, Maximize2, PanelLeftOpen, Play, Redo2, Save, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/theme';
import { WorkflowExecutionProvider } from '../context/WorkflowExecutionContext';
import { useWorkflowCanvasExecution } from '../hooks/useWorkflowCanvasExecution';
import { useDeleteWorkflowAgent, useSaveWorkflowConfig } from '../hooks/useWorkflowRuntime';
import { getNodeModule, WORKFLOW_NODE_MODULES } from '../nodes/registry';
import { createConnectionValidator } from '../utils/connectionRules';
import { serializeWorkflowToBackend } from '../utils/workflowSerialization';
import { validateWorkflowForBackend } from '../utils/workflowValidation';
import { getWorkflowDebugContext } from '../utils/workflowDebugContext';
import { useWorkflowCanvasStore } from '../store/useWorkflowCanvasStore';
import type { WorkflowBackendPayload, WorkflowCanvasNode, WorkflowNodeType } from '../types';
import type { WorkflowNodeExecutionStates } from '../types/execution';
import type { SaveWorkflowConfigResult } from '../api/workflowApi';
import { NodeConfigPanel } from './NodeConfigPanel';
import { NodeSidebar } from './NodeSidebar';
import { WorkflowNode } from './WorkflowNode';
import { WorkflowDebugDrawer } from './debug/WorkflowDebugDrawer';

const nodeTypes = Object.fromEntries(
  WORKFLOW_NODE_MODULES.map((module) => [module.type, WorkflowNode]),
) as NodeTypes;

const WORKFLOW_FIT_VIEW_OPTIONS = {
  padding: 0.2,
  maxZoom: 0.9,
  duration: 280,
} satisfies FitViewOptions;

interface WorkflowToolbarProps {
  agentId?: string;
  agentName: string;
  savedBaseline: WorkflowBackendPayload | null;
  initialViewport?: { x: number; y: number; zoom: number };
  loadedAgentId?: string;
  onSaved: (result: SaveWorkflowConfigResult) => void;
  onDeleted: () => void;
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
}

interface WorkflowToolbarExecutionProps {
  nodeStates: WorkflowNodeExecutionStates;
  isRunning: boolean;
  onOpenDebug: () => void;
}

function WorkflowToolbar({
  agentId,
  agentName,
  savedBaseline,
  initialViewport: _initialViewport,
  onSaved,
  onDeleted,
  isSidebarOpen,
  onOpenSidebar,
  nodeStates,
  isRunning,
  onOpenDebug,
}: WorkflowToolbarProps & WorkflowToolbarExecutionProps) {
  const { fitView, getViewport } = useReactFlow();
  const saveWorkflowMutation = useSaveWorkflowConfig();
  const deleteWorkflowMutation = useDeleteWorkflowAgent();
  const {
    undo,
    redo,
    past,
    future,
    toJSON,
    nodes,
    edges,
  } = useWorkflowCanvasStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const activeNode = nodes.find((node) => nodeStates[node.id]?.status === 'running');
  const completedCount = nodes.filter((node) =>
    nodeStates[node.id] && nodeStates[node.id]?.status !== 'idle' && nodeStates[node.id]?.status !== 'running'
  ).length;
  const currentPayload = useMemo(
    () => serializeWorkflowToBackend(nodes, edges),
    [nodes, edges],
  );
  const isDirty = !savedBaseline || !isEqual(currentPayload, savedBaseline);
  const runDisabledReason = !agentId
    ? '请先保存工作流，生成智能体 ID 后再运行'
    : isDirty
      ? '当前配置有未保存的修改，请先保存配置后再运行'
      : null;

  useEffect(() => {
    function warnBeforeLeave(event: BeforeUnloadEvent) {
      if (!isDirty) return;
      event.preventDefault();
    }
    window.addEventListener('beforeunload', warnBeforeLeave);
    return () => window.removeEventListener('beforeunload', warnBeforeLeave);
  }, [isDirty]);

  function buildValidatedPayload(action: string) {
    const json = toJSON();
    const errors = validateWorkflowForBackend(json.nodes, json.edges);

    if (errors.length > 0) {
      toast.error(`工作流暂不能${action}`, {
        description: errors[0],
      });
      console.warn('工作流校验失败:', errors);
      return null;
    }

    const payload = serializeWorkflowToBackend(json.nodes, json.edges);
    return { ...json, payload };
  }

  function handleSave() {
    const result = buildValidatedPayload('保存');
    if (!result) return;

    saveWorkflowMutation.mutate({
      agentId,
      agentName,
      nodes: result.nodes,
      edges: result.edges,
      viewport: getViewport(),
    }, {
      onSuccess: (data) => {
        onSaved(data);
        console.log('后端工作流 Payload:', JSON.stringify(data.payload, null, 2));
        toast.success(agentId ? '工作流配置已保存' : '智能体已创建', {
          description: `智能体 ID：${data.agentId}`,
        });
      },
      onError: (error) => {
        toast.error('工作流保存失败', {
          description: error instanceof Error ? error.message : '未知错误',
        });
      },
    });
  }

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-3">
      <div className="flex items-center gap-1">
        {!isSidebarOpen && (
          <Button variant="ghost" size="icon-sm" onClick={onOpenSidebar} aria-label="展开节点库">
            <PanelLeftOpen size={15} />
          </Button>
        )}
        <div className="px-2">
          <div className="text-sm font-semibold text-foreground">工作流编排</div>
          <div className="text-[10px] text-muted-foreground">拖拽节点、连接流程、配置参数</div>
        </div>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <Button variant="ghost" size="icon-sm" onClick={undo} disabled={past.length === 0} aria-label="撤销">
          <Undo2 size={15} />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={redo} disabled={future.length === 0} aria-label="重做">
          <Redo2 size={15} />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => fitView(WORKFLOW_FIT_VIEW_OPTIONS)}
          aria-label="视图自适应"
        >
          <Maximize2 size={15} />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {isRunning && (
          <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            <span>正在运行：{activeNode?.data.label ?? '工作流'}</span>
            <span className="tabular-nums">{completedCount}/{nodes.length}</span>
          </div>
        )}
        {agentId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleteWorkflowMutation.isPending || isRunning}
                aria-label="删除智能体"
              >
                <Trash2 size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除当前智能体</TooltipContent>
          </Tooltip>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={saveWorkflowMutation.isPending || !isDirty || isRunning}
        >
          <Save size={14} />
          {saveWorkflowMutation.isPending ? '保存中' : '保存'}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button size="sm" onClick={onOpenDebug} disabled={Boolean(runDisabledReason) || isRunning}>
                {isRunning
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Play size={14} fill="currentColor" />}
                {isRunning ? '运行中' : '运行'}
              </Button>
            </span>
          </TooltipTrigger>
          {runDisabledReason && <TooltipContent>{runDisabledReason}</TooltipContent>}
        </Tooltip>
      </div>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>删除当前智能体？</DialogTitle>
            <DialogDescription>删除后该智能体及其已保存工作流配置将无法恢复。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button
              variant="destructive"
              disabled={deleteWorkflowMutation.isPending}
              onClick={() => {
                if (!agentId) return;
                deleteWorkflowMutation.mutate(agentId, {
                  onSuccess: () => {
                    setDeleteDialogOpen(false);
                    onDeleted();
                    toast.success('智能体已删除');
                  },
                  onError: (error) => toast.error('删除失败', { description: error.message }),
                });
              }}
            >
              {deleteWorkflowMutation.isPending ? '删除中' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

function WorkflowCanvasInner({
  agentId,
  agentName,
  savedBaseline,
  initialViewport,
  loadedAgentId,
  onSaved,
  onDeleted,
  isSidebarOpen,
  onOpenSidebar,
}: WorkflowToolbarProps) {
  const {
    nodes,
    edges,
    edgeLineMode,
    selectedNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeId,
    saveSnapshot,
    undo,
    redo,
  } = useWorkflowCanvasStore();
  const isDark = useThemeStore((state) => state.isDark);
  const { fitView, screenToFlowPosition } = useReactFlow();
  const canvasExecution = useWorkflowCanvasExecution();
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugRunning, setDebugRunning] = useState(false);
  const fittedAgentIdRef = useRef<string>();
  const debugContext = useMemo(() => getWorkflowDebugContext(nodes), [nodes]);
  useEffect(() => {
    if (!loadedAgentId || fittedAgentIdRef.current === loadedAgentId || nodes.length === 0) return;

    fittedAgentIdRef.current = loadedAgentId;
    const frame = window.requestAnimationFrame(() => {
      void fitView(WORKFLOW_FIT_VIEW_OPTIONS);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [fitView, loadedAgentId, nodes.length]);

  const edgeStyle = useMemo(
    () => ({
      stroke: 'var(--color-primary)',
      strokeWidth: 2,
      strokeDasharray: edgeLineMode === 'animated' ? '6 6' : undefined,
    }),
    [edgeLineMode],
  );

  const displayEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        animated:
          nodes.some((node) => canvasExecution.nodeStates[node.id]?.status === 'running')
            ? canvasExecution.nodeStates[edge.source]?.status === 'success'
              && canvasExecution.nodeStates[edge.target]?.status === 'running'
            : edgeLineMode === 'animated',
        style: {
          ...(edge.style ?? {}),
          ...edgeStyle,
        },
      })),
    [canvasExecution.nodeStates, edgeLineMode, edgeStyle, edges, nodes],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const modifier = navigator.platform.toUpperCase().includes('MAC') ? event.metaKey : event.ctrlKey;
      if (!modifier) return;

      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }

      if (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey)) {
        event.preventDefault();
        redo();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [redo, undo]);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (debugRunning) return;
      const type = event.dataTransfer.getData('application/workflow-node-type') as WorkflowNodeType;
      if (!type) return;

      addNode(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [addNode, debugRunning, screenToFlowPosition],
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleNodeClick: NodeMouseHandler<WorkflowCanvasNode> = useCallback(
    (_event, node) => setSelectedNodeId(node.id),
    [setSelectedNodeId],
  );

  const guardedOnNodesChange = useCallback(
    (changes: NodeChange<WorkflowCanvasNode>[]) => {
      const filtered = changes.filter((change) => {
        if (change.type !== 'remove') return true;
        const node = nodes.find((item) => item.id === change.id);
        return node ? getNodeModule(node.data.nodeType).connection.deletable : true;
      });

      onNodesChange(filtered);
    },
    [nodes, onNodesChange],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <WorkflowToolbar
        agentId={agentId}
        agentName={agentName}
        savedBaseline={savedBaseline}
        initialViewport={initialViewport}
        onSaved={onSaved}
        onDeleted={onDeleted}
        isSidebarOpen={isSidebarOpen}
        onOpenSidebar={onOpenSidebar}
        nodeStates={canvasExecution.nodeStates}
        isRunning={debugRunning}
        onOpenDebug={() => setDebugOpen(true)}
      />
      <div className="relative flex-1 overflow-hidden" onDrop={handleDrop} onDragOver={handleDragOver}>
        <WorkflowExecutionProvider value={canvasExecution.nodeStates}>
          <ReactFlow
          nodes={nodes}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          onNodesChange={guardedOnNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={() => setSelectedNodeId(null)}
          onNodeClick={handleNodeClick}
          onNodeDragStart={saveSnapshot}
          fitView={!initialViewport}
          defaultViewport={initialViewport}
          fitViewOptions={WORKFLOW_FIT_VIEW_OPTIONS}
          minZoom={0.25}
          maxZoom={1.6}
          snapToGrid
          snapGrid={[16, 16]}
          deleteKeyCode={['Delete', 'Backspace']}
          multiSelectionKeyCode="Shift"
          selectionKeyCode={null}
          isValidConnection={createConnectionValidator(nodes, edges)}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            animated: edgeLineMode === 'animated',
            style: edgeStyle,
          }}
          connectionLineStyle={edgeStyle}
          colorMode={isDark ? 'dark' : 'light'}
          nodesDraggable={!debugRunning}
          nodesConnectable={!debugRunning}
          elementsSelectable={!debugRunning}
          className="workflow-canvas bg-background"
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1} className="text-border" />
            <Controls />
            {showMiniMap && (
              <MiniMap
                pannable
                zoomable
                maskColor="var(--color-bg-muted)"
                bgColor="var(--color-bg-card)"
                className="!border !border-border !bg-card !shadow-sm"
                nodeClassName={(node) =>
                  cn(node.id === selectedNodeId ? '!fill-primary' : '!fill-muted-foreground')
                }
              />
            )}
          </ReactFlow>
        </WorkflowExecutionProvider>
        <Button
          type="button"
          variant={showMiniMap ? 'secondary' : 'outline'}
          size="icon-sm"
          className="absolute bottom-4 right-4 z-10 bg-card shadow-sm"
          onClick={() => setShowMiniMap((value) => !value)}
          aria-label={showMiniMap ? '隐藏小地图' : '显示小地图'}
        >
          <Map size={14} />
        </Button>
        {selectedNodeId && !debugOpen && <NodeConfigPanel />}
        {agentId && (
          <WorkflowDebugDrawer
            open={debugOpen}
            onClose={() => setDebugOpen(false)}
            agentId={agentId}
            agentName={agentName}
            context={debugContext}
            onExecutionReset={canvasExecution.reset}
            onExecutionStart={() => {
              const startNode = nodes.find((node) => node.data.nodeType === 'start');
              if (startNode) canvasExecution.startExecution(startNode.id);
            }}
            onExecutionFinish={(outcome, message) =>
              canvasExecution.finishExecution(nodes.map((node) => node.id), outcome, message)
            }
            onNodeExecutionEvent={(eventName, payload) =>
              canvasExecution.applyNodeEvent(eventName, payload, edges)
            }
            onRunningChange={setDebugRunning}
          />
        )}
      </div>
    </div>
  );
}

export function WorkflowCanvas(props: WorkflowToolbarProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

export { NodeSidebar };
