/**
 * CreateAgentDialog — 创建/编辑智能体弹窗
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, MessageCircle, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().trim().min(1, '请输入智能体名称').max(50),
  remark: z.string().trim().min(1, '请输入智能体描述').max(200),
  type: z.enum(['workflow', 'chat']),
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
  onSubmit?: (data: CreateAgentDraft) => void | Promise<void>;
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
        type: agent?.flowType === 0 ? 'chat' : 'workflow',
      });
    }
  }, [isOpen, agent, form]);

  const handleSubmit = async (data: FormData) => {
    try {
      await onSubmit?.(data);
      onClose();
    } catch {
      // 调用方展示接口错误；保留表单，允许修正后重试。
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !form.formState.isSubmitting && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[560px] p-0 overflow-hidden gap-0" showCloseButton={!form.formState.isSubmitting}>
        <div className="h-[3px] bg-gradient-to-r from-primary via-purple-500 to-destructive shrink-0" />

        <DialogHeader className="px-7 pt-7 pb-4 items-start gap-4 relative">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles size={20} className="text-primary animate-pulse" />
              {isEditMode ? '修改智能体信息' : '新建 AI 智能体'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isEditMode
                ? '更新名称与描述，不影响流程编排'
                : '填写基础信息后进入对应的智能体编排页面'}
            </p>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col">
            <fieldset disabled={form.formState.isSubmitting} className="min-w-0 px-7 pb-6">
              <div className="space-y-5">
                <section>
                  <h3 className="text-[13px] font-bold text-foreground mb-3">智能体类型</h3>
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormControl><div className="grid gap-3 sm:grid-cols-2">
                      {([
                        { value: 'chat', title: '对话式', description: '通过提示词、模型、知识库和工具构建智能助手', Icon: MessageCircle },
                        { value: 'workflow', title: '工作流型', description: '通过可视化节点编排复杂业务流程', Icon: Layers },
                      ] as const).map(({ value, title, description, Icon }) => (
                        <button key={value} type="button" disabled={isEditMode} onClick={() => field.onChange(value)}
                          className={cn('flex items-start gap-3 rounded-xl border p-4 text-left transition-colors', field.value === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40', isEditMode && 'cursor-not-allowed opacity-70')}>
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15"><Icon size={19} className="text-primary" /></span>
                          <span><span className="block text-sm font-semibold text-foreground">{title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span></span>
                        </button>
                      ))}
                    </div></FormControl></FormItem>
                  )} />
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
            </fieldset>

            <div className="px-7 py-4 border-t border-border flex items-center justify-end gap-4 bg-card">
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={onClose}
                  disabled={form.formState.isSubmitting}
                  className="text-sm"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  size="sm"
                  className="text-sm gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 shadow-sm"
                >
                  <Sparkles size={15} />
                  {form.formState.isSubmitting ? (isEditMode ? '保存中…' : '创建中…') : isEditMode ? '保存' : '创建智能体'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
