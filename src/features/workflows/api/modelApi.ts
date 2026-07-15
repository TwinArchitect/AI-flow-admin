import { http } from '@/api/client';
import type { LlmModelValue } from '../types';

export interface WorkflowModel extends LlmModelValue {
  name?: string;
  status?: number;
}

interface WorkflowModelPage {
  records: WorkflowModel[];
}

export function queryWorkflowModels() {
  return http.post<WorkflowModelPage>('/gpt/base/model/query', {
    pageNum: 1,
    pageSize: 200,
  }).then((response) => response.data);
}
