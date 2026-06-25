import { useState } from 'react';
import {
  Bot,
  Zap,
  Server,
  Activity,
  ArrowUp,
  ArrowDown,
  BarChart3,
  ChevronRight,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 模拟统计卡数据
const statCards = [
  {
    title: 'API 调用量',
    value: '284K',
    change: '+12.4%',
    trend: 'up' as const,
    icon: Zap,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    title: '活跃智能体',
    value: '24',
    change: '+3',
    trend: 'up' as const,
    icon: Bot,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    title: '平均延迟',
    value: '248ms',
    change: '-8.1%',
    trend: 'down' as const,
    icon: Activity,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    title: 'Token 用量',
    value: '12.4亿',
    change: '+18.7%',
    trend: 'up' as const,
    icon: BarChart3,
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
  },
];

// 模拟 API 调用趋势数据
const trendData = [40, 55, 35, 70, 50, 85, 60, 90, 75, 45, 65, 80, 55, 70, 95, 60, 85, 50, 65, 75, 45, 55, 65, 80];

// 本周活动数据
const weeklyData = [
  { day: '一', value: 35 },
  { day: '二', value: 68 },
  { day: '三', value: 52 },
  { day: '四', value: 85 },
  { day: '五', value: 78 },
  { day: '六', value: 42 },
  { day: '日', value: 30 },
];

// 系统状态数据
const systemStatus = [
  { name: '智能体运行时', uptime: '99.97%', latency: '12ms', color: 'text-emerald-500' },
  { name: '模型网关', uptime: '99.94%', latency: '38ms', color: 'text-emerald-500' },
  { name: '向量数据库', uptime: '100%', latency: '4ms', color: 'text-emerald-500' },
  { name: '工作流引擎', uptime: '99.91%', latency: '21ms', color: 'text-emerald-500' },
];

// 智能体列表
const topAgents = [
  {
    name: '客服支持机器人',
    model: 'Claude 3.5 Sonnet',
    usage: 12840,
    accuracy: '97.3%',
    status: 'running',
  },
  {
    name: '代码审查助手',
    model: 'GPT-4o',
    usage: 4392,
    accuracy: '99.1%',
    status: 'running',
  },
  {
    name: '数据抽取流水线',
    model: 'Claude 3 Haiku',
    usage: 8910,
    accuracy: '94.7%',
    status: 'paused',
  },
  {
    name: '内容创作助手',
    model: 'GPT-4o-mini',
    usage: 3210,
    accuracy: '91.2%',
    status: 'running',
  },
];

// 简单的 SVG 面积图组件
function AreaChart({ data, color }: { data: number[]; color: string }) {
  const width = 540;
  const height = 160;
  const padding = { top: 10, right: 0, bottom: 20, left: 0 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data);
  const points = data.map((v, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - (v / maxVal) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[data.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`area-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#area-${color})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 简单的柱状图组件
function BarChart({ data }: { data: typeof weeklyData }) {
  const maxVal = Math.max(...data.map((d) => d.value));

  return (
    <div className="flex items-end justify-between h-40 px-2 pt-8">
      {data.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-1">
          <div
            className="w-10 rounded-t-lg bg-gradient-to-t from-violet-500 to-indigo-400 transition-all hover:from-violet-400 hover:to-indigo-300"
            style={{ height: `${(item.value / maxVal) * 120}px` }}
          />
          <span className="text-xs text-[var(--color-text-tertiary)]">{item.day}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const [trendTab, setTrendTab] = useState<'24h' | '7d' | '30d'>('24h');

  return (
    <div className="h-full overflow-y-auto bg-[var(--color-bg-page)]">
      <div className="px-6 py-5">
        {/* 页面标题 */}
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">工作台</h2>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">实时监控平台运行状态与关键指标</p>
        </div>

        {/* ====== 统计卡片行 ====== */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-default)] p-4 hover:border-[var(--color-border-hover)] hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[var(--color-text-tertiary)]">{card.title}</span>
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', card.bg)}>
                  <card.icon size={16} className={card.color} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[var(--color-text-primary)]">{card.value}</span>
                <span
                  className={cn(
                    'flex items-center gap-0.5 text-xs font-medium',
                    card.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'
                  )}
                >
                  {card.trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  {card.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ====== 图表行 ====== */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {/* API 调用量趋势图 */}
          <div className="col-span-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-default)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">API 调用量趋势</h3>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">实时监控 API 调用频率与峰值</p>
              </div>
              <div className="flex items-center gap-1 bg-[var(--color-bg-muted)] rounded-lg p-0.5">
                {([
                  { key: '24h' as const, label: '24小时' },
                  { key: '7d' as const, label: '7天' },
                  { key: '30d' as const, label: '30天' },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setTrendTab(tab.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                      trendTab === tab.key
                        ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm'
                        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-40">
              <AreaChart data={trendData} color="#8B5CF6" />
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--color-text-tertiary)]">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:59</span>
            </div>
          </div>

          {/* 本周活动 */}
          <div className="rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-default)] p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">本周活动</h3>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">智能体日活跃调用次数</p>
            </div>
            <BarChart data={weeklyData} />
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-[var(--color-text-tertiary)]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-violet-500" />
                API 调用
              </div>
              <span>峰值: 周四</span>
            </div>
          </div>
        </div>

        {/* ====== 底部行：系统状态 + 智能体列表 ====== */}
        <div className="grid grid-cols-3 gap-4">
          {/* 系统状态 */}
          <div className="rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-default)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server size={15} className="text-[var(--color-text-tertiary)]" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">系统状态</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-500 font-medium">所有服务正常运行</span>
              </div>
            </div>
            <div className="space-y-3">
              {systemStatus.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Circle size={6} className={cn('fill-current', item.color)} />
                    <span className="text-sm text-[var(--color-text-primary)]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('text-xs font-mono font-medium', item.color)}>{item.uptime}</span>
                    <span className="text-xs text-[var(--color-text-tertiary)]">{item.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 调用量最高的智能体 */}
          <div className="col-span-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-default)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot size={15} className="text-[var(--color-text-tertiary)]" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">调用量最高的智能体</h3>
              </div>
              <button className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-500)] transition-colors">
                查看全部
                <ChevronRight size={13} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)]">
                    <th className="text-left py-2.5 text-xs font-medium text-[var(--color-text-tertiary)]">智能体</th>
                    <th className="text-left py-2.5 text-xs font-medium text-[var(--color-text-tertiary)]">模型</th>
                    <th className="text-right py-2.5 text-xs font-medium text-[var(--color-text-tertiary)]">调用次数</th>
                    <th className="text-right py-2.5 text-xs font-medium text-[var(--color-text-tertiary)]">精确度</th>
                    <th className="text-right py-2.5 text-xs font-medium text-[var(--color-text-tertiary)]">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {topAgents.map((agent) => (
                    <tr key={agent.name} className="border-b border-[var(--color-border-default)] last:border-b-0 hover:bg-[var(--color-bg-hover)]/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                            {agent.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">{agent.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-xs text-[var(--color-text-tertiary)]">{agent.model}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm text-[var(--color-text-primary)] tabular-nums">
                          {agent.usage.toLocaleString()}
                        </span>
                        <span className="text-xs text-[var(--color-text-tertiary)] ml-1">次调用</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm text-[var(--color-text-primary)]">{agent.accuracy}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
                            agent.status === 'running'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-amber-500/10 text-amber-500'
                          )}
                        >
                          <span className={cn('h-1 w-1 rounded-full', agent.status === 'running' ? 'bg-emerald-500' : 'bg-amber-500')} />
                          {agent.status === 'running' ? '运行中' : '已暂停'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
