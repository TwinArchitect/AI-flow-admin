import { useAuthStore } from '@/stores/auth';

export function applyEmbedAuthFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const token = (params.get('token') || params.get('access_token') || '').trim();
  if (!token) return { ok: false as const, message: '缺少 token 参数，请先登录获取 Token 后拼到 iframe 地址' };
  const tenantId = (params.get('tenantId') || params.get('tenant_id') || '').trim();
  // 在挂载助手之前完成鉴权初始化，确保首轮请求携带 Token。
  useAuthStore.getState().setToken(token, '', tenantId || undefined);
  const flag = (...keys: string[]) => keys.some((key) => ['1', 'true', 'yes', 'on'].includes((params.get(key) || '').toLowerCase()));
  const mode = (params.get('mode') || params.get('view') || params.get('display') || '').toLowerCase();
  return {
    ok: true as const,
    appId: (params.get('appId') || params.get('app_id') || params.get('agentId') || params.get('agent_id') || '').trim() || null,
    openPage: ['page', 'chat', 'open', 'full'].includes(mode) || flag('page', 'openPage', 'open_page'),
    captureEnabled: flag('capture', 'camera'), capturePreview: flag('capturePreview', 'capture_preview'),
  };
}
