import type { Prohibition, Citation, ChartDataPoint, ViolationItem, QuickAction } from './types';

export const prohibitions: Prohibition[] = [
  { num: '01', title: '无票不上岗', desc: '严禁无凭证、无作业票进行现场作业。' },
  { num: '02', title: '安全带高挂', desc: '严禁高处作业不系安全带或不规范防坠措施。' },
  { num: '03', title: '红线不饮酒', desc: '严禁在岗作业、值班交接前饮用任何含酒精饮料。' },
  { num: '04', title: '盲目不强令', desc: '严禁任何级管理人员违章指挥或抢令冒险。' },
  { num: '05', title: '绝缘不带电', desc: '严禁未穿戴合适绝缘防护进行带电检修。' },
  { num: '06', title: '空间不蛮干', desc: '有限空间应遵循"先通风、后检测、再作业"。' },
  { num: '07', title: '防线不乱拆', desc: '严禁擅自拆除、挪用安全隔离网与警示牌。' },
  { num: '08', title: '无证不开机', desc: '严禁无国家特种作业证驾驶工程车及吊车。' },
  { num: '09', title: '监护不空岗', desc: '起重吊装、动火作业中现场监护人不得擅离。' },
  { num: '10', title: '资质不挂靠', desc: '严禁无资质或不合规队伍承揽生产现场项目。' },
];

export const citations: Citation[] = [
  { title: '《国网安规（变电）第3.2.1条》', code: 'SGCC-SAFE' },
  { title: '《电力建设安全生产监督管理办法》', code: 'NEA-RULE' },
];

export const chartData: ChartDataPoint[] = [
  { date: '05-27', 进站: 145, 出站: 138 },
  { date: '05-28', 进站: 160, 出站: 155 },
  { date: '05-29', 进站: 185, 出站: 180 },
  { date: '05-30', 进站: 192, 出站: 188 },
  { date: '05-31', 进站: 150, 出站: 158 },
  { date: '06-01', 进站: 95, 出站: 90 },
  { date: '06-02', 进站: 178, 出站: 170 },
];

export const pieData: ViolationItem[] = [
  { name: '未戴安全帽', value: 4, color: '#ef4444' },
  { name: '高处无安全带', value: 2, color: '#f97316' },
  { name: '受限空间违规', value: 1, color: '#a855f7' },
  { name: '违规接电', value: 3, color: '#eab308' },
  { name: '吸烟违规', value: 2, color: '#6366f1' },
];

export const quickActions: QuickAction[] = [
  {
    label: '📜 防止伤害：安全十条禁令',
    prompt: '我想了解安监管理的十条禁令有哪些？',
    desc: '查询移动端紧凑型列表组件折叠适配',
  },
  {
    label: '📊 进出电厂：周人数分析图谱',
    prompt: '帮我查看近7天电厂进出人数统计趋势',
    desc: '生成移动端窄屏 Area 折线阴影统计图',
  },
  {
    label: '⚠️ 违章统计：今日安全警示明细',
    prompt: '今日现场拍板违章事件主要有哪些情况？',
    desc: '生成紧凑版 PieChart 中空占比与告警警示',
  },
];

export const totalViolations = pieData.reduce((acc, curr) => acc + curr.value, 0);
