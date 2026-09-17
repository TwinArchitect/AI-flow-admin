import { http } from '@/api/client';
import type {
  DatasetListItem,
  DatasetPageQuery,
  DatasetStats,
  KbPageResult,
  KnowledgeDataset,
} from '../types';

const DATASET_API_BASE = '/gpt/kb/dataset';

export function queryDatasets(params: DatasetPageQuery) {
  return http.post<KbPageResult<DatasetListItem>>(`${DATASET_API_BASE}/page`, {
    page: params.page ?? 1,
    size: params.size ?? 20,
    name: params.name?.trim() || undefined,
    treeId: params.treeId || undefined,
    status: params.status || undefined,
  }).then((response) => response.data);
}

export function getDataset(datasetId: string) {
  return http.get<KnowledgeDataset>(`${DATASET_API_BASE}/get/${encodeURIComponent(datasetId)}`)
    .then((response) => response.data);
}

export function getDatasetStats(datasetId: string) {
  return http.get<DatasetStats>(`${DATASET_API_BASE}/stats/${encodeURIComponent(datasetId)}`)
    .then((response) => response.data);
}

export function saveDataset(payload: Partial<KnowledgeDataset>) {
  return http.post<KnowledgeDataset>(`${DATASET_API_BASE}/save`, payload)
    .then((response) => response.data);
}

export function deleteDataset(datasetId: string) {
  return http.delete<null>(`${DATASET_API_BASE}/delete/${encodeURIComponent(datasetId)}`)
    .then((response) => response.data);
}
