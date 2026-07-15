import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Workflow,
  Database,
  Puzzle,
  Settings,
  User,
  Component,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number | string;
  children?: { label: string; path: string }[];
}
const agentslist = [
  { label: '智能体广场', path: '/agents/AgentPlaza' },
]
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
const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: '工作台', path: '/' },
  { icon: Bot, label: '智能体', path: '/agents', badge: 8, children: agentslist },
  { icon: Workflow, label: '工作流', path: '/workflows', badge: 12 },
  { icon: Component, label: '组件示例', path: '/components', children: componentLinks },
  { icon: Database, label: '知识库', path: '/knowledge' },
  { icon: Puzzle, label: '插件市场', path: '/plugins' },
  { icon: Settings, label: '系统设置', path: '/settings' },
];



export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-56 flex flex-col bg-[var(--color-bg-card)] border-r border-[var(--color-border-default)] shrink-0 overflow-hidden">
      {/* Logo 区域 */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Bot size={17} className="text-white" />
          </div>
          <span className="text-base font-bold text-[var(--color-text-primary)] tracking-wide">智构平台</span>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            // const showChildren = item.path === '/components' && isActive;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                    isActive
                      ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        'min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-medium px-1.5',
                        isActive
                          ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                          : 'bg-[var(--color-bg-muted)] text-[var(--color-text-tertiary)]'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
                {item.children && isActive&&  (
                  <div className="mt-1 space-y-0.5 border-l border-[var(--color-border-default)] py-1 pl-4">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive: isChildActive }) =>
                          cn(
                            'block rounded-md px-3 py-1.5 text-xs transition-colors',
                            isChildActive
                              ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
                              : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]',
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

      {/* 底部用户信息 */}
      <div className="px-4 py-4 border-t border-[var(--color-border-default)]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--color-text-primary)]">张昊</div>
            <div className="text-[10px] text-[var(--color-text-tertiary)]">产品工程师</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
