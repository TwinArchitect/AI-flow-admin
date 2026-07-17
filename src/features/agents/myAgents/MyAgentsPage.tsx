/**
 * MyAgentsPage — 我的智能体
 *
 * 迁移映射（原型 → 目标）：
 *   bg-white dark:bg-slate-900 → bg-card / bg-background
 *   bg-slate-50 → bg-muted
 *   text-slate-900 dark:text-white → text-foreground
 *   text-slate-500/400 → text-muted-foreground
 *   text-slate-600 dark:text-slate-300 → text-foreground/80
 *   border-slate-100/200 → border-border
 *   bg-brand-600 → bg-primary
 *   hover:bg-brand-700 → hover:bg-primary/90
 *   bg-slate-100 dark:bg-slate-800 → bg-accent
 *   text-rose-* → text-destructive
 *   hover:bg-rose-50 → hover:bg-destructive/10
 *   text-[11px] / text-[10px] → text-xs / text-2xs
 */

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleHelp, Filter, Loader2, Plus, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AgentListCard } from './components/AgentListCard';
import { CreateAgentDialog } from './components/CreateAgentDialog';
import { MOCK_AGENTS, MOCK_LABELS } from './data/agentsMock';
import type { AgentOpenSysAgent } from '@/types/agent';
import { resolveAgentTagNames, parseAgentTagIds } from '@/types/agent';

const statusOptions = [
  { value: 'all' as const, label: '全部状态' },
  { value: '0' as const, label: '未发布' },
  { value: '1' as const, label: '已发布' },
];

export function MyAgentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | '0' | '1'>('all');
  const [selectedTagId, setSelectedTagId] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading] = useState(false);
  const [agents] = useState<AgentOpenSysAgent[]>(MOCK_AGENTS);
  const [deleteTarget, setDeleteTarget] = useState<AgentOpenSysAgent | null>(null);
  const [editTarget, setEditTarget] = useState<AgentOpenSysAgent | null>(null);

  /* ─── 搜索过滤 ─── */
  const agentsAfterSearch = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword)
      return agents.filter((a) => selectedStatus === 'all' || String(a.status) === selectedStatus);
    return agents.filter((agent) => {
      if (selectedStatus !== 'all' && String(agent.status) !== selectedStatus) return false;
      const tagText = resolveAgentTagNames(agent.type, MOCK_LABELS).join(' ').toLowerCase();
      return (
        agent.agentName?.toLowerCase().includes(keyword) ||
        agent.remark?.toLowerCase().includes(keyword) ||
        tagText.includes(keyword)
      );
    });
  }, [agents, appliedSearch, selectedStatus]);

  const labelCounts = useMemo(() => {
    const counts = new Map<string, number>();
    agentsAfterSearch.forEach((agent) => {
      parseAgentTagIds(agent.type).forEach((id) => {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      });
    });
    return counts;
  }, [agentsAfterSearch]);

  const filteredAgents = useMemo(() => {
    if (selectedTagId === 'all') return agentsAfterSearch;
    return agentsAfterSearch.filter((agent) =>
      parseAgentTagIds(agent.type).includes(selectedTagId)
    );
  }, [agentsAfterSearch, selectedTagId]);

  const handleSearch = () => setAppliedSearch(searchTerm.trim());

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto bg-background">
      <div className="shrink-0 space-y-6 p-6 pb-0">
        {/* 标题栏 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              <h1 className="text-2xl font-bold text-foreground tracking-tight">我的智能体</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-[18px]">
              平台的核心应用中心，负责各类智能体的构建、编排、发布和运营。
              对智能体进行统一配置与维护。
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-2 rounded-2xl h-9"
              onClick={() => alert('帮助文档开发中，敬请期待')}
            >
              <CircleHelp size={15} />
              帮助文档
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-2 rounded-2xl h-9"
              onClick={() => {}}
            >
              <RefreshCw size={15} className={cn(loading && 'animate-spin')} />
              刷新
            </Button>
            <Button
              size="sm"
              className="text-xs gap-2 rounded-2xl h-9 shadow-lg"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={16} />
              创建智能体
            </Button>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="bg-card p-4 rounded-2xl border border-border space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {/* 标签筛选 */}
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <Button
                variant={selectedTagId === 'all' ? 'default' : 'outline'}
                size="xs"
                onClick={() => setSelectedTagId('all')}
                className={cn(
                  'rounded-full gap-1.5 text-xs font-bold',
                  selectedTagId !== 'all' && 'border-border text-muted-foreground'
                )}
              >
                全部
                <span
                  className={cn(
                    'min-w-[1.25rem] px-1.5 py-0.5 rounded-full text-2xs font-bold tabular-nums',
                    selectedTagId === 'all' ? 'bg-primary-foreground/20' : 'bg-accent'
                  )}
                >
                  {agentsAfterSearch.length}
                </span>
              </Button>

              {MOCK_LABELS.map((label) => {
                const count = labelCounts.get(label.id) ?? 0;
                const active = selectedTagId === label.id;
                return (
                  <Button
                    key={label.id}
                    variant={active ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => setSelectedTagId(label.id)}
                    className={cn(
                      'rounded-full gap-1.5 text-xs font-bold',
                      !active && 'border-border text-muted-foreground'
                    )}
                  >
                    {label.name}
                    <span
                      className={cn(
                        'min-w-[1.25rem] px-1.5 py-0.5 rounded-full text-2xs font-bold tabular-nums',
                        active ? 'bg-primary-foreground/20' : 'bg-accent'
                      )}
                    >
                      {count}
                    </span>
                  </Button>
                );
              })}

              {MOCK_LABELS.length === 0 && (
                <span className="text-xs text-muted-foreground px-2">暂无标签</span>
              )}
            </div>

            {/* 搜索 + 状态 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 bg-muted px-3 rounded-xl border border-border">
                <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                  状态:
                </span>
                <Select
                  value={selectedStatus}
                  onValueChange={(v) => setSelectedStatus(v as 'all' | '0' | '1')}
                >
                  <SelectTrigger className="border-none bg-transparent text-xs text-foreground font-bold shadow-none p-0 h-auto gap-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative w-full sm:w-72">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="text"
                  placeholder="搜索名称、描述或标签..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 h-9 bg-muted border-border rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 列表区域 */}
      <div className="flex-1 min-h-0 overflow-y-auto mt-6 px-6 pb-6">
        {loading && agents.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 size={20} className="animate-spin" />
            加载中...
          </div>
        ) : filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-2">
            <AnimatePresence mode="popLayout">
              {filteredAgents.map((agent) => (
                <motion.div
                  layout
                  key={agent.id}
                  className="h-full"
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 10 }}
                >
                  <AgentListCard
                    agent={agent}
                    onOpen={() => {
                      /* navigate to orchestration */
                    }}
                    onDelete={() => setDeleteTarget(agent)}
                    onEdit={() => setEditTarget(agent)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16 bg-card border border-border rounded-3xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Filter size={24} />
            </div>
            <h4 className="text-sm font-bold text-foreground">暂无匹配的智能体</h4>
            <p className="text-xs text-muted-foreground">可调整标签、状态或搜索条件后重试</p>
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="shrink-0 px-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          当前显示 {filteredAgents.length} / 共 {agents.length} 个智能体
        </p>
      </div>

      {/* 创建弹窗 */}
      <CreateAgentDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* 编辑弹窗 */}
      <CreateAgentDialog
        isOpen={Boolean(editTarget)}
        agent={editTarget}
        onClose={() => setEditTarget(null)}
      />

      {/* 删除确认 */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">删除智能体</DialogTitle>
            <DialogDescription>
              {deleteTarget && (
                <>
                  确定删除智能体「
                  <span className="font-bold text-foreground">{deleteTarget.agentName}</span>」吗？
                  <span className="block mt-2 text-destructive/80 text-xs">
                    删除后无法恢复，相关编排配置与发布记录将一并移除。
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={() => setDeleteTarget(null)}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
