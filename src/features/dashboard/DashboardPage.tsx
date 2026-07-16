import { useState } from 'react';
import {
  Bot,
  Server,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { statCards, trendData, weeklyData, systemStatus, topAgents } from '@/data/dashboard';

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
  const barHeightClasses = [
    'h-[12px]',
    'h-[22px]',
    'h-[32px]',
    'h-[42px]',
    'h-[52px]',
    'h-[62px]',
    'h-[72px]',
    'h-[82px]',
    'h-[92px]',
    'h-[102px]',
    'h-[112px]',
    'h-[120px]',
  ];

  return (
    <div className="flex items-end justify-between h-40 px-2 pt-8">
      {data.map((item, i) => {
        const ratio = item.value / maxVal;
        const barHeightClass =
          barHeightClasses[Math.min(barHeightClasses.length - 1, Math.max(0, Math.round(ratio * (barHeightClasses.length - 1))))];

        return (
          <div key={i} className="flex flex-col items-center gap-2 flex-1">
            <div
              className={cn(
                'w-10 rounded-t-lg bg-gradient-to-t from-primary to-primary/70 transition-all hover:from-primary/80 hover:to-primary/50',
                barHeightClass
              )}
            />
            <span className="text-xs text-muted-foreground">{item.day}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardPage() {
  const [trendTab, setTrendTab] = useState<'24h' | '7d' | '30d'>('24h');

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="px-6 py-5">
        {/* 页面标题 */}
        <div className="mb-5">
          <h2 className="text-lg font-semibold  text-foreground">工作台</h2>
          <p className="text-xs text-muted-foreground mt-0.5">实时监控平台运行状态与关键指标</p>
        </div>

        {/* ====== 统计卡片行 ====== */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl bg-card border border-border p-4 hover:border-border/80 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{card.title}</span>
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', card.bg)}>
                  <card.icon size={16} className={card.color} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-foreground">{card.value}</span>
                <span
                  className={cn(
                    'flex items-center gap-0.5 text-xs font-medium',
                    card.trend === 'up' ? 'text-success' : 'text-destructive'
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
          <div className="col-span-2 rounded-xl bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">API 调用量趋势</h3>
                <p className="text-xs text-muted-foreground mt-0.5">实时监控 API 调用频率与峰值</p>
              </div>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                {([
                  { key: '24h' as const, label: '24小时' },
                  { key: '7d' as const, label: '7天' },
                  { key: '30d' as const, label: '30天' },
                ]).map((tab) => (
                  <Button
                    key={tab.key}
                    variant={trendTab === tab.key ? 'secondary' : 'ghost'}
                    size="xs"
                    onClick={() => setTrendTab(tab.key)}
                    className={cn(
                      'rounded-md text-xs h-7',
                      trendTab === tab.key
                        ? 'bg-card shadow-sm'
                        : 'text-muted-foreground'
                    )}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="h-40">
              <AreaChart data={trendData} color="var(--color-brand-500)" />
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:59</span>
            </div>
          </div>

          {/* 本周活动 */}
          <div className="rounded-xl bg-card border border-border p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">本周活动</h3>
              <p className="text-xs text-muted-foreground mt-0.5">智能体日活跃调用次数</p>
            </div>
            <BarChart data={weeklyData} />
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-primary" />
                API 调用
              </div>
              <span>峰值: 周四</span>
            </div>
          </div>
        </div>

        {/* ====== 底部行：系统状态 + 智能体列表 ====== */}
        <div className="grid grid-cols-3 gap-4">
          {/* 系统状态 */}
          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server size={15} className="text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">系统状态</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-success font-medium">所有服务正常运行</span>
              </div>
            </div>
            <div className="space-y-3">
              {systemStatus.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Circle size={6} className={cn('fill-current', item.color)} />
                    <span className="text-sm text-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('text-xs font-mono font-medium', item.color)}>{item.uptime}</span>
                    <span className="text-xs text-muted-foreground">{item.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 调用量最高的智能体 */}
          <div className="col-span-2 rounded-xl bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot size={15} className="text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">调用量最高的智能体</h3>
              </div>
              <Button variant="ghost" size="xs" className="gap-1 text-xs text-muted-foreground hover:text-primary">
                查看全部
                <ChevronRight size={13} />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 text-xs font-medium text-muted-foreground">智能体</th>
                    <th className="text-left py-2.5 text-xs font-medium text-muted-foreground">模型</th>
                    <th className="text-right py-2.5 text-xs font-medium text-muted-foreground">调用次数</th>
                    <th className="text-right py-2.5 text-xs font-medium text-muted-foreground">精确度</th>
                    <th className="text-right py-2.5 text-xs font-medium text-muted-foreground">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {topAgents.map((agent) => (
                    <tr key={agent.name} className="border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                            {agent.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-foreground">{agent.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-xs text-muted-foreground">{agent.model}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm text-foreground tabular-nums">
                          {agent.usage.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">次调用</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm text-foreground">{agent.accuracy}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
                            agent.status === 'running'
                              ? 'bg-success/10 text-success'
                              : 'bg-warning/10 text-warning'
                          )}
                        >
                          <span className={cn('h-1 w-1 rounded-full', agent.status === 'running' ? 'bg-success' : 'bg-warning')} />
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
