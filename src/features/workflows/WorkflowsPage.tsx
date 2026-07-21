import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import './workflow.css';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkflowAgent } from './hooks/useWorkflowRuntime';
import { parseAgentSetting } from './api/workflowApi';
import { useWorkflowCanvasStore } from './store/useWorkflowCanvasStore';
import type { WorkflowBackendPayload } from './types';
import { parseWorkflowFromBackend, serializeWorkflowToBackend } from './utils/workflowSerialization';
import { NodeSidebar, WorkflowCanvas } from './components/WorkflowCanvas';

export function WorkflowsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const routeAgentId = searchParams.get('id') || undefined;
  const agentId = routeAgentId;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [savedBaseline, setSavedBaseline] = useState<WorkflowBackendPayload | null>(null);
  const [agentName, setAgentName] = useState('工作流演示');
  const [parseError, setParseError] = useState<string | null>(null);
  const [initialViewport, setInitialViewport] = useState<{ x: number; y: number; zoom: number }>();
  const [loadedAgentId, setLoadedAgentId] = useState<string>();
  const replaceWorkflow = useWorkflowCanvasStore((state) => state.replaceWorkflow);
  const resetToNewWorkflow = useWorkflowCanvasStore((state) => state.resetToNewWorkflow);
  const agentQuery = useWorkflowAgent(agentId);

  useEffect(() => {
    if (agentId) return;
    resetToNewWorkflow();
    setSavedBaseline(null);
    setInitialViewport(undefined);
    setLoadedAgentId(undefined);
    setAgentName('工作流演示');
  }, [agentId, resetToNewWorkflow]);

  useEffect(() => {
    if (!agentQuery.data) return;
    try {
      const parsed = parseAgentSetting(agentQuery.data.agentSetting);
      setAgentName(agentQuery.data.agentName || '工作流演示');
      setParseError(null);
      if (!parsed) {
        resetToNewWorkflow();
        setSavedBaseline(null);
        setInitialViewport(undefined);
        setLoadedAgentId(agentId);
        return;
      }
      const canvas = parseWorkflowFromBackend(parsed.payload);
      const normalizedPayload = serializeWorkflowToBackend(canvas.nodes, canvas.edges);
      const hasUnsupportedContent =
        canvas.nodes.length !== parsed.payload.modules.length
        || canvas.edges.length !== parsed.payload.edges.length;
      replaceWorkflow(canvas.nodes, canvas.edges);
      setSavedBaseline(hasUnsupportedContent ? null : normalizedPayload);
      setInitialViewport(parsed.viewport);
      setLoadedAgentId(agentId);
    } catch (error) {
      setLoadedAgentId(undefined);
      setParseError(error instanceof Error ? error.message : '智能体配置格式无效');
    }
  }, [agentId, agentQuery.data, replaceWorkflow, resetToNewWorkflow]);

  if (agentId && agentQuery.isLoading) {
    return <div className="flex h-full gap-4 p-5"><Skeleton className="w-64" /><Skeleton className="flex-1" /></div>;
  }

  if (agentId && (agentQuery.isError || parseError)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background text-center">
        <p className="text-sm font-medium text-foreground">智能体配置加载失败</p>
        <p className="max-w-lg text-xs text-muted-foreground">{parseError || agentQuery.error?.message}</p>
        <Button variant="outline" size="sm" onClick={() => void agentQuery.refetch()}>重试</Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-background">
      <NodeSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="h-full min-h-0 min-w-0 flex-1">
        <WorkflowCanvas
          agentId={agentId}
          agentName={agentName}
          savedBaseline={savedBaseline}
          initialViewport={initialViewport}
          loadedAgentId={loadedAgentId}
          onSaved={(saved) => {
            setSavedBaseline(saved.payload);
            setInitialViewport(saved.viewport);
            setAgentName(saved.agentName);
            if (saved.agentId !== routeAgentId) {
              setSearchParams({ id: saved.agentId }, { replace: true });
            }
          }}
          onDeleted={() => {
            setSavedBaseline(null);
            resetToNewWorkflow();
            setSearchParams({ new: '1' }, { replace: true });
          }}
          isSidebarOpen={isSidebarOpen}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
      </main>
    </div>
  );
}
