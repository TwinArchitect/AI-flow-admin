import { useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Bell, User, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/theme';

export function Header() {
  const { isDark, setTheme } = useThemeStore();
  const [isAnimating, setIsAnimating] = useState(false);

  // 带动画的主题切换
  const handleThemeToggle = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (isAnimating) return;
    
    const newIsDark = !isDark;
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // 计算点击位置（相对于视口）
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // 设置 CSS 变量用于动画（动画使用 150% 固定半径已足够覆盖屏幕）
    document.documentElement.style.setProperty('--vt-x', `${x}px`);
    document.documentElement.style.setProperty('--vt-y', `${y}px`);
    
    // 检查浏览器支持
    if (!('startViewTransition' in document)) {
      setTheme(newIsDark);
      return;
    }
    
    setIsAnimating(true);
    
    // 启动 View Transition
    const transition = (document as Document & { startViewTransition?: (callback: () => void) => ViewTransition }).startViewTransition!(() => {
      flushSync(() => {
        setTheme(newIsDark);
      });
    });
    
    transition.finished.then(() => {
      setIsAnimating(false);
    }).catch(() => {
      setIsAnimating(false);
    });
  }, [isDark, setTheme, isAnimating]);

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-[var(--color-bg-card)] border-b border-[var(--color-border-default)]">
      {/* 搜索 */}
      <div className="relative w-96">

        <input
          type="text"
          placeholder="搜索..."
          className={[
            'w-full h-9 pl-10 pr-4 rounded-md',
            'bg-[var(--color-bg-muted)]',
            'border border-transparent',
            'text-sm text-[var(--color-text-primary)]',
            'placeholder:text-[var(--color-text-tertiary)]',
            'focus:outline-none focus:border-[var(--color-border-focus)] focus:bg-[var(--color-bg-card)]',
            'transition-colors',
          ].join(' ')}
        />
      </div>

      {/* 右侧操作 */}
      <div className="flex items-center gap-3">
        {/* 主题切换 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleThemeToggle}
          disabled={isAnimating}
          className="h-9 w-9 p-0"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        {/* 通知 */}
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--color-error)]" />
        </Button>

        {/* 用户 */}
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 pl-2 pr-3"
        >
          <div className="h-8 w-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white">
            <User size={16} />
          </div>
          <span className="text-sm font-medium">管理员</span>
        </Button>
      </div>
    </header>
  );
}
