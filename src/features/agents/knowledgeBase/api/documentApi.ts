import { http } from '@/api/client';
import { authFetch } from '@/lib/authSession';
import { isParseSubmitSkipped } from '../kbContracts';
import { normalizeDocumentElementList } from '../mediaNormalization';
import type {
  DocumentDetail,
  DocumentEnrichment,
  DocumentEnrichmentUpdate,
  DocumentListItem,
  DocumentProgress,
  DocumentParseSubmit,
  KbPageResult,
  KnowledgeDocument,
} from '../types';

const DOCUMENT_API_BASE = '/gpt/kb/document';

export interface DocumentPageQuery {
  keyword?: string;
  tag?: string;
  page?: number;
  size?: number;
}

export function queryDocumentEnrichmentPage(datasetId: string, params: DocumentPageQuery = {}) {
  return http.get<KbPageResult<DocumentListItem>>(`${DOCUMENT_API_BASE}/enrichment/page/${encodeURIComponent(datasetId)}`, {
    params: { keyword: params.keyword?.trim() || undefined, tag: params.tag?.trim() || undefined, page: params.page ?? 1, size: params.size ?? 20 },
  }).then((response) => response.data);
}

export function listDocumentEnrichmentTags(datasetId: string) {
  return http.get<string[]>(`${DOCUMENT_API_BASE}/enrichment/tags/${encodeURIComponent(datasetId)}`, { params: { limit: 200 } }).then((response) => response.data ?? []);
}

export function getDocumentEnrichment(id: string) {
  return http.get<DocumentEnrichment>(`${DOCUMENT_API_BASE}/enrichment/${encodeURIComponent(id)}`).then((response) => response.data);
}

export function updateDocumentEnrichment(id: string, payload: DocumentEnrichmentUpdate) {
  return http.put<DocumentEnrichment>(`${DOCUMENT_API_BASE}/enrichment/${encodeURIComponent(id)}`, payload).then((response) => response.data);
}

export function regenerateDocumentEnrichment(id: string) {
  return http.post<DocumentEnrichment | null>(`${DOCUMENT_API_BASE}/enrichment/${encodeURIComponent(id)}/regenerate`).then((response) => response.data);
}

export function restoreDocumentEnrichmentAi(id: string) {
  return http.post<DocumentEnrichment | null>(`${DOCUMENT_API_BASE}/enrichment/${encodeURIComponent(id)}/restore-ai`).then((response) => response.data);
}

export function queryDocuments(datasetId: string, params: DocumentPageQuery = {}) {
  return http.get<KbPageResult<DocumentListItem>>(
    `${DOCUMENT_API_BASE}/page/${encodeURIComponent(datasetId)}`,
    {
      params: {
        keyword: params.keyword?.trim() || undefined,
        page: params.page ?? 1,
        size: params.size ?? 20,
      },
    },
  ).then((response) => response.data);
}

export function getDocument(documentId: string) {
  return http.get<DocumentDetail>(`${DOCUMENT_API_BASE}/get/${encodeURIComponent(documentId)}`)
    .then((response) => response.data);
}

export async function listDocumentImages(documentId: string) {
  const response = await http.get<unknown>(`${DOCUMENT_API_BASE}/images/${encodeURIComponent(documentId)}`);
  return normalizeDocumentElementList(response.data);
}

export async function listDocumentElements(documentId: string) {
  try {
    const response = await http.get<unknown>(`${DOCUMENT_API_BASE}/elements/${encodeURIComponent(documentId)}`);
    return normalizeDocumentElementList(response.data);
  } catch { return listDocumentImages(documentId); }
}

export function getDocumentProgress(documentId: string) {
  return http.get<DocumentProgress>(`${DOCUMENT_API_BASE}/progress/${encodeURIComponent(documentId)}`)
    .then((response) => response.data);
}

export function uploadDocument(datasetId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return http.post<KnowledgeDocument>(
    `${DOCUMENT_API_BASE}/upload/${encodeURIComponent(datasetId)}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  ).then((response) => response.data);
}

export interface DocumentUploadBatchResult {
  succeeded: KnowledgeDocument[];
  failed: Array<{ fileName: string; message: string }>;
}

export async function uploadDocumentsBatch(
  datasetId: string,
  files: File[],
  onProgress?: (done: number, total: number, fileName: string) => void,
): Promise<DocumentUploadBatchResult> {
  const succeeded: KnowledgeDocument[] = [];
  const failed: DocumentUploadBatchResult['failed'] = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    onProgress?.(index, files.length, file.name);
    try {
      succeeded.push(await uploadDocument(datasetId, file));
    } catch (error) {
      failed.push({ fileName: file.name, message: error instanceof Error ? error.message : '上传失败' });
    }
  }
  onProgress?.(files.length, files.length, '');
  return { succeeded, failed };
}

export function parseDocument(documentId: string, force = false) {
  return http.post<DocumentParseSubmit>(
    `${DOCUMENT_API_BASE}/parse/${encodeURIComponent(documentId)}`,
    undefined,
    { params: force ? { force: true } : undefined },
  ).then((response) => response.data);
}

/** 旧服务可返回 null；已完成文档的增量提交需用进度确认是否跳过。 */
export async function submitDocumentParse(documentId: string, status: string, force: boolean) {
  const result = await parseDocument(documentId, force);
  let skipped = isParseSubmitSkipped(result);
  if (!skipped && status === 'READY' && !force) {
    skipped = (await getDocumentProgress(documentId)).status === 'READY';
  }
  return { result, skipped };
}

export function stopDocumentParse(documentId: string) {
  return http.post<null>(`${DOCUMENT_API_BASE}/stopParse/${encodeURIComponent(documentId)}`)
    .then((response) => response.data);
}

export function setDocumentAvailability(documentIds: string[], searchEnabled: boolean) {
  return http.post<null>(`${DOCUMENT_API_BASE}/availability`, { documentIds, searchEnabled })
    .then((response) => response.data);
}

export function deleteDocument(documentId: string) {
  return http.post<null>(`${DOCUMENT_API_BASE}/delete/${encodeURIComponent(documentId)}`)
    .then((response) => response.data);
}

export async function fetchDocumentBlob(documentId: string) {
  const response = await authFetch(
    `${DOCUMENT_API_BASE}/download/${encodeURIComponent(documentId)}`,
  );
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (response.ok && !contentType.includes('application/json')) return response.blob();

  const message = await response.text().catch(() => '');
  if (message.trim()) {
    try {
      const payload = JSON.parse(message) as {
        code?: number;
        message?: string | null;
        data?: {
          errorMessage?: string;
          taskError?: string;
          '错误信息'?: string;
        } | null;
      };
      if (typeof payload.code === 'number' || payload.message || payload.data?.errorMessage || payload.data?.taskError || payload.data?.['错误信息']) {
        throw new Error(
          payload.data?.errorMessage
            || payload.data?.taskError
            || payload.data?.['错误信息']
            || payload.message
            || `获取文档失败（业务码 ${payload.code}）`,
        );
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
  }
  throw new Error(message.trim().slice(0, 200) || `获取文档失败（HTTP ${response.status}）`);
}

export async function downloadDocument(documentId: string, fileName: string) {
  const blob = await fetchDocumentBlob(documentId);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
