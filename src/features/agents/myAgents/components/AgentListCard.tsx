/**
 * AgentListCard — 智能体列表卡片
 * 迁移映射（原型 → 目标）：
 *   bg-white dark:bg-slate-900 → bg-card
 *   border-slate-200 → border-border
 *   text-slate-* → text-foreground / text-muted-foreground
 *   text-indigo-* / bg-indigo-* → text-primary / bg-primary/10
 *   bg-brand-* → bg-primary
 *   text-sky-* → 保留 sky 色（功能色标识）
 *   text-emerald-500 / bg-emerald-500 → text-success / bg-success
 *   text-rose-* → text-destructive
 *   hover:bg-slate-50 → hover:bg-accent
 *   hover:border-indigo-* → hover:border-primary
 */

import { useState } from 'react';
import { Layers, MessageCircle, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AgentOpenSysAgent } from '@/types/agent';
import { agentStatusLabel, agentFlowTypeLabel, formatAgentEditTime, parseAgentTagIds } from '@/types/agent';
import { MOCK_LABELS } from '../data/agentsMock';

interface AgentListCardProps {
  agent: AgentOpenSysAgent;
  onOpen: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export function AgentListCard({ agent, onOpen, onDelete, onEdit }: AgentListCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isWorkflow = agent.flowType !== 0;
  const editTime = formatAgentEditTime(agent.updateTime ?? agent.createTime);
  const tagIds = parseAgentTagIds(agent.type);
  const tagNames = tagIds
    .map((id) => MOCK_LABELS.find((l) => l.id === id)?.name ?? id)
    .filter(Boolean);

  return (
    <article
      className="bg-card rounded-2xl border border-border p-5 flex flex-col h-full min-h-[260px] group hover:shadow-md hover:border-primary/50 transition-all cursor-pointer"
      onClick={onOpen}
    >
      {/* 头部：图标 + 名称 + 菜单 */}
      <div className="flex items-start justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
            {agent.agentName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-primary leading-snug line-clamp-2 group-hover:text-primary/80">
              {agent.agentName}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {agent.username?.trim() || agent.creator?.trim() || '未知用户'}
            </p>
          </div>
        </div>

        {/* 菜单按钮 */}
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost" size="icon-xs"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="text-muted-foreground"
          >
            <MoreVertical size={16} />
          </Button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-xl shadow-xl z-20 py-1"
              onClick={() => setMenuOpen(false)}
            >
              <Button variant="ghost" size="sm" onClick={onEdit}
                className="w-full justify-start gap-2 px-3 text-xs font-medium rounded-none">
                <Edit3 size={14} /> 修改信息
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setMenuOpen(false); onOpen(); }}
                className="w-full justify-start gap-2 px-3 text-xs font-medium rounded-none">
                <Layers size={14} /> 编辑编排
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}
                className="w-full justify-start gap-2 px-3 text-xs font-medium text-destructive hover:text-destructive rounded-none">
                <Trash2 size={14} /> 删除
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 描述 */}
      <div className="flex-1 min-h-0 space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {agent.remark || '暂无描述'}
        </p>

        {/* 标签 */}
        {tagNames.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {tagNames.map((name) => (
              <Badge key={name} variant="secondary" className="text-[10px] font-medium">
                #{name}
              </Badge>
            ))}
          </div>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <span className={cn('w-1.5 h-1.5 rounded-full', agent.status === 1 ? 'bg-success' : 'bg-muted-foreground/40')} />
            <span className="text-[11px] text-muted-foreground">{agentStatusLabel(agent.status)}</span>
          </div>
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium',
            isWorkflow
              ? 'bg-primary/10 text-primary'
              : 'bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400',
          )}>
            {isWorkflow ? <Layers size={11} /> : <MessageCircle size={11} />}
            {agentFlowTypeLabel(agent.flowType)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className="text-primary font-medium">最近编辑</span>
          <span className="text-muted-foreground tabular-nums">{editTime}</span>
        </div>
      </div>
    </article>
  );
}
