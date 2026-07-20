import type { AgentOpenSysAgent, AgentLabel } from '@/types/agent';

export const MOCK_LABELS: AgentLabel[] = [
  { id: 'tag-cs', name: '客服' },
  { id: 'tag-data', name: '数据分析' },
  { id: 'tag-code', name: '代码' },
  { id: 'tag-nlp', name: 'NLP' },
  { id: 'tag-rag', name: 'RAG' },
  { id: 'tag-sec', name: '安全' },
];

export const MOCK_AGENTS: AgentOpenSysAgent[] = [
  {
    id: 'a1', agentName: '客服支持机器人', flowType: 0, status: 1,
    type: JSON.stringify(['tag-cs']), remark: '智能客服系统，支持多轮对话、意图识别、问题分类与自动转接，7×24小时在线服务',
    creator: 'admin', createTime: '2026-06-01 10:30', updateTime: '2026-07-14 15:22', username: '张昊',
  },
  {
    id: 'a2', agentName: '代码审查助手', flowType: 0, status: 1,
    type: JSON.stringify(['tag-code']), remark: '自动化代码审查工具，检测潜在漏洞、性能问题与代码规范，支持 20+ 编程语言',
    creator: 'admin', createTime: '2026-06-05 09:00', updateTime: '2026-07-14 14:10', username: '李工',
  },
  {
    id: 'a3', agentName: '数据抽取流水线', flowType: 1, status: 1,
    type: JSON.stringify(['tag-data']), remark: '结构化数据自动抽取引擎，支持数据库、API、文件等多源数据接入与清洗转换',
    creator: 'admin', createTime: '2026-06-10 11:20', updateTime: '2026-07-13 16:45', username: '王工',
  },
  {
    id: 'a4', agentName: '内容创作助手', flowType: 0, status: 0,
    type: JSON.stringify(['tag-nlp']), remark: 'AI 驱动的内容生成工具，覆盖营销文案、产品描述、社交媒体推文等场景',
    creator: 'admin', createTime: '2026-06-15 08:30', updateTime: '2026-07-12 10:00', username: '赵编辑',
  },
  {
    id: 'a5', agentName: '知识问答助手', flowType: 0, status: 1,
    type: JSON.stringify(['tag-rag', 'tag-nlp']), remark: '基于 RAG 技术的企业知识库智能检索问答，支持多文档类型与语义搜索',
    creator: 'admin', createTime: '2026-06-18 14:00', updateTime: '2026-07-11 09:30', username: '陈工',
  },
  {
    id: 'a6', agentName: '安全检查专家', flowType: 1, status: 1,
    type: JSON.stringify(['tag-sec', 'tag-data']), remark: '基于视觉识别与规则引擎的现场安全检查智能体，自动识别违章行为并生成报告',
    creator: 'admin', createTime: '2026-06-20 16:00', updateTime: '2026-07-10 11:15', username: '刘安全',
  },
  {
    id: 'a7', agentName: '情感分析引擎', flowType: 0, status: 0,
    type: JSON.stringify(['tag-nlp', 'tag-data']), remark: '文本情感识别与分析系统，支持细粒度情感分类与趋势统计报告生成',
    creator: 'admin', createTime: '2026-06-22 10:00', updateTime: '2026-07-09 14:20', username: '孙工',
  },
  {
    id: 'a8', agentName: '多语言翻译器', flowType: 0, status: 1,
    type: JSON.stringify(['tag-nlp']), remark: '高精度多语言实时翻译引擎，覆盖 50+ 语言对，支持行业术语自定义配置',
    creator: 'admin', createTime: '2026-06-25 09:30', updateTime: '2026-07-08 17:00', username: '周翻译',
  },
];
