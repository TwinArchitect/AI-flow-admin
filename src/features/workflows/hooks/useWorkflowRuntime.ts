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
import { uploadWorkflowDebugFile } from '../api/workflowDebugApi';

export const workflowRuntimeKeys = {
  all: ['workflow-runtime'] as const,
  save: () => [...workflowRuntimeKeys.all, 'save'] as const,
  run: () => [...workflowRuntimeKeys.all, 'run'] as const,
  agent: (agentId: string) => [...workflowRuntimeKeys.all, 'agent', agentId] as const,
  delete: () => [...workflowRuntimeKeys.all, 'delete'] as const,
  upload: () => [...workflowRuntimeKeys.all, 'upload'] as const,
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
    meta: { silentError: true },
  });
}

export function useSaveWorkflowConfig() {
  return useMutation({
    mutationKey: workflowRuntimeKeys.save(),
    mutationFn: (request: SaveWorkflowConfigRequest) => saveWorkflowConfig(request),
    meta: { silentError: true },
  });
}

export function useRunWorkflowStream() {
  return useMutation({
    mutationKey: workflowRuntimeKeys.run(),
    mutationFn: (request: RunWorkflowStreamRequest) => runWorkflowStream(request),
    meta: { silentError: true },
  });
}

export function useUploadWorkflowDebugFile() {
  return useMutation({
    mutationKey: workflowRuntimeKeys.upload(),
    mutationFn: ({ file, voucherId }: { file: File; voucherId: string }) =>
      uploadWorkflowDebugFile(file, voucherId),
    meta: { silentError: true },
  });
}
