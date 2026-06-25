import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Globe,
  Clock,
  CheckCheck,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';

// 模拟通知数据
const notifications = [
  {
    id: 'n1',
    type: 'success',
    title: '智能体部署成功',
    desc: '客服支持机器人 v1.2 已成功发布上线',
    time: '2 分钟前',
    unread: true,
  },
  {
    id: 'n2',
    type: 'info',
    title: '知识库更新完成',
    desc: '产品手册新版本切片处理完成，共 156 个片段',
    time: '15 分钟前',
    unread: true,
  },
  {
    id: 'n3',
    type: 'warning',
    title: 'API 调用量告警',
    desc: '本月 API 调用量已达配额的 85%，建议升级套餐',
    time: '1 小时前',
    unread: true,
  },
  {
    id: 'n4',
    type: 'info',
    title: '系统维护通知',
    desc: '平台将于 6月28日 凌晨 2:00-4:00 进行维护升级',
    time: '3 小时前',
    unread: false,
  },
  {
    id: 'n5',
    type: 'success',
    title: '工作流测试通过',
    desc: '数据抽取流水线全部测试用例通过',
    time: '昨天',
    unread: false,
  },
];

const typeConfig = {
  success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  warning: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  error: { icon: X, color: 'text-red-500', bg: 'bg-red-500/10' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
};

export function Header() {
  const { isDark, setTheme } = useThemeStore();
  const { clear: logout } = useAuthStore();
  const navigate = useNavigate();
  const [isAnimating] = useState(false);

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
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="全局搜索..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[var(--color-bg-muted)] border border-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-border-focus)] focus:bg-[var(--color-bg-card)] transition-colors"
          />
        </div>

        {/* 语言切换 */}
        <div className="flex items-center gap-1.5">
          <Globe size={15} className="text-[var(--color-text-tertiary)]" />
          <span className="text-xs font-medium text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-brand-500)] transition-colors">
            HK
          </span>
        </div>

        {/* 主题切换 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(!isDark)}
          disabled={isAnimating}
          className="h-8 w-8 p-0 rounded-lg"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" strokeWidth="2">
            {isDark ? (
              <><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>
            ) : (
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            )}
          </svg>
        </Button>

        {/* ====== 通知 ====== */}
        <div className="relative">
          <button
            ref={notifyBtnRef}
            onClick={() => setNotifyOpen(!notifyOpen)}
            className="relative h-8 w-8 p-0 rounded-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-[var(--color-error)] text-white text-[9px] font-bold px-[3px] leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {/* 通知下拉面板 */}
          {notifyOpen && (
            <div
              ref={notifyRef}
              className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] shadow-xl animate-in fade-in zoom-in-95 origin-top-right"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-default)]">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">通知</span>
                <button className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1">
                  <CheckCheck size={12} />
                  全部已读
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => {
                  const cfg = typeConfig[n.type as keyof typeof typeConfig] || typeConfig.info;
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
        <button
          onClick={handleLogout}
          className="h-8 w-8 p-0 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
