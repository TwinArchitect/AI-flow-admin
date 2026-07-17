/**
 * CreateAgentDialog — 创建/编辑智能体弹窗（对齐原型）
 *
 * 迁移映射：
 *   bg-white dark:bg-slate-900 → bg-background / bg-card
 *   bg-slate-50/100 → bg-muted / bg-accent
 *   text-slate-900/800 → text-foreground
 *   text-slate-500/400 → text-muted-foreground
 *   border-slate-200/100 → border-border
 *   bg-brand-600 → bg-primary
 *   text-brand-600 → text-primary
 *   text-rose-500 → text-destructive
 */

import { useState, useEffect, type FormEvent } from 'react';
import {
  ArrowRight, Check, Layers, Lightbulb, Loader2, MessageSquare, Sparkles, X, Zap,
} from 'lucide-react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { AgentOpenSysAgent } from '@/types/agent';

type AgentCreateType = 'workflow' | 'chat';

interface CreateAgentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: AgentOpenSysAgent | null;
}

const NAME_MAX = 50;
const REMARK_MAX = 200;

function ChatPreview() {
  return (
    <div className="bg-primary/5 rounded-2xl p-6 aspect-[16/10] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="w-full max-w-[240px] space-y-3 relative z-10">
        <div className="flex items-start gap-2 bg-background p-2.5 rounded-2xl rounded-tl-sm border border-border shadow-sm w-4/5 leading-relaxed">
          <div className="w-5 h-5 rounded-lg bg-primary/20 shrink-0 flex items-center justify-center">
            <MessageSquare size={10} className="text-primary" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="w-16 h-1.5 bg-muted-foreground/20 rounded" />
            <div className="w-12 h-1 bg-muted-foreground/10 rounded" />
          </div>
        </div>
        <div className="flex items-start gap-2 bg-primary text-primary-foreground p-2.5 rounded-2xl rounded-tr-sm shadow-md w-4/5 ml-auto justify-end">
          <div className="space-y-1 text-right flex-1 flex flex-col items-end">
            <div className="w-14 h-1.5 bg-primary-foreground/30 rounded" />
            <div className="w-8 h-1 bg-primary-foreground/20 rounded" />
          </div>
          <div className="w-5 h-5 rounded-lg bg-primary-foreground/25 shrink-0 flex items-center justify-center">
            <span className="text-[8px] font-bold">ME</span>
          </div>
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/10 blur-2xl rounded-full pointer-events-none" />
    </div>
  );
}

function WorkflowPreview() {
  return (
    <div className="bg-primary/5 rounded-2xl p-6 aspect-[16/10] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="w-full max-w-[260px] relative z-10 space-y-3">
        <div className="flex items-center gap-2 bg-background p-2.5 rounded-xl border border-border shadow-sm w-fit">
          <span className="w-4 h-4 rounded-lg bg-orange-500 text-2xs text-white flex items-center justify-center">开</span>
          <div className="w-14 h-1.5 bg-muted-foreground/20 rounded" />
        </div>
        <div className="flex items-center gap-2 bg-primary p-2.5 rounded-xl shadow-md w-fit mx-auto relative">
          <Zap size={10} className="text-amber-300 animate-pulse" />
          <div className="w-16 h-1.5 bg-primary-foreground/30 rounded" />
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-background" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-background" />
        </div>
        <div className="flex items-center gap-2 bg-background p-2.5 rounded-xl border border-border shadow-sm w-fit ml-auto">
          <span className="w-4 h-4 rounded-lg bg-success text-[10px] text-white flex items-center justify-center">结</span>
          <div className="w-14 h-1.5 bg-muted-foreground/20 rounded" />
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/10 blur-2xl rounded-full pointer-events-none" />
    </div>
  );
}

function TypePreview({ type }: { type: AgentCreateType }) {
  const isChat = type === 'chat';
  return (
    <div className="rounded-3xl border border-border bg-card p-1 h-full flex flex-col shadow-sm">
      <div className="flex-1 flex flex-col">
        {isChat ? <ChatPreview /> : <WorkflowPreview />}
        <div className="p-5">
          <div className="flex items-center justify-between mb-2 gap-2">
            <h3 className={cn('text-base font-bold text-foreground flex items-center gap-1.5')}>
              {isChat ? <MessageSquare size={16} className="text-primary" /> : <Layers size={16} className="text-primary" />}
              {isChat ? '对话式' : '工作流型'} 智能体
            </h3>
            <span className={cn('shrink-0 px-2 py-0.5 text-[9.5px] font-black tracking-wider rounded-md bg-primary/10 text-primary')}>
              {isChat ? '极速上手体验' : '复杂场景首选'}
            </span>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {isChat
              ? '适用于基于单一角色或垂直知识库的快速问答、轻量级日常办公、客服引导及提示词对比调试。'
              : '适用于复杂业务流程拓扑、多模型混合调度、带状态条件分支判断以及自定义接口工具链调用。'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CreateAgentDialog({ isOpen, onClose, agent }: CreateAgentDialogProps) {
  const isEditMode = Boolean(agent);
  const [agentType, setAgentType] = useState<AgentCreateType>('workflow');
  const [agentName, setAgentName] = useState('');
  const [remark, setRemark] = useState('');
  const [loading] = useState(false);
  const [error] = useState('');

  useEffect(() => {
    if (!isOpen) { setAgentType('workflow'); setAgentName(''); setRemark(''); return; }
    if (agent) {
      setAgentType(agent.flowType === 0 ? 'chat' : 'workflow');
      setAgentName(agent.agentName ?? '');
      setRemark(agent.remark ?? '');
    } else {
      setAgentType('workflow'); setAgentName(''); setRemark('');
    }
  }, [isOpen, agent]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-0 p-0 max-w-[920px]" showCloseButton={false}>
        <div className="h-[3px] bg-gradient-to-r from-primary via-purple-500 to-destructive shrink-0" />

        <div className="px-7 pt-7 pb-4 flex items-start justify-between gap-4 shrink-0 relative">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles size={20} className="text-primary animate-pulse" />
              {isEditMode ? '修改智能体信息' : '新建 AI 智能体'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isEditMode ? '更新名称与描述，不影响流程编排' : '请选择适合您业务复杂度的智能体构建类型'}
            </p>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-full shrink-0">
              <X size={18} />
            </Button>
          </DialogClose>
        </div>

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="flex flex-col lg:flex-row gap-6 px-7 pb-4">
              <div className="flex-1 min-w-0 space-y-5">
                <section>
                  <h3 className="text-[13px] font-bold text-foreground mb-3">选择智能体类型</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" disabled={isEditMode}
                      onClick={() => setAgentType('workflow')}
                      className={cn(
                        'relative text-left p-3.5 rounded-xl border transition-all',
                        agentType === 'workflow'
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-muted-foreground/30 bg-background',
                        isEditMode && 'opacity-80 cursor-default',
                      )}
                    >
                      {agentType === 'workflow' && (
                        <span className="absolute top-2.5 right-2.5 w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                      <span className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center mb-2.5">
                        <Layers size={18} className="text-primary" />
                      </span>
                      <p className="text-[13px] font-bold text-foreground">工作流型</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">面向业务流程的自动化编排与执行</p>
                    </button>
                    <button type="button" disabled={isEditMode}
                      onClick={() => setAgentType('chat')}
                      className={cn(
                        'relative text-left p-3.5 rounded-xl border transition-all',
                        agentType === 'chat'
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-muted-foreground/30 bg-background',
                        isEditMode && 'opacity-80 cursor-default',
                      )}
                    >
                      {agentType === 'chat' && (
                        <span className="absolute top-2.5 right-2.5 w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                      <span className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center mb-2.5">
                        <MessageSquare size={18} className="text-primary" />
                      </span>
                      <p className="text-[13px] font-bold text-foreground">对话式</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">基于单一角色对话，适用于问答、客服等场景</p>
                    </button>
                  </div>
                  {isEditMode && <p className="text-2xs text-muted-foreground mt-2">智能体类型创建后不可修改</p>}
                </section>

                <section>
                  <h3 className="text-[13px] font-bold text-foreground mb-3">基础信息</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        应用名称 <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Input value={agentName} maxLength={NAME_MAX}
                          onChange={(e) => setAgentName(e.target.value)}
                          placeholder="给你的智能体起个名字" className="h-11 pr-12 text-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs text-muted-foreground tabular-nums pointer-events-none">
                          {agentName.length}/{NAME_MAX}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        描述 <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Textarea value={remark} maxLength={REMARK_MAX}
                          onChange={(e) => setRemark(e.target.value)}
                          rows={4} placeholder="输入智能体的用途、能力或适用场景..."
                          className="pb-7 text-sm"
                        />
                        <span className="absolute right-3 bottom-2.5 text-2xs text-muted-foreground tabular-nums pointer-events-none">
                          {remark.length}/{REMARK_MAX}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>

              <aside className="lg:w-[42%] shrink-0 min-h-[320px] lg:min-h-0">
                <TypePreview type={agentType} />
              </aside>
            </div>

            <div className="px-7 py-4 border-t border-border flex items-center justify-between gap-4 bg-card">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground">
                <Lightbulb size={13} />
                不知道如何选择？了解类型区别
                <ArrowRight size={12} />
              </Button>
              <div className="flex items-center gap-2.5">
                <Button variant="outline" size="sm" onClick={onClose} className="text-sm">
                  取消
                </Button>
                <Button type="submit" disabled={loading}
                  className="text-sm gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 shadow-sm"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {isEditMode ? '保存' : '创建智能体'}
                </Button>
              </div>
            </div>
          </form>
      </DialogContent>
    </Dialog>
  );
}
