import { useState } from 'react';
import '@xyflow/react/dist/style.css';
import './workflow.css';
import { NodeSidebar, WorkflowCanvas } from './components/WorkflowCanvas';

export function WorkflowsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-background">
      <NodeSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="min-w-0 flex-1">
        <WorkflowCanvas
          isSidebarOpen={isSidebarOpen}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
      </main>
    </div>
  );
}
