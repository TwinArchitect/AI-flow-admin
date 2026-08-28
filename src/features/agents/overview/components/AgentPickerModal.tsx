/**
 * AgentPickerModal — 智能体选择弹窗（简化版）
 *
 * 迁移映射（原型 → 目标）：
 *   bg-brand-* → bg-primary
 *   text-brand-* → text-primary
 *   bg-white dark:bg-slate-900 → bg-background
 *   text-slate-* → text-muted-foreground / text-foreground
 *   border-slate-* → border-border
 *   motion/react → framer-motion
 *   backdrop-filter glass → 简化
 */

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { queryAgents } from '@/features/agents/api/agentApi';

export interface SelectedPublishedAgent {
  id: string;
  agentName: string;
}

interface AgentPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelectPublishedAgent: (agent: SelectedPublishedAgent) => void;
  selectedPublishedAgentId?: string | null;
}

/* ─── AgentGridItem ─── */
function AgentGridItem({
  name,
  selected,
  onClick,
  children,
}: {
  name: string;
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      type="button"
      onClick={onClick}
      className={cn(
        'flex-col items-center gap-2 p-2 rounded-2xl h-auto w-auto',
        selected ? 'ring-2 ring-primary bg-primary/5' : ''
      )}
    >
      <div className="w-[52px] h-[52px] flex items-center justify-center">{children}</div>
      <span className="text-[11px] font-semibold text-foreground text-center line-clamp-2 leading-tight max-w-[72px]">
        {name}
      </span>
    </Button>
  );
}

export function AgentPickerModal({
  open,
  onClose,
  onSelectPublishedAgent,
  selectedPublishedAgentId,
}: AgentPickerModalProps) {
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<SelectedPublishedAgent[]>([]);

  const fetchPublishedAgents = useCallback(async () => {
    setLoading(true);
    try {
      const page = await queryAgents({ pageNum: 1, pageSize: 200, status: 1 });
      setAgents((page.records ?? []).map(({ id, agentName }) => ({ id, agentName })));
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void fetchPublishedAgents();
  }, [open, fetchPublishedAgents]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8">
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/10 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* 弹窗 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative w-full max-w-3xl max-h-[min(85vh,720px)] rounded-3xl shadow-xl bg-background border border-border flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <header className="shrink-0 px-5 pt-5 pb-3 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <h2 className="text-base font-bold text-foreground">选择智能体</h2>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="关闭">
                <X size={18} />
              </Button>
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
              <section>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                  我的智能体
                </h3>
                {loading ? (
                  <div className="flex justify-center py-12 text-muted-foreground">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                ) : (
                  agents.length ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1">
                      {agents.map((agent) => (
                      <AgentGridItem
                        key={agent.id}
                        name={agent.agentName}
                        selected={selectedPublishedAgentId === agent.id}
                        onClick={() => onSelectPublishedAgent(agent)}
                      >
                        <div className="w-[52px] h-[52px] rounded-2xl bg-primary/10 flex items-center justify-center border border-border">
                          <Bot size={24} className="text-primary" />
                        </div>
                      </AgentGridItem>
                      ))}
                    </div>
                  ) : (
                    <p className="py-12 text-center text-xs text-muted-foreground">暂无已发布智能体</p>
                  )
                )}
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
