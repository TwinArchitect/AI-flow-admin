import { useAuthStore } from '@/stores/auth';
import { useLayoutStore } from '@/stores/layout';
import { getTokenExpiresAt } from './tokenExpiry';

let redirecting = false;

export function endAuthSession(expectedToken?: string | null) {
  const state = useAuthStore.getState();
  // 旧请求迟到的 401 不得退出后来登录的账号。
  if (expectedToken !== undefined && state.token !== expectedToken) return;
  if (redirecting) return;
  redirecting = true;
  useAuthStore.getState().clear();
  useLayoutStore.getState().resetLayout();
  if (window.location.pathname !== '/login') window.location.replace('/login');
}

export function requireAuthSession() {
  const state = useAuthStore.getState();
  let valid = false;
  try {
    const raw = localStorage.getItem('auth-storage');
    const stored = raw ? JSON.parse(raw)?.state : null;
    const jwtExpiry = state.token ? getTokenExpiresAt(state.token) : null;
    const expired = [jwtExpiry, state.expiresAt].some((time) => typeof time === 'number' && time <= Date.now());
    valid = state.isAuthenticated && typeof state.token === 'string' && Boolean(state.token.trim())
      && stored?.token === state.token && stored?.isAuthenticated === true && !expired;
  } catch {
    // 缺失、损坏或无法读取的会话不可继续访问受保护接口。
  }
  if (!valid) {
    endAuthSession(state.token);
    throw new Error('登录已失效，请重新登录');
  }
  return state;
}

/** 同页清理存储不会触发 storage 事件，因此同时检查定时器和页面恢复。 */
export function watchAuthSession(onSessionChanged: () => void) {
  const check = () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try { requireAuthSession(); } catch { /* 已统一结束会话。 */ }
  };
  const unsubscribe = useAuthStore.subscribe((state, previous) => {
    if (state.isAuthenticated) redirecting = false;
    if (state.token !== previous.token || state.isAuthenticated !== previous.isAuthenticated) {
      onSessionChanged();
    }
  });
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea === localStorage && (event.key === null || event.key === 'auth-storage')) check();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener('focus', check);
  window.addEventListener('pageshow', check);
  document.addEventListener('visibilitychange', check);
  const timer = window.setInterval(check, 1000);
  check();
  return () => {
    unsubscribe();
    window.clearInterval(timer);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('focus', check);
    window.removeEventListener('pageshow', check);
    document.removeEventListener('visibilitychange', check);
  };
}

/** 所有受保护的下载、预览和流式请求共用此入口。 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const { token, tenantId } = requireAuthSession();
  const headers = new Headers(init?.headers);
  headers.set('token', token!);
  headers.set('Authorization', `Bearer ${token}`);
  if (tenantId) headers.set('tenant_id', tenantId);
  const response = await fetch(input, { ...init, headers });
  let unauthorized = response.status === 401;
  if (!unauthorized && response.headers.get('content-type')?.includes('application/json')) {
    const body = await response.clone().json().catch(() => null);
    unauthorized = body?.code === 401;
  }
  if (unauthorized) {
    endAuthSession(token);
    throw new Error('登录已失效，请重新登录');
  }
  return response;
}
