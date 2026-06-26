export interface Agent {
  id: string;
  name: string;
  model: string;
  desc: string;
  tags: string[];
  iconType: string;
  iconBg: string;
  iconColor: string;
  calls: number;
  successRate: string;
  status: 'running' | 'paused' | 'error';
  updatedAt: string;
}

export const agents: Agent[] = [
  {
    id: 'a1',
    name: '客服支持机器人',
    model: 'Claude 3.5 Sonnet',
    desc: '智能客服系统，支持多轮对话、意图识别、问题分类与自动转接，7×24小时在线服务',
    tags: ['自然语言', '客服'],
    iconType: 'chat',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
    calls: 12840,
    successRate: '97.3%',
    status: 'running',
    updatedAt: '2 小时前',
  },
  {
    id: 'a2',
    name: '代码审查助手',
    model: 'GPT-4o',
    desc: '自动化代码审查工具，检测潜在漏洞、性能问题与代码规范，支持 20+ 编程语言',
    tags: ['代码', '审查'],
    iconType: 'code',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    calls: 4392,
    successRate: '99.1%',
    status: 'running',
    updatedAt: '15 分钟前',
  },
  {
    id: 'a3',
    name: '数据抽取流水线',
    model: 'Claude 3 Haiku',
    desc: '结构化数据自动抽取引擎，支持数据库、API、文件等多源数据接入与清洗转换',
    tags: ['数据', 'ETL'],
    iconType: 'database',
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-500',
    calls: 8910,
    successRate: '94.7%',
    status: 'paused',
    updatedAt: '昨天',
  },
  {
    id: 'a4',
    name: '内容创作助手',
    model: 'GPT-4o-mini',
    desc: 'AI 驱动力内容生成工具，覆盖营销文案、产品描述、社交媒体推文等多场景',
    tags: ['创作', '营销'],
    iconType: 'file',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    calls: 3210,
    successRate: '91.2%',
    status: 'error',
    updatedAt: '3 小时前',
  },
  {
    id: 'a5',
    name: '知识问答助手',
    model: 'Claude 3 Opus',
    desc: '基于 RAG 技术的企业知识库智能检索问答，支持多文档类型与语义搜索',
    tags: ['知识库', 'RAG'],
    iconType: 'book',
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-500',
    calls: 6720,
    successRate: '96.8%',
    status: 'running',
    updatedAt: '1 小时前',
  },
  {
    id: 'a6',
    name: '文档摘要生成',
    model: 'GPT-4o',
    desc: '长文档自动摘要与关键信息提取，支持 PDF、Word、网页等多种格式输入',
    tags: ['文档', 'NLP'],
    iconType: 'file',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-500',
    calls: 2530,
    successRate: '93.5%',
    status: 'running',
    updatedAt: '30 分钟前',
  },
  {
    id: 'a7',
    name: '情感分析引擎',
    model: 'Claude 3.5 Sonnet',
    desc: '文本情感识别与分析系统，支持细粒度情感分类与趋势统计报告生成',
    tags: ['NLP', '分析'],
    iconType: 'heart',
    iconBg: 'bg-pink-500/10',
    iconColor: 'text-pink-500',
    calls: 4580,
    successRate: '88.9%',
    status: 'paused',
    updatedAt: '5 小时前',
  },
  {
    id: 'a8',
    name: '多语言翻译器',
    model: 'GPT-4o-mini',
    desc: '高精度多语言实时翻译引擎，覆盖 50+ 语言对，支持行业术语自定义配置',
    tags: ['翻译', '多语言'],
    iconType: 'translate',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-500',
    calls: 7800,
    successRate: '95.4%',
    status: 'running',
    updatedAt: '4 小时前',
  },
];

export const statusConfig = {
  running: { label: '运行中', dotClass: 'bg-emerald-400', badgeClass: 'bg-emerald-500/10 text-emerald-600' },
  paused: { label: '已暂停', dotClass: 'bg-amber-400', badgeClass: 'bg-amber-500/10 text-amber-600' },
  error: { label: '异常', dotClass: 'bg-red-400', badgeClass: 'bg-red-500/10 text-red-600' },
};

export const tagOptions = [
  '全部', '自然语言', '客服', '代码', '审查', '数据', 'ETL',
  '创作', '营销', '知识库', 'RAG', '文档', 'NLP', '分析', '翻译', '多语言',
];
