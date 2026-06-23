import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Workflow,
  ChevronLeft,
  ChevronRight,
  Component,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  children?: { label: string; path: string }[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: '仪表盘', path: '/' },
  { icon: Workflow, label: '工作流', path: '/workflows' },
  { icon: Users, label: '用户管理', path: '/users' },
  {
    icon: Component,
    label: '组件库',
    children: [
      { label: 'Accordion', path: '/components/accordion' },
      { label: 'Alert', path: '/components/alert' },
      { label: 'Avatar', path: '/components/avatar' },
      { label: 'Badge', path: '/components/badge' },
      { label: 'Button', path: '/components/button' },
      { label: 'Calendar', path: '/components/calendar' },
      { label: 'Card', path: '/components/card' },
      { label: 'Checkbox', path: '/components/checkbox' },
      { label: 'Command', path: '/components/command' },
      { label: 'Date Picker', path: '/components/date-picker' },
      { label: 'Dialog', path: '/components/dialog' },
      { label: 'Dropdown Menu', path: '/components/dropdown-menu' },
      { label: 'Form', path: '/components/form' },
      { label: 'Input', path: '/components/input' },
      { label: 'Popover', path: '/components/popover' },
      { label: 'Progress', path: '/components/progress' },
      { label: 'Radio Group', path: '/components/radio-group' },
      { label: 'Select', path: '/components/select' },
      { label: 'Separator', path: '/components/separator' },
      { label: 'Sheet', path: '/components/sheet' },
      { label: 'Skeleton', path: '/components/skeleton' },
      { label: 'Slider', path: '/components/slider' },
      { label: 'Multi Select', path: '/components/multi-select' },
      { label: 'Switch', path: '/components/switch' },
      { label: 'Table', path: '/components/table' },
      { label: 'Tabs', path: '/components/tabs' },
      { label: 'Textarea', path: '/components/textarea' },
      { label: 'Time Picker', path: '/components/time-picker' },
      { label: 'Toast', path: '/components/toast' },
      { label: 'Tooltip', path: '/components/tooltip' },
      { label: 'React Query', path: '/components/react-query' },
    ],
  },
  { icon: Settings, label: '系统设置', path: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();

  // 首次进入时，自动展开当前路径匹配的父菜单
  useEffect(() => {
    const matched = menuItems
      .filter(item => item.children?.some(c => location.pathname.startsWith(c.path)))
      .map(item => item.label);
    if (matched.length > 0) {
      setExpandedMenus(prev => Array.from(new Set([...prev, ...matched])));
    }
  // 只在首次挂载时执行
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const isMenuActive = (item: MenuItem) => {
    if (item.path) return location.pathname === item.path;
    if (item.children) return item.children.some((c) => location.pathname.startsWith(c.path));
    return false;
  };

  // 展开状态完全由 expandedMenus 控制，用户可随时手动折叠
  const isExpanded = (label: string) => expandedMenus.includes(label);

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-[var(--color-border-default)]',
        'bg-[var(--color-bg-card)]',
        'transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo 区域 */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--color-border-default)]">
        {!collapsed && (
          <span className="text-lg font-semibold text-[var(--color-primary)]">
            AI Flow
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1.5 rounded-md',
            'text-[var(--color-text-secondary)]',
            'hover:bg-[var(--color-bg-hover)]',
            'transition-colors'
          )}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* 菜单 */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.label}>
              {item.path ? (
                // 单层菜单
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md',
                      'text-sm font-medium',
                      'transition-colors duration-200',
                      isActive
                        ? 'text-[var(--color-primary)] bg-[var(--color-brand-900)]/30'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                    )
                  }
                >
                  <item.icon size={20} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ) : (
                // 多级菜单
                <div>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md',
                      'text-sm font-medium',
                      'transition-colors duration-200',
                      isMenuActive(item)
                        ? 'text-[var(--color-primary)] bg-[var(--color-brand-900)]/30'
                        : isExpanded(item.label)
                          ? 'text-[var(--color-text-primary)]'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        size={16}
                        className={cn(
                          'transition-transform duration-200',
                          isExpanded(item.label) ? 'rotate-180' : ''
                        )}
                      />
                    )}
                  </button>
                  {!collapsed && isExpanded(item.label) && item.children && (
                    <ul className="mt-1 ml-4 pl-4 border-l border-[var(--color-border-default)] space-y-1">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-2 px-3 py-2 rounded-md',
                                'text-sm',
                                'transition-colors duration-200',
                                isActive
                                  ? 'text-[var(--color-primary)] bg-[var(--color-brand-900)]/30'
                                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                              )
                            }
                          >
                            <span>{child.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* 底部 */}
      <div className="p-4 border-t border-[var(--color-border-default)]">
        {!collapsed && (
          <div className="text-xs text-[var(--color-text-tertiary)]">
            v0.0.1
          </div>
        )}
      </div>
    </aside>
  );
}
