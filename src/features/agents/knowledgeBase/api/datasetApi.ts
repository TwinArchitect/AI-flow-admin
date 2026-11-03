import { http } from '@/api/client';
import { authFetch } from '@/lib/authSession';
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
  return http.post<null>(`${DATASET_API_BASE}/delete/${encodeURIComponent(datasetId)}`)
    .then((response) => response.data);
}

export interface ArchivePreview {
  sha256: string;
  sourceName: string;
  sourceModel?: string;
  sourceDimension?: number;
  targetModel: string;
  targetDimension: number;
  documentCount: number;
  chunkCount: number;
  originalFileCount: number;
  warnings: string[];
  documentNames: string[];
}
export interface ArchiveImportResult { documentIds: string[]; taskIds: string[]; chunkCount: number }

async function uploadArchive<T>(path: string, body: FormData): Promise<T> {
  const response = await authFetch(path, { method: 'POST', body });
  const value = await response.json();
  if (!response.ok || (value.code !== 0 && value.code !== 200)) throw new Error(value.message || '内容包操作失败');
  return value.data as T;
}

export function previewDatasetImport(id: string, file: File) {
  const body = new FormData(); body.append('file', file);
  return uploadArchive<ArchivePreview>(`${DATASET_API_BASE}/${encodeURIComponent(id)}/import/preview`, body);
}

export function importDatasetArchive(id: string, file: File, preview: ArchivePreview) {
  const body = new FormData(); body.append('file', file);
  body.append('sha256', preview.sha256); body.append('targetModel', preview.targetModel); body.append('targetDimension', String(preview.targetDimension));
  return uploadArchive<ArchiveImportResult>(`${DATASET_API_BASE}/${encodeURIComponent(id)}/import`, body);
}

export async function exportDatasetArchive(id: string, name: string, includeOriginals: boolean) {
  const response = await authFetch(`${DATASET_API_BASE}/${encodeURIComponent(id)}/export?includeOriginals=${includeOriginals}`);
  if (!response.ok || !response.headers.get('content-type')?.toLowerCase().includes('application/zip')) {
    const raw = await response.text();
    let message = raw.slice(0, 200) || '导出失败';
    try { message = JSON.parse(raw).message || message; } catch { /* 非 JSON 错误保留可读文本。 */ }
    throw new Error(message);
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a'); link.href = url;
  link.download = `${name.replace(/[\\/:*?"<>|]/g, '_') || 'knowledge'}.zip`;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
