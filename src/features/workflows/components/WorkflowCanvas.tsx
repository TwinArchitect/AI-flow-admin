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
import type { NodeChange, NodeMouseHandler, NodeTypes } from '@xyflow/react';
import { Copy, Map, Maximize2, PanelLeftOpen, Play, Redo2, Save, Square, Trash2, Undo2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/theme';
import { useDeleteWorkflowAgent, useRunWorkflowStream, useSaveWorkflowConfig } from '../hooks/useWorkflowRuntime';
import { createConnectionValidator } from '../utils/connectionRules';
import { serializeWorkflowToBackend } from '../utils/workflowSerialization';
import { validateWorkflowForBackend } from '../utils/workflowValidation';
import { useWorkflowCanvasStore } from '../store/useWorkflowCanvasStore';
import type { StartNodeConfig, WorkflowBackendPayload, WorkflowCanvasNode, WorkflowNodeType } from '../types';
import type { SaveWorkflowConfigResult } from '../api/workflowApi';
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
  agentId?: string;
  agentName: string;
  savedBaseline: WorkflowBackendPayload | null;
  initialViewport?: { x: number; y: number; zoom: number };
  onSaved: (result: SaveWorkflowConfigResult) => void;
  onDeleted: () => void;
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
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
}: WorkflowToolbarProps) {
  const { fitView, getViewport } = useReactFlow();
  const saveWorkflowMutation = useSaveWorkflowConfig();
  const deleteWorkflowMutation = useDeleteWorkflowAgent();
  const runWorkflowMutation = useRunWorkflowStream();
  const {
    undo,
    redo,
    past,
    future,
    toJSON,
    resetRunState,
    setNodeRunState,
    setNodeRunDetails,
    markUnfinishedNodesSkipped,
    nodes,
    edges,
  } = useWorkflowCanvasStore();
  const isRunning = runWorkflowMutation.isPending;
  const runAbortRef = useRef<AbortController | null>(null);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [runInput, setRunInput] = useState('');
  const [lastRunOutputs, setLastRunOutputs] = useState<Record<string, unknown> | null>(null);
  const activeNode = nodes.find((node) => node.data.runStatus === 'running');
  const completedCount = nodes.filter((node) =>
    node.data.runStatus === 'success' || node.data.runStatus === 'error' || node.data.runStatus === 'skipped'
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

  useEffect(() => () => runAbortRef.current?.abort(), []);
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

  function openRunDialog() {
    const startNode = toJSON().nodes.find((node) => node.data.nodeType === 'start');
    const startConfig = startNode?.data.config as Partial<StartNodeConfig> | undefined;
    setRunInput(startConfig?.sampleInput ?? '');
    setRunDialogOpen(true);
  }

  function handleRun() {
    if (isRunning) return;
    const result = buildValidatedPayload('运行');
    if (!result) return;

    const { nodes, edges, payload } = result;
    const startNode = nodes.find((node) => node.data.nodeType === 'start');
    const userInput = runInput;
    setRunDialogOpen(false);
    setLastRunOutputs(null);
    resetRunState();
    if (startNode) setNodeRunState(startNode.id, 'running', '正在启动工作流');
    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;

    runWorkflowMutation.mutate({
      request: {
        appId: agentId!,
        message: [
          {
            role: 'user',
            content: userInput,
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
      signal: controller.signal,
      onNodeEvent: (event) => {
        setNodeRunState(event.nodeId, event.status, event.message);
        setNodeRunDetails(event.nodeId, {
          runDurationMs: event.durationMs,
          runInputs: event.inputs,
          runOutputs: event.outputs,
        });

        if (event.status === 'success') {
          edges
            .filter((edge) => edge.source === event.nodeId)
            .forEach((edge) => setNodeRunState(edge.target, 'running', '正在执行'));
        }
      },
    }, {
      onSuccess: (runResult) => {
        setLastRunOutputs(runResult.outputs);
        nodes
          .filter((node) => node.data.nodeType === 'end')
          .forEach((node) => {
            setNodeRunState(node.id, 'success', '工作流执行完成');
            setNodeRunDetails(node.id, { runOutputs: runResult.outputs });
          });
        console.log('工作流运行结果:', JSON.stringify(runResult, null, 2));
        toast.success('工作流运行完成', { description: '最终结果已生成。' });
      },
      onError: (error) => {
        markUnfinishedNodesSkipped(error instanceof DOMException && error.name === 'AbortError' ? '用户停止运行' : undefined);
        if (error instanceof DOMException && error.name === 'AbortError') {
          toast.info('工作流运行已停止');
        } else {
          toast.error('工作流运行失败', {
            description: error instanceof Error ? error.message : '未知错误',
          });
        }
      },
      onSettled: () => {
        runAbortRef.current = null;
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
        {isRunning ? (
          <Button variant="destructive" size="sm" onClick={() => runAbortRef.current?.abort()}>
            <Square size={13} fill="currentColor" />
            停止
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button size="sm" onClick={openRunDialog} disabled={Boolean(runDisabledReason)}>
                  <Play size={14} fill="currentColor" />
                  运行
                </Button>
              </span>
            </TooltipTrigger>
            {runDisabledReason && <TooltipContent>{runDisabledReason}</TooltipContent>}
          </Tooltip>
        )}
        {lastRunOutputs && !isRunning && (
          <Button variant="outline" size="sm" onClick={() => setResultDialogOpen(true)}>
            查看结果
          </Button>
        )}
      </div>
      <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>调试运行</DialogTitle>
            <DialogDescription>输入本次工作流的用户问题。</DialogDescription>
          </DialogHeader>
          <Textarea
            value={runInput}
            onChange={(event) => setRunInput(event.target.value)}
            placeholder="请输入用户问题"
            className="min-h-32"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunDialogOpen(false)}>取消</Button>
            <Button onClick={handleRun} disabled={!runInput.trim()}>
              <Play size={14} fill="currentColor" />
              开始运行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>工作流运行结果</DialogTitle>
            <DialogDescription>本次 Start -&gt; LLM -&gt; End 的最终输出。</DialogDescription>
          </DialogHeader>
          <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm text-foreground">
            {typeof lastRunOutputs?.answer === 'string'
              ? lastRunOutputs.answer
              : JSON.stringify(lastRunOutputs, null, 2)}
          </pre>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(
                  typeof lastRunOutputs?.answer === 'string'
                    ? lastRunOutputs.answer
                    : JSON.stringify(lastRunOutputs, null, 2),
                );
                toast.success('结果已复制');
              }}
            >
              <Copy size={14} />
              复制
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        animated:
          nodes.some((node) => node.data.runStatus === 'running')
            ? nodes.find((node) => node.id === edge.source)?.data.runStatus === 'success'
              && nodes.find((node) => node.id === edge.target)?.data.runStatus === 'running'
            : edgeLineMode === 'animated',
        style: {
          ...(edge.style ?? {}),
          ...edgeStyle,
        },
      })),
    [edgeLineMode, edgeStyle, edges, nodes],
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
      <WorkflowToolbar
        agentId={agentId}
        agentName={agentName}
        savedBaseline={savedBaseline}
        initialViewport={initialViewport}
        onSaved={onSaved}
        onDeleted={onDeleted}
        isSidebarOpen={isSidebarOpen}
        onOpenSidebar={onOpenSidebar}
      />
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
          fitView={!initialViewport}
          defaultViewport={initialViewport}
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

export function WorkflowCanvas(props: WorkflowToolbarProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

export { NodeSidebar };
