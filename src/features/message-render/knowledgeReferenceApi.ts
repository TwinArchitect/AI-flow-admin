import { useAuthStore } from '@/stores/auth';
import type { KnowledgeReferenceSource } from './knowledgeReference';

function authHeaders() {
  const { token, tenantId } = useAuthStore.getState();
  const headers = new Headers();
  if (token) {
    headers.set('token', token);
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (tenantId) headers.set('tenant_id', tenantId);
  return headers;
}

async function fetchBlob(url: string, message: string) {
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) throw new Error(`${message} HTTP ${response.status}`);
  return response.blob();
}

export function fetchKnowledgeImage(url: string) {
  return fetchBlob(url, '图片加载失败');
}

function sourceExtension(source: KnowledgeReferenceSource) {
  return (source.fileExtension || source.docName.split('.').pop() || '').replace(/^\./, '').toLowerCase();
}

export function fetchKnowledgeDocumentPreview(source: KnowledgeReferenceSource) {
  const officeExtensions = new Set(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']);
  const endpoint = officeExtensions.has(sourceExtension(source))
    ? `/gpt/kb/document/preview/${source.docId}?target=pdf`
    : `/gpt/kb/document/download/${source.docId}`;
  return fetchBlob(endpoint, '文档预览失败');
}

export async function downloadKnowledgeDocument(source: KnowledgeReferenceSource) {
  const blob = await fetchBlob(`/gpt/kb/document/download/${source.docId}`, '文档下载失败');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = source.docName;
  anchor.click();
  URL.revokeObjectURL(url);
}
