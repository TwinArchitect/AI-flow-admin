import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Workflow,
  Database,
  Puzzle,
  Settings,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number | string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: '工作台', path: '/' },
  { icon: Bot, label: '智能体', path: '/agents', badge: 8 },
  { icon: Workflow, label: '工作流', path: '/workflows', badge: 12 },
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
      <nav className="flex-1 px-3">
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

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
