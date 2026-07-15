import { useQuery } from '@tanstack/react-query';
import { queryWorkflowModels } from '../api/modelApi';

export const workflowModelKeys = {
  all: ['workflow-models'] as const,
};

export function useWorkflowModels() {
  return useQuery({
    queryKey: workflowModelKeys.all,
    queryFn: queryWorkflowModels,
    select: (page) => page.records.filter(
      (model) => model.status === 0 && ['llm', 'multimodal'].includes(model.type),
    ),
  });
}
