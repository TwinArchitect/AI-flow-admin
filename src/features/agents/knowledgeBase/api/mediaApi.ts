import { authFetch } from '@/lib/authSession';

function resolveMediaUrl(previewUrl: string) {
  if (/^https?:\/\//i.test(previewUrl)) return previewUrl;
  if (previewUrl.startsWith('/gpt/')) return previewUrl;
  const base = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');
  return `${base}/${previewUrl.replace(/^\//, '')}`;
}

export async function fetchKnowledgeMediaBlob(previewUrl: string) {
  const response = await authFetch(resolveMediaUrl(previewUrl.trim()));
  if (!response.ok) throw new Error(`图片加载失败（HTTP ${response.status}）`);
  return response.blob();
}
