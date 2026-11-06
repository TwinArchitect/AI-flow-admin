import { Link, Navigate, Outlet, useLocation, useMatches } from 'react-router-dom';
import { Construction, FileQuestion, ShieldX } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { isComponentExample, menuPaths, normalizePath, routeOutcome } from '@/features/permissions/routes';
import { Button } from '@/components/ui/button';

type Status = 'developing' | 'forbidden' | 'not-found';
export function RouteStatusPage({ status }: { status: Status }) {
  const config = {
    developing: { code: '', title: '功能正在开发，敬请期待', icon: Construction },
    forbidden: { code: '403', title: '您暂时无权访问该界面', icon: ShieldX },
    'not-found': { code: '404', title: '页面不存在', icon: FileQuestion },
  }[status];
  const Icon = config.icon;
  return <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center" aria-label={config.title}>
    <Icon size={40} className="text-muted-foreground" />
    {config.code && <p className="text-5xl font-semibold text-muted-foreground">{config.code}</p>}
    <h1 className="text-lg font-semibold">{config.title}</h1>
    <Button variant="outline" asChild><Link to="/">返回工作台</Link></Button>
  </section>;
}
export function RouteAccess() {
  const location = useLocation();
  const matches = useMatches();
  const menus = useAuthStore(state => state.menus);
  const path = normalizePath(location.pathname);
  if (path !== location.pathname) return <Navigate to={`${path}${location.search}${location.hash}`} replace />;
  if (!import.meta.env.DEV && isComponentExample(path)) return <RouteStatusPage status="not-found" />;
  const implemented = !matches.some(match => (match.handle as { unimplemented?: boolean } | undefined)?.unimplemented);
  const outcome = routeOutcome(path, menuPaths(menus ?? []), implemented);
  return outcome === 'allowed' ? <Outlet /> : <RouteStatusPage status={outcome} />;
}
