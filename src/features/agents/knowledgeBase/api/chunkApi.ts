import { http } from '@/api/client';
import type { ChunkQuery, ChunkUpdate, KbPageResult, KnowledgeChunk } from '../types';

const CHUNK_API_BASE = '/gpt/kb/chunk';

export function queryChunks(params: ChunkQuery) {
  return http.post<KbPageResult<KnowledgeChunk>>(`${CHUNK_API_BASE}/query`, {
    datasetId: params.datasetId,
    documentId: params.documentId || undefined,
    documentIds: params.documentIds?.length ? params.documentIds : undefined,
    keyword: params.keyword?.trim() || undefined,
    tag: params.tag?.trim() || undefined,
    tags: params.tags?.length ? params.tags : undefined,
    available: params.available,
    page: params.page ?? 1,
    size: params.size ?? 20,
  }).then((response) => response.data);
}

export function queryDocumentChunks(documentId: string, page = 1, size = 20) {
  return http.get<KbPageResult<KnowledgeChunk>>(
    `${CHUNK_API_BASE}/page/${encodeURIComponent(documentId)}`,
    { params: { page, size } },
  ).then((response) => response.data);
}

export function addChunk(payload: {
  datasetId: string;
  documentId: string;
  content: string;
  chunkIndex?: number;
  pageStart?: number;
  pageEnd?: number;
  available?: boolean;
}) {
  return http.post<KnowledgeChunk>(`${CHUNK_API_BASE}/add`, payload)
    .then((response) => response.data);
}

export function updateChunk(chunkId: string, payload: ChunkUpdate) {
  return http.post<KnowledgeChunk>(`${CHUNK_API_BASE}/update/${encodeURIComponent(chunkId)}`, payload)
    .then((response) => response.data);
}

export function deleteChunks(chunkIds: string[]) {
  return http.post<null>(`${CHUNK_API_BASE}/delete`, { chunkIds })
    .then((response) => response.data);
}

export function setChunkAvailability(chunkIds: string[], available: boolean) {
  return http.post<null>(`${CHUNK_API_BASE}/availability`, { chunkIds, available })
    .then((response) => response.data);
}
