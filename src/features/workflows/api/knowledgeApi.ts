import { http } from '@/api/client';

export interface WorkflowDataset {
  id: string;
  name: string;
  status?: string;
  documentCount?: number;
}

interface DatasetPage {
  records?: WorkflowDataset[];
}

export interface WorkflowRerankModel {
  id: string;
  name?: string;
  model?: string;
  status?: number;
}

export function queryWorkflowDatasets(keyword = '') {
  return http.post<DatasetPage>('/gpt/kb/dataset/page', {
    page: 1,
    size: 50,
    name: keyword.trim() || undefined,
    status: 'ACTIVE',
  }).then((response) => response.data.records ?? []);
}

export function queryWorkflowRerankModels() {
  return http.get<WorkflowRerankModel[]>('/gpt/base/model/list', {
    params: { category: 'rerank', status: 0 },
  }).then((response) => response.data ?? []);
}
