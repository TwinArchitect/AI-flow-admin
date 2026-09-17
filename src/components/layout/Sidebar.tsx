import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Database,
  User,
  Component,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number | string;
  children?: { label: string; path: string }[];
}
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
  { label: '引擎设置', path: '/agents/knowledge/settings' },
];
const menuItems: MenuItem[] = [
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

  return (
    <aside className={cn(
      'flex shrink-0 flex-col overflow-hidden border-r border-[var(--color-border-default)] bg-[var(--color-bg-card)] transition-[width] duration-200',
      collapsed ? 'w-16' : 'w-56',
    )}>
      <div className={cn('flex h-20 shrink-0 items-center px-3', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Bot size={17} className="text-white" />
            </div>
            <span className="truncate text-base font-bold tracking-wide text-[var(--color-text-primary)]">智构平台</span>
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

      <nav className={cn('flex-1 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            // const showChildren = item.path === '/components' && isActive;

            const link = (
              <NavLink
                to={item.path}
                className={cn(
                  'flex rounded-lg py-2.5 text-sm transition-all duration-200',
                  collapsed ? 'justify-center px-2' : 'items-center justify-between px-3',
                  isActive
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]',
                )}
              >
                <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
                  <item.icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && item.badge !== undefined && (
                  <span className={cn(
                    'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-medium',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'bg-[var(--color-bg-muted)] text-[var(--color-text-tertiary)]',
                  )}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );

            return (
              <li key={item.path}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : link}
                {!collapsed && item.children && isActive && (
                  <div className="mt-1 space-y-0.5 border-l border-[var(--color-border-default)] py-1 pl-4">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        end
                        className={({ isActive: isChildActive }) =>
                          cn(
                            'block rounded-md px-3 py-1.5 text-xs transition-colors',
                            isChildActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                          )
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={cn('border-t border-[var(--color-border-default)] py-4', collapsed ? 'px-3' : 'px-4')}>
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-2.5')}>
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          {!collapsed && <div>
            <div className="text-xs font-medium text-[var(--color-text-primary)]">张昊</div>
            <div className="text-[10px] text-[var(--color-text-tertiary)]">产品工程师</div>
          </div>}
        </div>
      </div>
    </aside>
  );
}
