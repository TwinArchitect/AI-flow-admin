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
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { agents, statusConfig, tagOptions } from '@/data/agents';

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

export function AgentsPage() {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('全部');

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
    <div className="h-full overflow-y-auto bg-background">
      <div className="px-6 py-5">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">智能体</h2>
            <p className="text-xs text-muted-foreground mt-0.5">管理和监控所有已部署的 AI 智能体</p>
          </div>
        </div>

        {/* ====== 搜索与操作栏 ====== */}
        <div className="flex items-center justify-between mb-4">
          {/* 左侧：搜索 */}
          <div className="relative w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索智能体..."
              className="pl-9 pr-8 h-9 rounded-lg text-sm"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setSearch('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <span className="sr-only">清除</span>
                <span aria-hidden>×</span>
              </Button>
            )}
          </div>

          {/* 右侧：筛选 + 新建 */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5">
              <SlidersHorizontal size={13} />
              筛选
            </Button>
            <Button size="sm" className="h-9 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus size={14} />
              新建智能体
            </Button>
          </div>
        </div>

        {/* ====== 标签筛选 ====== */}
        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
          {tagOptions.map((tag) => (
            <Button
              key={tag}
              variant={activeTag === tag ? 'secondary' : 'ghost'}
              size="xs"
              onClick={() => setActiveTag(tag)}
              className={cn(
                'text-[11px]',
                activeTag === tag && 'bg-primary/10 text-primary hover:bg-primary/15'
              )}
            >
              {tag}
            </Button>
          ))}
        </div>

        {/* ====== 智能体卡片网格 ====== */}
        {filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bot size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">没有找到匹配的智能体</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filteredAgents.map((agent) => {
              const IconComp = agentIcons[agent.iconType] || Bot;
              const status = statusConfig[agent.status] || statusConfig.running;

              return (
                <div
                  key={agent.id}
                  className="rounded-xl bg-card border border-border p-4 hover:border-border/80 hover:shadow-sm transition-all group cursor-pointer"
                >
                  {/* 头部：图标 + 名称 + 状态 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', agent.iconBg)}>
                        <IconComp size={17} className={agent.iconColor} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                        <span className="text-[11px] text-muted-foreground">{agent.model}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('gap-1 text-[10px]', status.badgeClass)}>
                      <Circle size={5} className={cn('fill-current', status.dotClass)} />
                      {status.label}
                    </Badge>
                  </div>

                  {/* 描述 */}
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                    {agent.desc}
                  </p>

                  {/* 标签 */}
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {agent.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* 底部统计 */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-xs text-muted-foreground">调用</span>
                        <span className="text-sm font-semibold text-foreground ml-1 tabular-nums">
                          {agent.calls.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">成功率</span>
                        <span className="text-sm font-semibold text-foreground ml-1">
                          {agent.successRate}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
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
