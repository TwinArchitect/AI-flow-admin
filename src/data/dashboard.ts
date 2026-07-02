import { Zap, Bot, Activity, BarChart3 } from 'lucide-react';

export const statCards = [
  {
    title: 'API 调用量',
    value: '284K',
    change: '+12.4%',
    trend: 'up' as const,
    icon: Zap,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    title: '活跃智能体',
    value: '24',
    change: '+3',
    trend: 'up' as const,
    icon: Bot,
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    title: '平均延迟',
    value: '248ms',
    change: '-8.1%',
    trend: 'down' as const,
    icon: Activity,
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    title: 'Token 用量',
    value: '12.4亿',
    change: '+18.7%',
    trend: 'up' as const,
    icon: BarChart3,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
];

export const trendData = [40, 55, 35, 70, 50, 85, 60, 90, 75, 45, 65, 80, 55, 70, 95, 60, 85, 50, 65, 75, 45, 55, 65, 80];

export const weeklyData = [
  { day: '一', value: 35 },
  { day: '二', value: 68 },
  { day: '三', value: 52 },
  { day: '四', value: 85 },
  { day: '五', value: 78 },
  { day: '六', value: 42 },
  { day: '日', value: 30 },
];

export const systemStatus = [
  { name: '智能体运行时', uptime: '99.97%', latency: '12ms', color: 'text-success' },
  { name: '模型网关', uptime: '99.94%', latency: '38ms', color: 'text-success' },
  { name: '向量数据库', uptime: '100%', latency: '4ms', color: 'text-success' },
  { name: '工作流引擎', uptime: '99.91%', latency: '21ms', color: 'text-success' },
];

export const topAgents = [
  {
    name: '客服支持机器人',
    model: 'Claude 3.5 Sonnet',
    usage: 12840,
    accuracy: '97.3%',
    status: 'running' as const,
  },
  {
    name: '代码审查助手',
    model: 'GPT-4o',
    usage: 4392,
    accuracy: '99.1%',
    status: 'running' as const,
  },
  {
    name: '数据抽取流水线',
    model: 'Claude 3 Haiku',
    usage: 8910,
    accuracy: '94.7%',
    status: 'paused' as const,
  },
  {
    name: '内容创作助手',
    model: 'GPT-4o-mini',
    usage: 3210,
    accuracy: '91.2%',
    status: 'running' as const,
  },
];
