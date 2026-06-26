import { useState, useRef, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Globe,
  Clock,
  CheckCheck,
  Sun,
  Moon,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import { notifications, typeConfig } from '@/data/notifications';

export function Header() {
  const { isDark, setTheme } = useThemeStore();
  const { clear: logout } = useAuthStore();
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);

  // 下拉面板状态
  const [notifyOpen, setNotifyOpen] = useState(false);

  // Refs 用于点击外部关闭
  const notifyRef = useRef<HTMLDivElement>(null);
  const notifyBtnRef = useRef<HTMLButtonElement>(null);

  // 点击外部关闭通知面板
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        notifyRef.current && !notifyRef.current.contains(target) &&
        notifyBtnRef.current && !notifyBtnRef.current.contains(target)
      ) {
        setNotifyOpen(false);
      }
    }
    if (notifyOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifyOpen]);

  // View Transitions 动画切换主题
  const toggleTheme = useCallback(async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    try {
      if ('startViewTransition' in document) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc = document as any;
        await doc.startViewTransition(() => {
          flushSync(() => {
            setTheme(!isDark);
          });
        }).finished;
      } else {
        setTheme(!isDark);
      }
    } finally {
      setIsAnimating(false);
    }
  }, [isDark, isAnimating, setTheme]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="flex items-center justify-between h-14 px-5 bg-[var(--color-bg-card)] border-b border-[var(--color-border-default)] shrink-0">
      {/* 左侧：面包屑导航 */}
      <div className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
        <span>平台</span>
        <ChevronRight size={10} />
        <span className="text-[var(--color-text-primary)] font-medium">工作台</span>
      </div>

      {/* 右侧操作 */}
      <div className="flex items-center gap-2">
        {/* 全局搜索 */}
        <div className="relative w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] z-10 pointer-events-none" />
          <Input
            type="text"
            placeholder="全局搜索..."
            className="pl-9 h-9 bg-[var(--color-bg-muted)] border-transparent rounded-lg text-sm focus-visible:border-[var(--color-border-focus)] focus-visible:bg-[var(--color-bg-card)]"
          />
        </div>

        {/* 语言切换 */}
        <div className="flex items-center gap-1.5">
          <Globe size={15} className="text-[var(--color-text-tertiary)]" />
          <span className="text-xs font-medium text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-brand-500)] transition-colors">
            HK
          </span>
        </div>

        {/* 主题切换（带 View Transitions 动画） */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          disabled={isAnimating}
          className="rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        {/* ====== 通知 ====== */}
        <div className="relative">
          <Button
            ref={notifyBtnRef}
            variant="ghost"
            size="icon-sm"
            onClick={() => setNotifyOpen(!notifyOpen)}
            className="relative rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-[3px] text-[9px] font-bold leading-none"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>

          {/* 通知下拉面板 */}
          {notifyOpen && (
            <div
              ref={notifyRef}
              className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] shadow-xl animate-in fade-in zoom-in-95 origin-top-right"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-default)]">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">通知</span>
                <Button variant="ghost" size="xs" className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                  <CheckCheck size={12} />
                  全部已读
                </Button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => {
                  const cfg = typeConfig[n.type] || typeConfig.info;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer border-b border-[var(--color-border-default)] last:border-b-0"
                    >
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
                        <Icon size={14} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-[var(--color-text-primary)] text-truncate">{n.title}</span>
                          {n.unread && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-500)] shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 line-clamp-2 leading-relaxed">{n.desc}</p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-[var(--color-text-tertiary)]">
                          <Clock size={10} />{n.time}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 退出 */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleLogout}
          className="rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]"
        >
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  );
}
