/**
 * CreateAgentDialog — 创建/编辑智能体弹窗
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
import type { AgentOpenSysAgent } from '@/types/agent';

const formSchema = z.object({
  name: z.string().min(1, '请输入智能体名称').max(50),
  remark: z.string().min(1, '请输入智能体描述').max(200),
  type: z.literal('workflow'),
});

type FormData = z.infer<typeof formSchema>;

export interface CreateAgentDraft {
  name: string;
  remark: string;
  type: 'workflow' | 'chat';
}

interface CreateAgentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: AgentOpenSysAgent | null;
  onSubmit?: (data: CreateAgentDraft) => void;
}

export function CreateAgentDialog({ isOpen, onClose, agent, onSubmit }: CreateAgentDialogProps) {
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
        type: 'workflow',
      });
    }
  }, [isOpen, agent, form]);

  const handleSubmit = (data: FormData) => {
    onSubmit?.(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[560px] p-0 overflow-hidden gap-0" showCloseButton>
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
                : '填写基础信息后进入工作流编排'}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col">
            <div className="px-7 pb-6">
              <div className="space-y-5">
                <section>
                  <h3 className="text-[13px] font-bold text-foreground mb-3">智能体类型</h3>
                  <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                      <Layers size={19} className="text-primary" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">工作流型</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        面向业务流程的自动化编排与执行，类型创建后不可修改
                      </p>
                    </div>
                  </div>
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
            </div>

            <div className="px-7 py-4 border-t border-border flex items-center justify-end gap-4 bg-card">
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
