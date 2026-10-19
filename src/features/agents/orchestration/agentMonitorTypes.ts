export type AgentMonitorSummaryVo = {
  totalUsers?: number;
  totalChats?: number;
  totalTokens?: number;
};

export type AgentMonitorMetricsVo = {
  userCount?: number;
  chatCount?: number;
  feedbackCount?: number;
  avgDurationSeconds?: number;
  tokenCount?: number;
};

export type AgentMonitorTrendPointVo = {
  date: string;
  value: number;
};

export type AgentMonitorDateRange = {
  startDate: string;
  endDate: string;
};

export type AgentMonitorTrendsVo = {
  userTrend?: AgentMonitorTrendPointVo[];
  chatTrend?: AgentMonitorTrendPointVo[];
  feedbackTrend?: AgentMonitorTrendPointVo[];
  feedbackLikeTrend?: AgentMonitorTrendPointVo[];
  feedbackDislikeTrend?: AgentMonitorTrendPointVo[];
  avgDurationTrend?: AgentMonitorTrendPointVo[];
  tokenTrend?: AgentMonitorTrendPointVo[];
};

export type AgentMonitorChartPoint = {
  date: string;
  label: string;
  users: number;
  sessions: number;
  feedback: number;
  runtime: number;
  tokens: number;
};
