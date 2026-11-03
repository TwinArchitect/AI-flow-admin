import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { http } from '@/api/client';
import { canAccess, isComponentExample, menuPaths, prepareMenus } from '@/features/permissions/routes';
import { Button } from '@/components/ui/button';

export function PrivateRoute() {
  const { isAuthenticated, token, menus, user } = useAuthStore();
  const location = useLocation();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!isAuthenticated || !token || menus !== null) return;
    let cancelled = false;
    setError('');
    http.get<unknown>(user?.isPlatformAdmin ? '/gpt/auth/menu/query/super' : '/gpt/auth/menu/query')
      .then(({ data }) => {
        if (!cancelled && useAuthStore.getState().token === token) useAuthStore.getState().setMenus(prepareMenus(data));
      })
      .catch((reason: unknown) => {
        if (!cancelled && useAuthStore.getState().token === token) setError(reason instanceof Error ? reason.message : '菜单加载失败');
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, token, menus, user?.isPlatformAdmin, retry]);
  if (!isAuthenticated || !token) return <Navigate to="/login" replace />;
  if (isComponentExample(location.pathname)) return <Outlet />;
  if (menus === null) return <div className="flex h-screen flex-col items-center justify-center gap-3"><p>{error || '加载账号菜单中…'}</p>{error && <Button onClick={() => setRetry(value => value + 1)}>重新加载</Button>}</div>;
  const paths = menuPaths(menus);
  if (!paths.size) return <div className="flex h-screen flex-col items-center justify-center gap-4"><p>当前账号未分配可用页面权限，请联系管理员</p><Button onClick={() => { useAuthStore.getState().clear(); window.location.replace('/login'); }}>返回登录</Button></div>;
  if (!canAccess(location.pathname, paths)) return <Navigate to={paths.values().next().value || '/'} replace />;
  return <Outlet />;
}
