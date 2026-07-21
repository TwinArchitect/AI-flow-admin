import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { NodeExecutionState, WorkflowNodeExecutionStates } from '../types/execution';

const WorkflowExecutionContext = createContext<WorkflowNodeExecutionStates>({});

export function WorkflowExecutionProvider({
  value,
  children,
}: {
  value: WorkflowNodeExecutionStates;
  children: ReactNode;
}) {
  return (
    <WorkflowExecutionContext.Provider value={value}>
      {children}
    </WorkflowExecutionContext.Provider>
  );
}

export function useNodeExecution(nodeId: string): NodeExecutionState | undefined {
  return useContext(WorkflowExecutionContext)[nodeId];
}
