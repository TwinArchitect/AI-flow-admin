/**
 * CreateAgentDialog — 创建/编辑智能体弹窗
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Layers, MessageSquare, Sparkles, X, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import type { AgentOpenSysAgent } from '@/types/agent';

const formSchema = z.object({
  name: z.string().min(1, '请输入智能体名称').max(50),
  remark: z.string().min(1, '请输入智能体描述').max(200),
  type: z.union([z.literal('workflow'), z.literal('chat')]),
});

type FormData = z.infer<typeof formSchema>;

interface CreateAgentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: AgentOpenSysAgent | null;
}

export function CreateAgentDialog({ isOpen, onClose, agent }: CreateAgentDialogProps) {
  const isEditMode = Boolean(agent);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', remark: '', type: 'workflow' },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: agent?.agentName ?? '',
        remark: agent?.remark ?? '',
        type: agent?.flowType === 0 ? 'chat' : 'workflow',
      });
    }
  }, [isOpen, agent, form]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmit = (_data: FormData) => {
    onClose();
  };

  const watchType = form.watch('type');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[920px] p-0 overflow-hidden gap-0" showCloseButton={false}>
        <div className="h-[3px] bg-gradient-to-r from-primary via-purple-500 to-destructive shrink-0" />

        <div className="px-7 pt-7 pb-4 flex items-start justify-between gap-4 shrink-0 relative">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles size={20} className="text-primary animate-pulse" />
              {isEditMode ? '修改智能体信息' : '新建 AI 智能体'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isEditMode
                ? '更新名称与描述，不影响流程编排'
                : '请选择适合您业务复杂度的智能体构建类型'}
            </p>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-full shrink-0">
              <X size={18} />
            </Button>
          </DialogClose>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col">
            <div className="flex flex-col lg:flex-row gap-6 px-7 pb-4">
              <div className="flex-1 min-w-0 space-y-5">
                <section>
                  <h3 className="text-[13px] font-bold text-foreground mb-3">选择智能体类型</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(['workflow', 'chat'] as const).map((t) => (
                      <Button
                        key={t}
                        variant="ghost"
                        type="button"
                        disabled={isEditMode}
                        onClick={() => form.setValue('type', t)}
                        className={cn(
                          'h-auto flex-col items-start p-3.5 rounded-xl border text-left',
                          watchType === t
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-muted-foreground/30',
                          isEditMode && 'opacity-80 cursor-default'
                        )}
                      >
                        {watchType === t && (
                          <span className="absolute top-2.5 right-2.5 w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                        <span className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center mb-2.5">
                          {t === 'workflow' ? (
                            <Layers size={18} className="text-primary" />
                          ) : (
                            <MessageSquare size={18} className="text-primary" />
                          )}
                        </span>
                        <p className="text-[13px] font-bold text-foreground">
                          {t === 'workflow' ? '工作流型' : '对话式'}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {t === 'workflow'
                            ? '面向业务流程的自动化编排与执行'
                            : '基于单一角色对话，适用于问答、客服等场景'}
                        </p>
                      </Button>
                    ))}
                  </div>
                  {isEditMode && (
                    <p className="text-2xs text-muted-foreground mt-2">智能体类型创建后不可修改</p>
                  )}
                </section>

                <section>
                  <h3 className="text-[13px] font-bold text-foreground mb-3">基础信息</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-muted-foreground">
                            应用名称 <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                maxLength={50}
                                placeholder="给你的智能体起个名字"
                                className="h-11 pr-12 text-sm"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs text-muted-foreground tabular-nums pointer-events-none">
                                {field.value.length}/50
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage className="text-2xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="remark"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-muted-foreground">
                            描述 <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Textarea
                                {...field}
                                maxLength={200}
                                rows={4}
                                placeholder="输入智能体的用途、能力或适用场景..."
                                className="pb-7 text-sm"
                              />
                              <span className="absolute right-3 bottom-2.5 text-2xs text-muted-foreground tabular-nums pointer-events-none">
                                {field.value.length}/200
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage className="text-2xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>
              </div>

              <aside className="lg:w-[42%] shrink-0 min-h-[320px] lg:min-h-0">
                <div className="rounded-3xl border border-border bg-card p-1 h-full flex flex-col shadow-sm">
                  <div className="flex-1 flex flex-col">
                    <div className="bg-primary/5 rounded-2xl p-6 aspect-[16/10] flex flex-col items-center justify-center relative overflow-hidden">
                      {watchType === 'chat' ? (
                        <div className="w-full max-w-[240px] space-y-3 relative z-10">
                          <div className="flex items-start gap-2 bg-background p-2.5 rounded-2xl rounded-tl-sm border border-border shadow-sm w-4/5">
                            <div className="w-5 h-5 rounded-lg bg-primary/20 flex items-center justify-center">
                              <MessageSquare size={10} className="text-primary" />
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="w-16 h-1.5 bg-muted-foreground/20 rounded" />
                              <div className="w-12 h-1 bg-muted-foreground/10 rounded" />
                            </div>
                          </div>
                          <div className="flex items-start gap-2 bg-primary text-primary-foreground p-2.5 rounded-2xl rounded-tr-sm shadow-md w-4/5 ml-auto">
                            <div className="space-y-1 text-right flex-1 flex flex-col items-end">
                              <div className="w-14 h-1.5 bg-primary-foreground/30 rounded" />
                              <div className="w-8 h-1 bg-primary-foreground/20 rounded" />
                            </div>
                            <div className="w-5 h-5 rounded-lg bg-primary-foreground/25 flex items-center justify-center">
                              <span className="text-[8px] font-bold">ME</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full max-w-[260px] space-y-3 relative z-10">
                          <div className="flex items-center gap-2 bg-background p-2.5 rounded-xl border border-border shadow-sm w-fit">
                            <span className="w-4 h-4 rounded-lg bg-orange-500 text-2xs text-white flex items-center justify-center">
                              开
                            </span>
                            <div className="w-14 h-1.5 bg-muted-foreground/20 rounded" />
                          </div>
                          <div className="flex items-center gap-2 bg-primary p-2.5 rounded-xl shadow-md w-fit mx-auto">
                            <Zap size={10} className="text-amber-300 animate-pulse" />
                            <div className="w-16 h-1.5 bg-primary-foreground/30 rounded" />
                          </div>
                          <div className="flex items-center gap-2 bg-background p-2.5 rounded-xl border border-border shadow-sm w-fit ml-auto">
                            <span className="w-4 h-4 rounded-lg bg-success text-[10px] text-white flex items-center justify-center">
                              结
                            </span>
                            <div className="w-14 h-1.5 bg-muted-foreground/20 rounded" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                        {watchType === 'chat' ? (
                          <MessageSquare size={16} className="text-primary" />
                        ) : (
                          <Layers size={16} className="text-primary" />
                        )}
                        {watchType === 'chat' ? '对话式' : '工作流型'} 智能体
                      </h3>
                      <span className="shrink-0 px-2 py-0.5 text-[9.5px] font-black tracking-wider rounded-md bg-primary/10 text-primary inline-block mt-2">
                        {watchType === 'chat' ? '极速上手体验' : '复杂场景首选'}
                      </span>
                      <p className="text-muted-foreground text-xs leading-relaxed mt-2">
                        {watchType === 'chat'
                          ? '适用于基于单一角色或垂直知识库的快速问答、轻量级日常办公、客服引导及提示词对比调试。'
                          : '适用于复杂业务流程拓扑、多模型混合调度、带状态条件分支判断以及自定义接口工具链调用。'}
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            <div className="px-7 py-4 border-t border-border flex items-center justify-between gap-4 bg-card">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground">
                <Zap size={13} />
                不知道如何选择？了解类型区别
              </Button>
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={onClose}
                  className="text-sm"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-sm gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 shadow-sm"
                >
                  <Sparkles size={15} />
                  {isEditMode ? '保存' : '创建智能体'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
