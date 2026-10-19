import { useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import {
  // Search,
  // Globe,
  Sun,
  Moon,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { useThemeStore } from '@/stores/theme';
import { useLogout } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { resolveRouteTitle } from './RouteTabs';

export function Header() {
  const { isDark, setTheme } = useThemeStore();
  const logoutMutation = useLogout();
  const [isAnimating, setIsAnimating] = useState(false);

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
    logoutMutation.mutate();
  };

  const location = useLocation();
  const title = resolveRouteTitle(location.pathname);

  return (
    <header className="flex items-center justify-between h-14 px-5 bg-background border-b border-border shrink-0">
      {/* 左侧：面包屑导航 */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>平台</span>
        <ChevronRight size={10} />
        <span className="text-foreground font-medium">{title}</span>
      </div>

      {/* 右侧操作 */}
      <div className="flex items-center gap-3">
        {/* 全局搜索 */}
        {/*<div className="relative w-56">*/}
        {/*  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />*/}
        {/*  <Input*/}
        {/*    type="text"*/}
        {/*    placeholder="全局搜索..."*/}
        {/*    className="pl-9 h-9 bg-muted border-transparent rounded-lg text-sm focus-visible:border-ring focus-visible:bg-background"*/}
        {/*  />*/}
        {/*</div>*/}


        {/* 主题切换（带 View Transitions 动画） */}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="切换主题"
          onClick={toggleTheme}
          disabled={isAnimating}
          className="rounded-lg text-muted-foreground hover:text-foreground"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        {/* 退出 */}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="退出登录"
          onClick={handleLogout}
          className="rounded-lg text-muted-foreground hover:text-destructive"
        >
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  );
}
