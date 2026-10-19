import { http } from '@/api/client';
const getApi = <T,>(url: string) => http.get<T>(url).then((response) => response.data);
import type {
  AgentMonitorDateRange,
  AgentMonitorMetricsVo,
  AgentMonitorSummaryVo,
  AgentMonitorTrendPointVo,
  AgentMonitorTrendsVo
} from './agentMonitorTypes';

const BASE = '/gpt/base/agent';

function buildDateQuery(range?: Partial<AgentMonitorDateRange>) {
  if (!range?.startDate && !range?.endDate) return '';
  const qs = new URLSearchParams();
  if (range.startDate) qs.set('startDate', range.startDate);
  if (range.endDate) qs.set('endDate', range.endDate);
  const query = qs.toString();
  return query ? `?${query}` : '';
}

export function getAgentMonitorSummary(agentId: string) {
  return getApi<AgentMonitorSummaryVo>(`${BASE}/${agentId}/monitor/summary`);
}

export function getAgentMonitorMetrics(agentId: string, range?: Partial<AgentMonitorDateRange>) {
  return getApi<AgentMonitorMetricsVo>(`${BASE}/${agentId}/monitor/metrics${buildDateQuery(range)}`);
}

export function getAgentMonitorUserTrend(agentId: string, range?: Partial<AgentMonitorDateRange>) {
  return getApi<AgentMonitorTrendPointVo[]>(`${BASE}/${agentId}/monitor/trends/users${buildDateQuery(range)}`);
}

export function getAgentMonitorChatTrend(agentId: string, range?: Partial<AgentMonitorDateRange>) {
  return getApi<AgentMonitorTrendPointVo[]>(`${BASE}/${agentId}/monitor/trends/chats${buildDateQuery(range)}`);
}

export function getAgentMonitorFeedbackTrend(agentId: string, range?: Partial<AgentMonitorDateRange>) {
  return getApi<AgentMonitorTrendPointVo[]>(
    `${BASE}/${agentId}/monitor/trends/feedback${buildDateQuery(range)}`
  );
}

export function getAgentMonitorAvgDurationTrend(agentId: string, range?: Partial<AgentMonitorDateRange>) {
  return getApi<AgentMonitorTrendPointVo[]>(
    `${BASE}/${agentId}/monitor/trends/avg-duration${buildDateQuery(range)}`
  );
}

export function getAgentMonitorTokenTrend(agentId: string, range?: Partial<AgentMonitorDateRange>) {
  return getApi<AgentMonitorTrendPointVo[]>(
    `${BASE}/${agentId}/monitor/trends/tokens${buildDateQuery(range)}`
  );
}

/** 兼容旧版聚合趋势接口 */
export function getAgentMonitorTrends(agentId: string, days = 30) {
  return getApi<AgentMonitorTrendsVo>(`${BASE}/${agentId}/monitor/trends?days=${days}`);
}

export function formatMonitorDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonitorPresetRange(preset: '7d' | '14d' | '30d'): AgentMonitorDateRange {
  const end = new Date();
  const start = new Date();
  const offset = preset === '7d' ? 6 : preset === '14d' ? 13 : 29;
  start.setDate(end.getDate() - offset);
  return {
    startDate: formatMonitorDate(start),
    endDate: formatMonitorDate(end)
  };
}

export function formatChartDateLabel(date: string) {
  const segments = date.split('-');
  if (segments.length === 3) {
    return `${segments[1]}-${segments[2]}`;
  }
  return date;
}

export function mergeMonitorTrendPoints(
  users: AgentMonitorTrendPointVo[],
  chats: AgentMonitorTrendPointVo[],
  feedback: AgentMonitorTrendPointVo[],
  avgDuration: AgentMonitorTrendPointVo[],
  tokens: AgentMonitorTrendPointVo[] = []
) {
  const dateSet = new Set<string>();
  [...users, ...chats, ...feedback, ...avgDuration, ...tokens].forEach((point) =>
    dateSet.add(point.date)
  );
  const dates = Array.from(dateSet).sort();

  const toMap = (list: AgentMonitorTrendPointVo[]) =>
    new Map(list.map((point) => [point.date, point.value ?? 0]));

  const userMap = toMap(users);
  const chatMap = toMap(chats);
  const feedbackMap = toMap(feedback);
  const durationMap = toMap(avgDuration);
  const tokenMap = toMap(tokens);

  return dates.map((date) => ({
    date,
    label: formatChartDateLabel(date),
    users: userMap.get(date) ?? 0,
    sessions: chatMap.get(date) ?? 0,
    feedback: feedbackMap.get(date) ?? 0,
    runtime: durationMap.get(date) ?? 0,
    tokens: tokenMap.get(date) ?? 0
  }));
}
