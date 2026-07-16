import { useMutation, useQuery } from '@tanstack/react-query';
import {
  deleteWorkflowAgent,
  getWorkflowAgent,
  saveWorkflowConfig,
  type SaveWorkflowConfigRequest,
} from '../api/workflowApi';
import {
  runWorkflowStream,
  type RunWorkflowStreamRequest,
} from '../api/workflowRunApi';

export const workflowRuntimeKeys = {
  all: ['workflow-runtime'] as const,
  save: () => [...workflowRuntimeKeys.all, 'save'] as const,
  run: () => [...workflowRuntimeKeys.all, 'run'] as const,
  agent: (agentId: string) => [...workflowRuntimeKeys.all, 'agent', agentId] as const,
  delete: () => [...workflowRuntimeKeys.all, 'delete'] as const,
};

export function useWorkflowAgent(agentId?: string) {
  return useQuery({
    queryKey: workflowRuntimeKeys.agent(agentId ?? ''),
    queryFn: () => getWorkflowAgent(agentId!),
    enabled: Boolean(agentId),
  });
}

export function useDeleteWorkflowAgent() {
  return useMutation({
    mutationKey: workflowRuntimeKeys.delete(),
    mutationFn: deleteWorkflowAgent,
  });
}

export function useSaveWorkflowConfig() {
  return useMutation({
    mutationKey: workflowRuntimeKeys.save(),
    mutationFn: (request: SaveWorkflowConfigRequest) => saveWorkflowConfig(request),
  });
}

export function useRunWorkflowStream() {
  return useMutation({
    mutationKey: workflowRuntimeKeys.run(),
    mutationFn: (request: RunWorkflowStreamRequest) => runWorkflowStream(request),
  });
}
