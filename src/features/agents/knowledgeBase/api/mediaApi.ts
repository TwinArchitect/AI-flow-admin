function getKnowledgeMediaHeaders() {
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
    // 由服务端返回明确的鉴权错误。
  }
  return headers;
}

function resolveMediaUrl(previewUrl: string) {
  if (/^https?:\/\//i.test(previewUrl)) return previewUrl;
  if (previewUrl.startsWith('/gpt/')) return previewUrl;
  const base = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');
  return `${base}/${previewUrl.replace(/^\//, '')}`;
}

export async function fetchKnowledgeMediaBlob(previewUrl: string) {
  const response = await fetch(resolveMediaUrl(previewUrl.trim()), {
    headers: getKnowledgeMediaHeaders(),
  });
  if (!response.ok) throw new Error(`图片加载失败（HTTP ${response.status}）`);
  return response.blob();
}
