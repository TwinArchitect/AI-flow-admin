import { useMutation } from '@tanstack/react-query';
import {
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
};

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
