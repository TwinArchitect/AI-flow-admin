import type { AgentLabel } from '@/types/agent';

export const MOCK_TAGS: AgentLabel[] = [
  { id: 't1', name: '客服', status: 1, category: 'mine', description: '客服相关标签', sort: 1, createTime: '2026-06-01 10:30', updateTime: '2026-07-14 15:22' },
  { id: 't2', name: '数据分析', status: 1, category: 'mine', description: '数据分析相关标签', sort: 2, createTime: '2026-06-05 09:00', updateTime: '2026-07-14 14:10' },
  { id: 't3', name: '代码审查', status: 1, category: 'system', description: '代码审查与质量分析', sort: 3, createTime: '2026-06-10 11:20', updateTime: '2026-07-13 16:45' },
  { id: 't4', name: 'NLP', status: 0, category: 'mine', description: '自然语言处理', sort: 4, createTime: '2026-06-15 08:30', updateTime: '2026-07-12 10:00' },
  { id: 't5', name: 'RAG', status: 1, category: 'system', description: '检索增强生成', sort: 5, createTime: '2026-06-18 14:00', updateTime: '2026-07-11 09:30' },
  { id: 't6', name: '安全', status: 1, category: 'business', description: '安全检测与防护', sort: 6, createTime: '2026-06-20 16:00', updateTime: '2026-07-10 11:15' },
  { id: 't7', name: '翻译', status: 0, category: 'mine', description: '多语言翻译', sort: 7, createTime: '2026-06-22 10:00', updateTime: '2026-07-09 14:20' },
  { id: 't8', name: '文档处理', status: 1, category: 'business', description: '文档分析与处理', sort: 8, createTime: '2026-06-25 09:30', updateTime: '2026-07-08 17:00' },
];

export const PAGE_SIZE = 10;
