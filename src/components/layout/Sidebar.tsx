import { useBrand } from '@/features/system-config/systemConfigApi';
import { squareAssetUrl } from '@/features/agents/agent-plaza/squareApi';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bot, Component, ChevronDown, LayoutDashboard, Network, PanelLeftClose, PanelLeftOpen, MessageSquare, Users, Layers, BookOpen, Settings2, LayoutGrid, ClipboardCheck, Brain, Zap, Tags, Smartphone, Video, Settings, ShieldAlert, Camera, Calendar, UserCog, KeyRound, Building2, Folder, FileText, Bell } from 'lucide-react';
import type { ElementType } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { menuNavigation, type NavigationItem } from '@/features/permissions/routes';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

const pathIcons: Record<string, ElementType> = {
  '/': LayoutDashboard, '/components': Component, '/agent': Bot, '/agents': Bot,
  '/agents/overview': MessageSquare, '/agents/myAgents': Users, '/agents/models': Layers,
  '/agents/knowledge': BookOpen, '/agents/knowledge/settings': Settings2,
  '/agents/AgentPlaza': LayoutGrid, '/agents/audit': ClipboardCheck,
  '/agents/memory': Brain, '/agents/httpTools': Zap, '/agents/mcpTools': Zap,
  '/agents/tags': Tags, '/agents/mobile-overview': Smartphone,
  '/video': Video, '/video/monitor': Video, '/video/camera': Camera, '/video/tasks': Calendar,
  '/system': Settings, '/system/user': Users, '/system/menu': LayoutGrid,
  '/system/role': KeyRound, '/system/dept': Building2, '/system/post': UserCog,
  '/system/dict': BookOpen, '/system/tree': Network, '/system/message': Bell,
  '/system/file': Folder, '/system/tenant': Building2, '/system/config': Settings2,
  '/danger-v2': ShieldAlert,
};
function navigationIcon(item: NavigationItem): ElementType {
  return pathIcons[item.path] ?? (item.children?.some(child => child.path.startsWith('/agents/')) ? Bot : item.children ? Folder : FileText);
}
function containsPath(item: NavigationItem, pathname: string): boolean {
  return item.path === pathname || !!item.children?.some(child => containsPath(child, pathname));
}
function NavigationNode({ item, depth = 0, collapsed = false, onExpand }: { item: NavigationItem; depth?: number; collapsed?: boolean; onExpand?: () => void }) {
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState<boolean | null>(null);
  const active = containsPath(item, pathname);
  const open = !collapsed && (expanded ?? active);
  const Icon = navigationIcon(item);
  if (item.children?.length) {
    // 子分类只负责展示层级，不作为可点击路由或折叠开关。
    if (depth > 0) return <li className="pt-3">
      <div className="flex items-center gap-2 px-3 pb-2 pt-2 text-xs font-semibold tracking-wide text-muted-foreground"><span>{item.label}</span><span aria-hidden="true" className="h-px flex-1 bg-sidebar-border/70" /></div>
      <ul className="space-y-1">{item.children.map((child, index) => <NavigationNode key={`${child.path}:${index}`} item={child} depth={depth + 1} />)}</ul>
    </li>;
    return <li>
      <button type="button" aria-label={item.label} title={collapsed ? item.label : undefined} aria-expanded={open} onClick={() => { if (collapsed) { setExpanded(true); onExpand?.(); } else setExpanded(!open); }} className={cn('sidebar-root-button flex h-12 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring', active ? 'bg-sidebar-primary/10 dark:bg-sidebar-primary text-primary-text hover:bg-sidebar-primary/15 dark:hover:bg-sidebar-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent')}>
        <span className="flex min-w-0 items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/10 text-primary-text"><Icon size={19} /></span><span className="sidebar-label truncate">{item.label}</span></span><ChevronDown size={14} className={cn('sidebar-chevron shrink-0 text-muted-foreground/60', !open && '-rotate-90')} />
      </button>
      <div className="sidebar-submenu" data-open={open} aria-hidden={!open} {...(!open ? { inert: '' } : {})}><div className="min-h-0 overflow-hidden"><ul className="ml-7 mr-1 mt-2 space-y-1 border-l border-sidebar-border pb-2 pl-3">{item.children.map((child, index) => <NavigationNode key={`${child.path}:${index}`} item={child} depth={depth + 1} />)}</ul></div></div>
    </li>;
  }
  return <li><NavLink to={item.path} end aria-label={item.label} title={item.label} className={cn('relative flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring', depth === 0 && 'sidebar-root-button h-12 rounded-xl text-sm font-semibold', active ? 'bg-sidebar-primary/10 dark:bg-sidebar-primary font-semibold text-primary-text' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', active && depth > 0 && 'before:absolute before:-left-[13px] before:h-5 before:w-[3px] before:rounded-full before:bg-sidebar-primary')}>
    {depth === 0 ? <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/10 text-primary-text"><Icon size={19} /></span> : <Icon size={16} className="shrink-0" />}<span className={cn("truncate", depth === 0 && "sidebar-label")}>{item.label}</span>
  </NavLink></li>;
}
export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const brand = useBrand();
  const menus = useAuthStore(state => state.menus);
  const items = menuNavigation(menus ?? []);
  const nickname = useAuthStore(state => state.user?.nickname ?? '');
  const navigation: NavigationItem[] = [
    { label: '工作台', path: '/' },
    ...items.filter(item => item.path !== '/' && item.path !== '/components'),
  ];
  if (import.meta.env.DEV) {
    navigation.push({ label: '组件示例', path: '/components', children: componentLinks });
  }
  return <aside data-collapsed={collapsed} className={cn('app-sidebar relative isolate flex shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-sidebar-primary/[0.035] dark:before:bg-[var(--color-primary-light)]/30 transition-[width] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none', collapsed ? 'w-18' : 'w-64')}>
    <div className={cn('relative z-10 flex h-20 shrink-0 items-center px-4', collapsed ? 'justify-center' : 'justify-between')}>
      <div className="sidebar-brand flex min-w-0 items-center gap-2.5"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">{brand?.customLogo ? <img src={squareAssetUrl(brand.customLogo)} alt="" className="size-full rounded-[inherit] object-contain" /> : <Network size={23} />}</div><div className="min-w-0"><div className="truncate text-lg font-bold tracking-wide">{brand?.appName?.trim() || '睿创智枢'}</div><div className="mt-0.5 text-[9px] font-semibold tracking-[0.16em] text-muted-foreground">{brand?.appIntro || 'AI WORKSPACE'}</div></div></div>
      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button></TooltipTrigger><TooltipContent side="right">{collapsed ? '展开侧边栏' : '收起侧边栏'}</TooltipContent></Tooltip>
    </div>
    <nav aria-label="侧边导航" className="relative z-10 flex-1 overflow-y-auto px-3 py-4"><ul className="space-y-2">{navigation.map((item, index) => <NavigationNode key={`${item.path}:${index}`} item={item} collapsed={collapsed} onExpand={onToggle} />)}</ul></nav>
    {!collapsed && <svg aria-hidden="true" viewBox="0 0 256 140" className="pointer-events-none absolute bottom-16 left-0 -z-10 w-full text-sidebar-primary/10 dark:text-primary-text/15" fill="none"><path d="M-10 110 55 76 115 112 162 62 225 86M55 76 113 35 162 62 182 5M162 62 233 29" stroke="currentColor" />{[[55,76],[115,112],[162,62],[225,86],[113,35],[182,5],[233,29]].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill="currentColor" />)}</svg>}
    {nickname && <div className={cn('relative z-10 mt-auto flex h-20 shrink-0 items-center border-t border-sidebar-border/60', collapsed ? 'justify-center px-2' : 'gap-3 px-5')}><Avatar className="size-10" title={nickname}><AvatarFallback className="bg-sidebar-primary text-sm font-medium text-sidebar-primary-foreground">{nickname.slice(0,1)}</AvatarFallback></Avatar>{<div className="sidebar-account-label min-w-0"><div className="truncate text-xs font-medium">{nickname}</div><div className="mt-0.5 text-[10px] text-muted-foreground">当前账号</div></div>}</div>}
  </aside>;
}
