import { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Bot,
  MessageSquare,
  Code2,
  Database,
  BookOpen,
  FileText,
  Heart,
  Languages,
  Phone,
  Clock,
  Activity,
  Circle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 智能体图标映射
const agentIcons: Record<string, React.ElementType> = {
  robot: Bot,
  chat: MessageSquare,
  code: Code2,
  database: Database,
  book: BookOpen,
  file: FileText,
  heart: Heart,
  translate: Languages,
  phone: Phone,
  clock: Clock,
  activity: Activity,
};

// 模拟智能体数据
const agents = [
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

const statusConfig = {
  running: { label: '运行中', dotClass: 'bg-emerald-400', badgeClass: 'bg-emerald-500/10 text-emerald-600' },
  paused: { label: '已暂停', dotClass: 'bg-amber-400', badgeClass: 'bg-amber-500/10 text-amber-600' },
  error: { label: '异常', dotClass: 'bg-red-400', badgeClass: 'bg-red-500/10 text-red-600' },
};

const tagOptions = ['全部', '自然语言', '客服', '代码', '审查', '数据', 'ETL', '创作', '营销', '知识库', 'RAG', '文档', 'NLP', '分析', '翻译', '多语言'];

export function AgentsPage() {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('全部');

  // 筛选逻辑
  const filteredAgents = agents.filter((agent) => {
    const matchSearch =
      !search ||
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.desc.toLowerCase().includes(search.toLowerCase()) ||
      agent.model.toLowerCase().includes(search.toLowerCase());
    const matchTag = activeTag === '全部' || agent.tags.includes(activeTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="h-full overflow-y-auto bg-[var(--color-bg-page)]">
      <div className="px-6 py-5">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">智能体</h2>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">管理和监控所有已部署的 AI 智能体</p>
          </div>
        </div>

        {/* ====== 搜索与操作栏 ====== */}
        <div className="flex items-center justify-between mb-4">
          {/* 左侧：全局搜索 */}
          <div className="relative w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索智能体..."
              className="w-full h-9 pl-9 pr-8 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)]/30 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* 右侧：筛选 + 新建 */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--color-border-default)] text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-all">
              <SlidersHorizontal size={13} />
              筛选
            </button>
            <button className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors">
              <Plus size={14} />
              新建智能体
            </button>
          </div>
        </div>

        {/* ====== 标签筛选 ====== */}
        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
          {tagOptions.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
                activeTag === tag
                  ? 'bg-violet-500/10 text-violet-600'
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* ====== 智能体卡片网格 ====== */}
        {filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bot size={40} className="text-[var(--color-text-tertiary)]/30 mb-3" />
            <p className="text-sm text-[var(--color-text-tertiary)]">没有找到匹配的智能体</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filteredAgents.map((agent) => {
              const IconComp = agentIcons[agent.iconType] || Bot;
              const status = statusConfig[agent.status as keyof typeof statusConfig] || statusConfig.running;

              return (
                <div
                  key={agent.id}
                  className="rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-default)] p-4 hover:border-[var(--color-border-hover)] hover:shadow-sm transition-all group cursor-pointer"
                >
                  {/* 头部：图标 + 名称 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', agent.iconBg)}>
                        <IconComp size={17} className={agent.iconColor} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{agent.name}</h3>
                        <span className="text-[11px] text-[var(--color-text-tertiary)]">{agent.model}</span>
                      </div>
                    </div>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium', status.badgeClass)}>
                      <Circle size={5} className={cn('fill-current', status.dotClass)} />
                      {status.label}
                    </span>
                  </div>

                  {/* 描述 */}
                  <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed mb-3 line-clamp-2">
                    {agent.desc}
                  </p>

                  {/* 标签 */}
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {agent.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-[var(--color-bg-muted)] text-[10px] text-[var(--color-text-tertiary)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 底部统计 */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-default)]">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-xs text-[var(--color-text-tertiary)]">调用</span>
                        <span className="text-sm font-semibold text-[var(--color-text-primary)] ml-1 tabular-nums">
                          {agent.calls.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-[var(--color-text-tertiary)]">成功率</span>
                        <span className="text-sm font-semibold text-[var(--color-text-primary)] ml-1">
                          {agent.successRate}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)]">
                      <Clock size={10} />
                      {agent.updatedAt}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
