import { useAuthStore } from '@/stores/auth';
import { canAccess, isComponentExample, menuPaths, menuTitle } from '@/features/permissions/routes';
import { useEffect, useRef } from 'react';
import { ArrowLeft, X, Home, Users, Box, BookOpen, Workflow, MessageSquare, FileText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { useLayoutStore } from '@/stores/layout';

const routeTitles: Record<string, string> = {
  '/': '工作台',
  '/agents': '智能体',
  '/agents/AgentPlaza': '智能体广场',
  '/agents/overview': '智能体助手',
  '/agents/myAgents': '我的智能体',
  '/agents/orchestration': '对话式智能体编排',
  '/agents/knowledge': '知识库',
  '/agents/knowledge/settings': '知识库 · 模型配置',
  '/agents/knowledge/api-doc': '知识库开放 API 文档',
  '/agents/tags': '标签维护',
  '/agents/audit': '智能体审核',
  '/agents/AgentPlaza/chat': '智能体会话',
  '/agents/models': '模型管理',
  '/agents/memory': '记忆维护',
  '/agents/httpTools': 'HTTP 工具',
  '/agents/mcpTools': 'MCP 工具',
  '/agents/mobile-overview': '移动端',
  '/workflows': '工作流编排',
  '/users': '用户管理',
  '/settings': '系统设置',
  '/components': '组件示例',
};

const routeIcons: Record<string, React.ElementType> = {
  '/': Home, '/agents/myAgents': Users, '/agents/models': Box,
  '/agents/knowledge': BookOpen, '/agents/overview': MessageSquare, '/workflows': Workflow,
};

const componentTitles: Record<string, string> = {
  button: 'Button', card: 'Card', dialog: 'Dialog', form: 'Form', input: 'Input',
  select: 'Select', table: 'Table', tabs: 'Tabs', accordion: 'Accordion', alert: 'Alert',
  badge: 'Badge', avatar: 'Avatar', toast: 'Toast', checkbox: 'Checkbox', switch: 'Switch',
  'radio-group': 'Radio', textarea: 'Textarea', progress: 'Progress', skeleton: 'Skeleton',
  slider: 'Slider', 'dropdown-menu': 'Dropdown', popover: 'Popover', tooltip: 'Tooltip',
  sheet: 'Sheet', separator: 'Separator', calendar: 'Calendar', command: 'Command',
  'date-picker': 'Date Picker', 'multi-select': 'Multi Select', 'time-picker': 'Time Picker',
  'react-query': 'React Query',
};

const tablessRoutePaths = new Set(['/agents', '/components', '/agents/traffic', '/agents/channels']);

function isTablessRoute(path: string) {
  return (!import.meta.env.DEV && isComponentExample(path)) || tablessRoutePaths.has(path.split(/[?#]/, 1)[0]);
}

export function resolveRouteTitle(pathname: string) {
  const dynamicTitle = menuTitle(pathname, useAuthStore.getState().menus ?? []);
  if (dynamicTitle) return dynamicTitle;
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (pathname.startsWith('/components/')) {
    const segment = pathname.split('/').filter(Boolean).at(-1) ?? '';
    return `组件 · ${componentTitles[segment] ?? segment}`;
  }
  return pathname.split('/').filter(Boolean).at(-1) || '页面';
}

interface RouteTabsProps {
  showBack: boolean;
}

export function RouteTabs({ showBack }: RouteTabsProps) {
  const location = useLocation();
  const tabsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const {
    routeTabs,
    openRouteTab,
    closeRouteTab,
    closeAllRouteTabs,
    closeOtherRouteTabs,
    closeRouteTabsLeft,
    closeRouteTabsRight,
    setActiveTabPath,
  } = useLayoutStore();
  const currentPath = `${location.pathname}${location.search}${location.hash}`;
  const menus = useAuthStore(state => state.menus);
  const allowedPaths = menuPaths(menus ?? []);
  const visibleRouteTabs = routeTabs.filter((tab) => !isTablessRoute(tab.path) && canAccess(tab.path, allowedPaths));

  useEffect(() => {
    useLayoutStore.getState().routeTabs
      .filter((tab) => isTablessRoute(tab.path))
      .forEach((tab) => closeRouteTab(tab.path));
  }, [closeRouteTab]);

  useEffect(() => {
    if (isTablessRoute(location.pathname)) return;
    openRouteTab({ path: currentPath, title: resolveRouteTitle(location.pathname) });
  }, [currentPath, location.pathname, openRouteTab]);

  useEffect(() => {
    tabsRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [currentPath, visibleRouteTabs.length]);

  const closeTab = (path: string) => {
    const index = visibleRouteTabs.findIndex((tab) => tab.path === path);
    const fallback = visibleRouteTabs[index - 1] ?? visibleRouteTabs[index + 1];
    closeRouteTab(path);
    if (path === currentPath) navigate(fallback?.path ?? '/');
  };

  const changeTab = (path: string) => {
    setActiveTabPath(path);
    navigate(path);
  };

  const closeAllTabs = () => {
    closeAllRouteTabs();
    navigate('/');
  };

  const renderTab = (tab: (typeof visibleRouteTabs)[number]) => {
    const active = tab.path === currentPath;
    const TabIcon = routeIcons[tab.path.split(/[?#]/, 1)[0]] ?? FileText;
    const tabIndex = visibleRouteTabs.findIndex((item) => item.path === tab.path);
    return (
      <ContextMenu key={tab.path}>
        <ContextMenuTrigger asChild>
          <div
        data-active={active}
        className={cn(
          'group relative flex h-9 max-w-56 shrink-0 items-center gap-2 rounded-t-lg border px-3.5 text-xs transition-colors',
          active
            ? 'border-border border-b-card bg-card font-semibold text-primary-text before:absolute before:inset-x-0 before:-top-px before:h-0.5 before:rounded-t-lg before:bg-primary-text'
            : 'border-transparent border-r-border/60 text-muted-foreground hover:bg-accent hover:text-foreground',
        )}
          >
        <TabIcon aria-hidden="true" className="size-4 shrink-0" />
        <button
          type="button"
          aria-current={active ? 'page' : undefined}
          className="min-w-0 flex-1 truncate py-1 text-left outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
          title={tab.title}
          onClick={() => changeTab(tab.path)}
        >
          {tab.title}
        </button>
            {tab.path !== '/' && (
              <Button
                variant="ghost"
                size="icon-xs"
                className={cn('ml-0.5 size-5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100', active ? 'opacity-70' : 'opacity-0 [@media(hover:none)]:opacity-70')}
                onClick={() => closeTab(tab.path)}
                aria-label={`关闭${tab.title}`}
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem disabled={tab.path === '/'} onSelect={() => closeTab(tab.path)}>
            关闭当前
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            disabled={!visibleRouteTabs.some(item => item.path !== '/' && item.path !== tab.path)}
            onSelect={() => { closeOtherRouteTabs(tab.path); navigate(tab.path); }}
          >
            关闭其他
          </ContextMenuItem>
          <ContextMenuItem disabled={tabIndex <= 1} onSelect={() => closeRouteTabsLeft(tab.path)}>
            关闭左侧
          </ContextMenuItem>
          <ContextMenuItem
            disabled={tabIndex === visibleRouteTabs.length - 1}
            onSelect={() => closeRouteTabsRight(tab.path)}
          >
            关闭右侧
          </ContextMenuItem>
          <ContextMenuItem disabled={visibleRouteTabs.length === 1} onSelect={closeAllTabs}>
            关闭全部
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <div className="flex h-11 shrink-0 items-center border-b border-border bg-primary/[0.035]">
      {showBack && (
        <div className="flex shrink-0 items-center border-r border-border px-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)} aria-label="返回上一页">
                <ArrowLeft />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">返回上一页</TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className="flex h-full shrink-0 items-end pl-3 pt-1.5">
        {visibleRouteTabs.filter((tab) => tab.path === '/').map(renderTab)}
      </div>
      <div ref={tabsRef} aria-label="已打开的页面" className="flex min-w-0 flex-1 h-full items-end gap-0 overflow-x-auto pr-3 pt-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleRouteTabs.filter((tab) => tab.path !== '/').map(renderTab)}
      </div>

    </div>
  );
}
