import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  Clock,
  Coins,
  Download,
  Info,
  Loader2,
  MessageSquare,
  RefreshCw,
  ThumbsUp,
  Users
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  getAgentMonitorAvgDurationTrend,
  getAgentMonitorChatTrend,
  getAgentMonitorFeedbackTrend,
  getAgentMonitorMetrics,
  getAgentMonitorSummary,
  getAgentMonitorTokenTrend,
  getAgentMonitorUserTrend,
  getMonitorPresetRange,
  mergeMonitorTrendPoints
} from './agentMonitorApi';
import type {
  AgentMonitorChartPoint,
  AgentMonitorMetricsVo,
  AgentMonitorSummaryVo
} from './agentMonitorTypes';

type TimeRangePreset = '7d' | '14d' | '30d';

interface AgentTrafficMonitorProps {
  agentId: string;
  onError?: (message: string) => void;
}

function formatNumber(value?: number) {
  if (value == null || Number.isNaN(value)) return '0';
  return value.toLocaleString('zh-CN');
}

function formatDuration(value?: number) {
  if (value == null || Number.isNaN(value)) return '0.00';
  return value.toFixed(2);
}

export default function AgentTrafficMonitor({ agentId, onError }: AgentTrafficMonitorProps) {
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('7d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<AgentMonitorSummaryVo | null>(null);
  const [metrics, setMetrics] = useState<AgentMonitorMetricsVo | null>(null);
  const [trendData, setTrendData] = useState<AgentMonitorChartPoint[]>([]);

  const loadData = useCallback(
    async (silent = false) => {
      if (!agentId) return;
      if (silent) setRefreshing(true);
      else setLoading(true);

      const range = getMonitorPresetRange(timeRange);

      try {
        const [summaryRes, metricsRes, userTrend, chatTrend, feedbackTrend, durationTrend, tokenTrend] =
          await Promise.all([
            getAgentMonitorSummary(agentId),
            getAgentMonitorMetrics(agentId, range),
            getAgentMonitorUserTrend(agentId, range),
            getAgentMonitorChatTrend(agentId, range),
            getAgentMonitorFeedbackTrend(agentId, range),
            getAgentMonitorAvgDurationTrend(agentId, range),
            getAgentMonitorTokenTrend(agentId, range)
          ]);

        setSummary(summaryRes);
        setMetrics(metricsRes);
        setTrendData(
          mergeMonitorTrendPoints(
            Array.isArray(userTrend) ? userTrend : [],
            Array.isArray(chatTrend) ? chatTrend : [],
            Array.isArray(feedbackTrend) ? feedbackTrend : [],
            Array.isArray(durationTrend) ? durationTrend : [],
            Array.isArray(tokenTrend) ? tokenTrend : []
          )
        );
      } catch (err) {
        onError?.(err instanceof Error ? err.message : '加载监控数据失败');
        setSummary(null);
        setMetrics(null);
        setTrendData([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [agentId, onError, timeRange]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const periodStats = useMemo(
    () => [
      {
        label: '活跃用户数',
        value: formatNumber(metrics?.userCount),
        unit: '人',
        desc: '所选时段去重活跃用户',
        icon: <Users size={20} className="text-cyan-600" />,
        cardBg: 'from-cyan-50/70 to-sky-50/70 dark:from-cyan-950/20 dark:to-sky-950/20 border-cyan-100/90 dark:border-cyan-900/40'
      },
      {
        label: '会话次数',
        value: formatNumber(metrics?.chatCount),
        unit: '次',
        desc: '所选时段 run 总次数',
        icon: <MessageSquare size={20} className="text-blue-600" />,
        cardBg: 'from-blue-50/70 to-indigo-50/70 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100/90 dark:border-blue-900/40'
      },
      {
        label: '用户反馈',
        value: formatNumber(metrics?.feedbackCount),
        unit: '次',
        desc: '点赞与点踩合计',
        icon: <ThumbsUp size={18} className="text-emerald-600" />,
        cardBg:
          'from-emerald-50/70 to-teal-50/70 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-100/90 dark:border-emerald-900/40'
      },
      {
        label: '平均运行时长',
        value: formatDuration(metrics?.avgDurationSeconds),
        unit: 's',
        desc: '所选时段加权平均耗时',
        icon: <Clock size={20} className="text-purple-600" />,
        cardBg:
          'from-purple-50/70 to-violet-50/70 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-100/90 dark:border-purple-900/40'
      }
    ],
    [metrics]
  );

  const handleExport = () => {
    if (!trendData.length) return;
    const header = 'date,users,sessions,feedback,avg_duration_seconds,tokens\n';
    const rows = trendData
      .map(
        (row) =>
          `${row.date},${row.users},${row.sessions},${row.feedback},${row.runtime},${row.tokens}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agent-monitor-${agentId}-${timeRange}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const rangeLabel = timeRange === '7d' ? '近 7 天' : timeRange === '14d' ? '近 14 天' : '近 30 天';

  return (
    <div className="w-full flex flex-col min-h-0 bg-muted/30 bg-card/40 overflow-y-auto custom-scrollbar flex-1 p-6 md:p-8 text-foreground text-muted-foreground">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <Badge variant="accent" className="mb-2">
              <Activity size={13} />
              运行监控
            </Badge>
            <h2 className="text-lg font-bold text-foreground">流量监控看板</h2>
            <p className="text-xs text-muted-foreground mt-1">
              统计 Web 调试与开放 API 调用数据，刷盘延迟约 3 秒
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-card rounded-xl p-1 border border-border shadow-sm">
              {(['7d', '14d', '30d'] as TimeRangePreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTimeRange(preset)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    timeRange === preset
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground hover:text-foreground'
                  }`}
                >
                  {preset === '7d' ? '近 7 天' : preset === '14d' ? '近 14 天' : '近 30 天'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void loadData(true)}
              disabled={loading || refreshing}
              className="p-2 text-muted-foreground hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-xl border border-border bg-card disabled:opacity-50"
              title="刷新"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={!trendData.length}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl disabled:opacity-40"
            >
              <Download size={14} />
              导出 CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground text-sm gap-2">
            <Loader2 size={18} className="animate-spin" />
            加载监控数据...
          </div>
        ) : (
          <div className="space-y-6">
            {/* 累计指标 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    累计活跃用户
                  </span>
                  <Users size={18} className="text-cyan-500" />
                </div>
                <p className="mt-3 text-3xl font-black text-foreground">
                  {formatNumber(summary?.totalUsers)}
                  <span className="text-sm font-bold text-muted-foreground ml-1">人</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-2">全生命周期去重活跃用户</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    累计会话次数
                  </span>
                  <MessageSquare size={18} className="text-blue-500" />
                </div>
                <p className="mt-3 text-3xl font-black text-foreground">
                  {formatNumber(summary?.totalChats)}
                  <span className="text-sm font-bold text-muted-foreground ml-1">次</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-2">Web + 开放 API 累计 run 次数</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    累计消耗 Token
                  </span>
                  <Coins size={18} className="text-amber-500" />
                </div>
                <p className="mt-3 text-3xl font-black text-foreground">
                  {formatNumber(summary?.totalTokens)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-2">AI 对话输出 token 估算（全生命周期）</p>
              </div>
            </div>

            <p className="text-xs font-semibold text-muted-foreground">{rangeLabel}指标汇总</p>

            {/* 时段指标 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {periodStats.map((card) => (
                <div
                  key={card.label}
                  className={`bg-gradient-to-br ${card.cardBg} border backdrop-blur-md rounded-2xl p-5 shadow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                      {card.label}
                    </span>
                    <div className="p-2 bg-card rounded-xl border border-border shadow-sm">
                      {card.icon}
                    </div>
                  </div>
                  <div className="my-4 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-foreground tracking-tight">
                      {card.value}
                    </span>
                    {card.unit && <span className="text-xs text-muted-foreground font-bold">{card.unit}</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium border-t border-border/50 border-border/50 pt-3">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* 趋势图 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <TrendCard
                title="用户数趋势"
                subtitle="每日去重活跃用户"
                badge="用户数"
                badgeVariant="info"
                icon={<Users className="text-cyan-500" size={17} />}
                empty={!trendData.length}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="monitorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#0891b2"
                      strokeWidth={2.5}
                      fill="url(#monitorUsers)"
                      name="用户数"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </TrendCard>

              <TrendCard
                title="会话次数趋势"
                subtitle="每日 run 次数"
                badge="会话次数"
                badgeVariant="info"
                icon={<MessageSquare className="text-blue-500" size={17} />}
                empty={!trendData.length}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="monitorSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fill="url(#monitorSessions)"
                      name="会话次数"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </TrendCard>

              <TrendCard
                title="用户反馈趋势"
                subtitle="每日点赞 + 点踩合计"
                badge="反馈次数"
                badgeVariant="success"
                icon={<ThumbsUp className="text-emerald-500" size={16} />}
                empty={!trendData.length}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="feedback"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 1 }}
                      name="反馈次数"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TrendCard>

              <TrendCard
                title="平均运行时长趋势"
                subtitle="每日加权平均耗时（秒）"
                badge="平均时长(s)"
                badgeVariant="accent"
                icon={<Clock className="text-purple-500" size={17} />}
                empty={!trendData.length}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="runtime" fill="#a855f7" radius={[4, 4, 0, 0]} name="平均时长(s)" barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </TrendCard>
            </div>

            <TrendCard
              title="Token 消耗趋势"
              subtitle="每日 AI 对话输出 token 估算合计"
              badge="Token"
              badgeVariant="warning"
              icon={<Coins className="text-amber-500" size={17} />}
              empty={!trendData.length}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="monitorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    stroke="#d97706"
                    strokeWidth={2.5}
                    fill="url(#monitorTokens)"
                    name="Token"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TrendCard>
          </div>
        )}
      </div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((item, index) => (
        <p key={index} className="font-bold text-foreground text-foreground" style={{ color: item.color }}>
          {item.name}：{item.value}
        </p>
      ))}
    </div>
  );
}

function TrendCard({
  title,
  subtitle,
  badge,
  badgeVariant,
  icon,
  children,
  empty
}: {
  title: string;
  subtitle: string;
  badge: string;
  badgeVariant: BadgeVariant;
  icon: ReactNode;
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="bg-card border border-border/85 border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-foreground text-foreground truncate">{title}</h3>
            <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
          </div>
          <Info size={13} className="text-muted-foreground shrink-0" aria-label={subtitle} />
        </div>
        <Badge variant={badgeVariant} className="font-mono">{badge}</Badge>
      </div>
      <div className="h-56 w-full">
        {empty ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">暂无趋势数据</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
