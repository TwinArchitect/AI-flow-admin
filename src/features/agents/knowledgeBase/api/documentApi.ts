import { http } from '@/api/client';
import type {
  DocumentDetail,
  DocumentListItem,
  DocumentProgress,
  DocumentParseSubmit,
  KbPageResult,
  KnowledgeDocument,
} from '../types';

const DOCUMENT_API_BASE = '/gpt/kb/document';

export interface DocumentPageQuery {
  keyword?: string;
  page?: number;
  size?: number;
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

export function stopDocumentParse(documentId: string) {
  return http.post<null>(`${DOCUMENT_API_BASE}/stopParse/${encodeURIComponent(documentId)}`)
    .then((response) => response.data);
}

export function setDocumentAvailability(documentIds: string[], searchEnabled: boolean) {
  return http.post<null>(`${DOCUMENT_API_BASE}/availability`, { documentIds, searchEnabled })
    .then((response) => response.data);
}

export function deleteDocument(documentId: string) {
  return http.delete<null>(`${DOCUMENT_API_BASE}/delete/${encodeURIComponent(documentId)}`)
    .then((response) => response.data);
}

function getDocumentHeaders() {
  const headers = new Headers();
  const raw = localStorage.getItem('auth-storage');
  if (!raw) return headers;
  try {
    const state = (JSON.parse(raw) as { state?: { token?: string; tenantId?: string } }).state;
    if (state?.token) {
      headers.set('token', state.token);
      headers.set('Authorization', `Bearer ${state.token}`);
    }
    if (state?.tenantId) headers.set('tenant_id', state.tenantId);
  } catch {
    // 下载接口沿用未登录请求，由服务端返回明确错误。
  }
  return headers;
}

export async function fetchDocumentBlob(documentId: string) {
  const response = await fetch(
    `${DOCUMENT_API_BASE}/download/${encodeURIComponent(documentId)}`,
    { headers: getDocumentHeaders() },
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
      if (typeof payload.code === 'number') {
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
