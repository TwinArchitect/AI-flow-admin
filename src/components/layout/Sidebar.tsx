import { canAccess, menuPaths } from '@/features/permissions/routes';
import { useAuthStore } from '@/stores/auth';
import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Bot,
  Database,
  Component,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Network,
  MessageSquare,
  Users,
  Layers,
  BookOpen,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number | string;
  children?: { label: string; path: string }[];
}
const childIcons: Record<string, React.ElementType> = {
  '/agents/overview': MessageSquare, '/agents/myAgents': Users, '/agents/models': Layers,
  '/agents/knowledge': BookOpen, '/agents/knowledge/settings': Settings2,
};

const agentslist = [
  { label: '智能体助手', path: '/agents/overview' },
  { label: '我的智能体', path: '/agents/myAgents' },
  { label: '模型管理', path: '/agents/models' },
];
const componentLinks = [
  { label: 'Button', path: '/components/button' },
  { label: 'Card', path: '/components/card' },
  { label: 'Dialog', path: '/components/dialog' },
  { label: 'Form', path: '/components/form' },
  { label: 'Input', path: '/components/input' },
  { label: 'Select', path: '/components/select' },
  { label: 'Table', path: '/components/table' },
  { label: 'Pagination', path: '/components/pagination' },
  { label: 'Tabs', path: '/components/tabs' },
  { label: 'Accordion', path: '/components/accordion' },
  { label: 'Alert', path: '/components/alert' },
  { label: 'Badge', path: '/components/badge' },
  { label: 'Avatar', path: '/components/avatar' },
  { label: 'Toast', path: '/components/toast' },
  { label: 'Checkbox', path: '/components/checkbox' },
  { label: 'Switch', path: '/components/switch' },
  { label: 'Radio', path: '/components/radio-group' },
  { label: 'Textarea', path: '/components/textarea' },
  { label: 'Progress', path: '/components/progress' },
  { label: 'Skeleton', path: '/components/skeleton' },
  { label: 'Slider', path: '/components/slider' },
  { label: 'Dropdown', path: '/components/dropdown-menu' },
  { label: 'Popover', path: '/components/popover' },
  { label: 'Tooltip', path: '/components/tooltip' },
  { label: 'Sheet', path: '/components/sheet' },
  { label: 'Separator', path: '/components/separator' },
  { label: 'Calendar', path: '/components/calendar' },
  { label: 'Command', path: '/components/command' },
  { label: 'Date Picker', path: '/components/date-picker' },
  { label: 'Multi Select', path: '/components/multi-select' },
  { label: 'Time Picker', path: '/components/time-picker' },
  { label: 'React Query', path: '/components/react-query' },
];
const knowledgeLinks = [
  { label: '知识库管理', path: '/agents/knowledge' },
  { label: '模型配置', path: '/agents/knowledge/settings' },
];
const localMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: '工作台', path: '/' },
  { icon: Bot, label: '智能体', path: '/agents', children: agentslist },
  { icon: Component, label: '组件示例', path: '/components', children: componentLinks },
  { icon: Database, label: '知识库', path: '/agents/knowledge', children: knowledgeLinks },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const menus = useAuthStore((state) => state.menus);
  const allowedPaths = menuPaths(menus ?? []);
  const menuItems: MenuItem[] = localMenuItems.flatMap(item => {
    if (item.children) {
      const children = item.children.filter(child => canAccess(child.path, allowedPaths));
      return children.length ? [{ ...item, children }] : [];
    }
    return canAccess(item.path, allowedPaths) ? [item] : [];
  });
  const nickname = useAuthStore((state) => state.user?.nickname ?? '');

  return (
    <aside className={cn(
      'flex shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground relative isolate before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-sidebar-primary/[0.035] transition-[width] duration-200 motion-reduce:transition-none',
      collapsed ? 'w-18' : 'w-64',
    )}>
      <div className={cn('relative z-10 flex h-20 shrink-0 items-center px-4', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Network size={23} />
            </div>
            <div className="min-w-0"><div className="truncate text-lg font-bold tracking-wide">智构平台</div><div className="mt-0.5 text-[9px] font-semibold tracking-[0.16em] text-muted-foreground">AI WORKSPACE</div></div>
          </div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}>
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{collapsed ? '展开侧边栏' : '收起侧边栏'}</TooltipContent>
        </Tooltip>
      </div>

      <nav className={cn('relative z-10 flex-1 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname === item.path || Boolean(item.children?.some(child => location.pathname === child.path));
            const ChildFallback = Component;
            const isExpanded = expandedMenus[item.path] ?? isActive;
            const sectionTitle = item.path === '/' ? '工作空间' : item.path === '/agents/knowledge' ? '数据与资源' : null;
            const highlight = isActive && (collapsed || !item.children);

            const link = (
              <NavLink
                to={item.children?.[0]?.path ?? item.path}
                aria-label={item.label}
                aria-expanded={item.children && !collapsed ? isExpanded : undefined}
                onClick={(event) => {
                  if (item.children && !collapsed) {
                    event.preventDefault();
                    setExpandedMenus(current => ({ ...current, [item.path]: !isExpanded }));
                  }
                }}
                className={cn(
                  'flex h-12 items-center rounded-xl text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                  collapsed ? 'justify-center px-2' : 'items-center justify-between px-3',
                  highlight
                    ? 'bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-sm'
                    : isActive
                      ? 'font-semibold text-primary-text hover:bg-sidebar-primary/5'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
                  <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', highlight ? 'bg-sidebar-primary-foreground/15' : 'bg-sidebar-primary/10 text-primary-text', item.path === '/agents/knowledge' && !highlight && 'bg-[var(--color-success)]/10 text-[var(--color-success)]')}><item.icon size={19} /></span>
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && item.children && <ChevronDown size={14} className={cn('shrink-0 text-muted-foreground/60', !isExpanded && '-rotate-90')} />}
                {!collapsed && item.badge !== undefined && (
                  <span className={cn(
                    'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-medium',
                    isActive
                      ? 'bg-primary/15 text-primary-text'
                      : 'bg-[var(--color-bg-muted)] text-[var(--color-text-tertiary)]',
                  )}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );

            return (
              <li key={item.path}>
                {!collapsed && sectionTitle && <div className={cn('px-3 pb-2 text-[10px] font-medium tracking-wide text-muted-foreground', item.path !== '/' && 'mt-7')}>{sectionTitle}</div>}
                <div className={cn('rounded-xl', !collapsed && item.children && isActive && 'bg-sidebar-primary/5 p-1')}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : link}
                {!collapsed && item.children && isExpanded && (
                  <div className="space-y-1 px-1 pb-1">
                    {item.children.map((child) => {
                      const ChildIcon = childIcons[child.path] ?? ChildFallback;
                      return (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        end
                        className={({ isActive: isChildActive }) =>
                          cn(
                            'relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                            isChildActive
                              ? 'bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-sm after:absolute after:right-2 after:h-4 after:w-[3px] after:rounded-full after:bg-sidebar-primary-foreground/90'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )
                        }
                      >
                        <ChildIcon size={16} className="shrink-0" /><span className="truncate">{child.label}</span>
                      </NavLink>
                    );})}
                  </div>
                )}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && <svg aria-hidden="true" viewBox="0 0 256 140" className="pointer-events-none absolute bottom-16 left-0 -z-10 w-full text-sidebar-primary/10" fill="none"><path d="M-10 110 55 76 115 112 162 62 225 86M55 76 113 35 162 62 182 5M162 62 233 29" stroke="currentColor" strokeWidth="1" />{[[55,76],[115,112],[162,62],[225,86],[113,35],[182,5],[233,29]].map(([cx,cy])=><circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill="currentColor" />)}</svg>}
      {nickname && (
        <div className={cn('relative z-10 mt-auto flex h-20 shrink-0 items-center border-t border-sidebar-border/60', collapsed ? 'justify-center px-2' : 'gap-3 px-5')}>
          <Avatar className="size-10" title={nickname}>
            <AvatarFallback className="bg-sidebar-primary text-sm font-medium text-sidebar-primary-foreground">{nickname.slice(0, 1)}</AvatarFallback>
          </Avatar>
          {!collapsed && <div className="min-w-0"><div className="truncate text-xs font-medium" title={nickname}>{nickname}</div><div className="mt-0.5 text-[10px] text-muted-foreground">当前账号</div></div>}
        </div>
      )}
    </aside>
  );
}
