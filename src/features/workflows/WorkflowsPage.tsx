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

const DEFAULT_AGENT_ID = import.meta.env.VITE_WORKFLOW_AGENT_ID as string | undefined;

export function WorkflowsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const routeAgentId = searchParams.get('id') || undefined;
  const isNewWorkflow = searchParams.get('new') === '1';
  const agentId = routeAgentId ?? (isNewWorkflow ? undefined : DEFAULT_AGENT_ID);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [savedBaseline, setSavedBaseline] = useState<WorkflowBackendPayload | null>(null);
  const [agentName, setAgentName] = useState('工作流演示');
  const [parseError, setParseError] = useState<string | null>(null);
  const [initialViewport, setInitialViewport] = useState<{ x: number; y: number; zoom: number }>();
  const replaceWorkflow = useWorkflowCanvasStore((state) => state.replaceWorkflow);
  const resetToNewWorkflow = useWorkflowCanvasStore((state) => state.resetToNewWorkflow);
  const agentQuery = useWorkflowAgent(agentId);

  useEffect(() => {
    if (!isNewWorkflow) return;
    resetToNewWorkflow();
    setSavedBaseline(null);
    setAgentName('工作流演示');
  }, [isNewWorkflow, resetToNewWorkflow]);

  useEffect(() => {
    if (!agentQuery.data) return;
    try {
      const parsed = parseAgentSetting(agentQuery.data.agentSetting);
      setAgentName(agentQuery.data.agentName || '工作流演示');
      setParseError(null);
      if (!parsed) {
        setSavedBaseline(null);
        return;
      }
      const canvas = parseWorkflowFromBackend(parsed.payload);
      replaceWorkflow(canvas.nodes, canvas.edges);
      setSavedBaseline(serializeWorkflowToBackend(canvas.nodes, canvas.edges));
      setInitialViewport(parsed.viewport);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : '智能体配置格式无效');
    }
  }, [agentQuery.data, replaceWorkflow]);

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
