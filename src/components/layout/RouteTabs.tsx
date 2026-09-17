import { useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
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
  '/agents/knowledge': '知识库',
  '/agents/knowledge/settings': '知识库 · 引擎设置',
  '/agents/tags': '标签页',
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

const tablessRoutePaths = new Set(['/agents', '/components']);

function isTablessRoute(path: string) {
  return tablessRoutePaths.has(path.split(/[?#]/, 1)[0]);
}

function resolveRouteTitle(pathname: string) {
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
  const navigate = useNavigate();
  const {
    routeTabs,
    openRouteTab,
    closeRouteTab,
    closeAllRouteTabs,
    closeRouteTabsLeft,
    closeRouteTabsRight,
    setActiveTabPath,
  } = useLayoutStore();
  const currentPath = `${location.pathname}${location.search}${location.hash}`;
  const visibleRouteTabs = routeTabs.filter((tab) => !isTablessRoute(tab.path));

  useEffect(() => {
    useLayoutStore.getState().routeTabs
      .filter((tab) => isTablessRoute(tab.path))
      .forEach((tab) => closeRouteTab(tab.path));
  }, [closeRouteTab]);

  useEffect(() => {
    if (isTablessRoute(location.pathname)) return;
    openRouteTab({ path: currentPath, title: resolveRouteTitle(location.pathname) });
  }, [currentPath, location.pathname, openRouteTab]);

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

  return (
    <div className="flex h-10 shrink-0 items-center border-b border-border bg-card">
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

      <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto px-2 pt-1.5">
        {visibleRouteTabs.map((tab) => {
          const active = tab.path === currentPath;
          const tabIndex = visibleRouteTabs.findIndex((item) => item.path === tab.path);
          return (
            <ContextMenu key={tab.path}>
              <ContextMenuTrigger asChild>
                <div
              className={cn(
                'group flex h-8 max-w-52 shrink-0 items-center rounded-t-md border border-b-0 px-2 text-xs transition-colors',
                active
                  ? 'border-border bg-background text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
                >
              <button
                type="button"
                className="min-w-0 flex-1 truncate px-1 text-left"
                title={tab.title}
                onClick={() => changeTab(tab.path)}
              >
                {tab.title}
              </button>
                  {tab.path !== '/' && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="ml-1 size-5 opacity-60 hover:bg-muted hover:opacity-100"
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
        })}
      </div>

    </div>
  );
}
