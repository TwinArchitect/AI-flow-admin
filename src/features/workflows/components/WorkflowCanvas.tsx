import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import type { NodeChange, NodeMouseHandler, NodeTypes } from '@xyflow/react';
import { Map, Maximize2, PanelLeftOpen, Play, Redo2, Save, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/theme';
import { useRunWorkflowStream, useSaveWorkflowConfig } from '../hooks/useWorkflowRuntime';
import { createConnectionValidator } from '../utils/connectionRules';
import { serializeWorkflowToBackend } from '../utils/workflowSerialization';
import { validateWorkflowForBackend } from '../utils/workflowValidation';
import { useWorkflowCanvasStore } from '../store/useWorkflowCanvasStore';
import type { EdgeLineMode, WorkflowCanvasNode, WorkflowNodeType } from '../types';
import { NodeConfigPanel } from './NodeConfigPanel';
import { NodeSidebar } from './NodeSidebar';
import { WorkflowNode } from './WorkflowNode';

const nodeTypes: NodeTypes = {
  start: WorkflowNode,
  end: WorkflowNode,
  llm: WorkflowNode,
  knowledge: WorkflowNode,
  http: WorkflowNode,
  reply: WorkflowNode,
  condition: WorkflowNode,
  code: WorkflowNode,
  plugin: WorkflowNode,
  mcp: WorkflowNode,
};

interface WorkflowToolbarProps {
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
}

function EdgeModeButton({
  mode,
  active,
  label,
  onClick,
}: {
  mode: EdgeLineMode;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            'flex h-7 w-11 items-center justify-center rounded-md border transition-all',
            active
              ? 'border-primary bg-primary/10 text-primary shadow-xs'
              : 'border-transparent text-muted-foreground hover:bg-background hover:text-foreground',
          )}
        >
          <svg viewBox="0 0 34 12" className="h-3 w-8" aria-hidden="true">
            <path
              d="M3 6 C 10 1, 15 1, 22 6 S 31 11, 33 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={mode === 'animated' ? '4 4' : undefined}
            />
          </svg>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function WorkflowToolbar({ isSidebarOpen, onOpenSidebar }: WorkflowToolbarProps) {
  const { fitView } = useReactFlow();
  const saveWorkflowMutation = useSaveWorkflowConfig();
  const runWorkflowMutation = useRunWorkflowStream();
  const {
    undo,
    redo,
    past,
    future,
    toJSON,
    edgeLineMode,
    setEdgeLineMode,
    resetRunState,
    setNodeRunState,
  } = useWorkflowCanvasStore();
  const isRunning = runWorkflowMutation.isPending;

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
      agentId: 'workflow-demo',
      agentName: '工作流演示',
      nodes: result.nodes,
      edges: result.edges,
    }, {
      onSuccess: (data) => {
        console.log('后端工作流 Payload:', JSON.stringify(data.payload, null, 2));
        toast.success('工作流配置已准备保存', {
          description: '已通过保存 adapter 生成 agentSetting。',
        });
      },
      onError: (error) => {
        toast.error('工作流保存失败', {
          description: error instanceof Error ? error.message : '未知错误',
        });
      },
    });
  }

  function handleRun() {
    if (isRunning) return;
    const result = buildValidatedPayload('运行');
    if (!result) return;

    const { nodes, edges, payload } = result;
    resetRunState();

    runWorkflowMutation.mutate({
      request: {
        appId: 'workflow-demo',
        message: [
          {
            role: 'user',
            content: String(payload.chatConfig.variables[0]?.defaultValue ?? ''),
          },
        ],
        variables: Object.fromEntries(
          payload.chatConfig.variables.map((variable) => [
            variable.key,
            variable.defaultValue ?? '',
          ]),
        ),
        debug: true,
      },
      nodes,
      edges,
      payload,
      onNodeEvent: (event) => {
        setNodeRunState(event.nodeId, event.status, event.message);
      },
    }, {
      onSuccess: (runResult) => {
        console.log('工作流运行结果:', JSON.stringify(runResult, null, 2));
        toast.success('工作流运行完成', {
          description: `最终输出：${JSON.stringify(runResult.outputs)}`,
        });
      },
      onError: (error) => {
        toast.error('工作流运行失败', {
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
          onClick={() => fitView({ padding: 0.18, duration: 240 })}
          aria-label="视图自适应"
        >
          <Maximize2 size={15} />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/70 p-0.5">
          <EdgeModeButton
            mode="solid"
            active={edgeLineMode === 'solid'}
            label="实线连接"
            onClick={() => setEdgeLineMode('solid')}
          />
          <EdgeModeButton
            mode="animated"
            active={edgeLineMode === 'animated'}
            label="流动虚线连接"
            onClick={() => setEdgeLineMode('animated')}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleSave} disabled={saveWorkflowMutation.isPending}>
          <Save size={14} />
          {saveWorkflowMutation.isPending ? '保存中' : '保存'}
        </Button>
        <Button size="sm" onClick={handleRun} disabled={isRunning}>
          <Play size={14} fill="currentColor" />
          {isRunning ? '运行中' : '运行'}
        </Button>
      </div>
    </header>
  );
}

function WorkflowCanvasInner({
  isSidebarOpen,
  onOpenSidebar,
}: {
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
}) {
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
  const { screenToFlowPosition } = useReactFlow();
  const [showMiniMap, setShowMiniMap] = useState(false);

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
        animated: edgeLineMode === 'animated',
        style: {
          ...(edge.style ?? {}),
          ...edgeStyle,
        },
      })),
    [edgeLineMode, edgeStyle, edges],
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
      const type = event.dataTransfer.getData('application/workflow-node-type') as WorkflowNodeType;
      if (!type) return;

      addNode(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [addNode, screenToFlowPosition],
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
        return node?.data.nodeType !== 'start' && node?.data.nodeType !== 'end';
      });

      onNodesChange(filtered);
    },
    [nodes, onNodesChange],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <WorkflowToolbar isSidebarOpen={isSidebarOpen} onOpenSidebar={onOpenSidebar} />
      <div className="relative flex-1 overflow-hidden" onDrop={handleDrop} onDragOver={handleDragOver}>
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
          fitView
          fitViewOptions={{ padding: 0.25, maxZoom: 0.9 }}
          minZoom={0.25}
          maxZoom={1.6}
          snapToGrid
          snapGrid={[16, 16]}
          deleteKeyCode={['Delete', 'Backspace']}
          multiSelectionKeyCode="Shift"
          selectionKeyCode={null}
          isValidConnection={createConnectionValidator(edges)}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            animated: edgeLineMode === 'animated',
            style: edgeStyle,
          }}
          connectionLineStyle={edgeStyle}
          colorMode={isDark ? 'dark' : 'light'}
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
        {selectedNodeId && <NodeConfigPanel />}
      </div>
    </div>
  );
}

export function WorkflowCanvas({ isSidebarOpen, onOpenSidebar }: WorkflowToolbarProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner isSidebarOpen={isSidebarOpen} onOpenSidebar={onOpenSidebar} />
    </ReactFlowProvider>
  );
}

export { NodeSidebar };
