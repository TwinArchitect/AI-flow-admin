import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Tool } from '../data/toolsMock';

const httpSchema = z.object({
  type: z.literal('HTTP'),
  title: z.string().min(1, '必填').max(15),
  category: z.string().min(1, '必填').max(12),
  description: z.string().optional(),
  method: z.string(),
  baseUrl: z.string().min(1, '必填'),
  headers: z.string().optional(),
  params: z.string().optional(),
  status: z.string().optional(),
  command: z.string().optional(),
  args: z.string().optional(),
  envVars: z.string().optional(),
});
const mcpSchema = z.object({
  type: z.literal('MCP'),
  title: z.string().min(1, '必填').max(15),
  category: z.string().min(1, '必填').max(12),
  description: z.string().optional(),
  command: z.string().min(1, '必填'),
  args: z.string().optional(),
  envVars: z.string().optional(),
  status: z.string().optional(),
  method: z.string().optional(),
  baseUrl: z.string().optional(),
  headers: z.string().optional(),
  params: z.string().optional(),
});
const toolSchema = z.discriminatedUnion('type', [httpSchema, mcpSchema]);

type ToolForm = z.infer<typeof toolSchema>;

interface ToolFormModalProps {
  open: boolean;
  tool: Partial<Tool> | null;
  onClose: () => void;
  onSave: (tool: Partial<Tool>) => void;
  pageType: 'HTTP' | 'MCP';
}

export function ToolFormModal({ open, tool, onClose, onSave, pageType }: ToolFormModalProps) {
  const isEdit = Boolean(tool?.id);
  const form = useForm<ToolForm>({
    resolver: zodResolver(toolSchema),
    defaultValues: {
      type: pageType,
      title: '',
      category: '',
      description: '',
      method: 'POST',
      baseUrl: '',
      headers: '',
      params: '',
      command: '',
      args: '',
      envVars: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        type: pageType,
        title: tool?.title ?? '',
        category: tool?.category ?? '',
        description: tool?.description ?? '',
        method: tool?.method ?? 'POST',
        baseUrl: tool?.baseUrl ?? '',
        headers: tool?.headers ?? '',
        params: tool?.params ?? '',
        command: tool?.command ?? '',
        args: tool?.args ?? '',
        envVars: tool?.envVars ?? '',
        status: tool?.status ?? 'active',
      });
    }
  }, [open, tool, pageType, form]);

  const handleSubmit = (data: ToolForm) => {
    onSave(data as Partial<Tool>);
    onClose();
  };

  const watchType = form.watch('type');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑工具配置' : `新建${pageType}工具`}</DialogTitle>
          <DialogDescription>请录入工具在编排层运行时调用的参数与鉴权格式。</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 max-h-[60vh] overflow-y-auto px-1"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">
                      工具名称 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="例如: 网页图片提取"
                        maxLength={15}
                        className="h-9 text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-2xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">
                      所属品类 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="例如: 图像处理"
                        maxLength={12}
                        className="h-9 text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-2xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold">功能详解</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      className="text-xs"
                      placeholder="简要记述该工具的实现范畴。"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {watchType === 'HTTP' && (
              <div className="space-y-4 pt-2 border-t border-border">
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1 space-y-1.5">
                    <FormLabel className="text-xs font-bold">方法</FormLabel>
                    <Select
                      value={form.watch('method')}
                      onValueChange={(v) => form.setValue('method', v)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['POST', 'GET', 'PUT', 'DELETE'].map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3 space-y-1.5">
                    <FormField
                      control={form.control}
                      name="baseUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold">
                            接口 URL <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://api.domain.com/v1"
                              className="h-9 text-xs font-mono"
                            />
                          </FormControl>
                          <FormMessage className="text-2xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="headers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Headers (JSON)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          className="text-xs font-mono"
                          placeholder='{"Authorization": "Bearer key"}'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="params"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">参数 Schema</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          className="text-xs font-mono"
                          placeholder='{"query": "text"}'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchType === 'MCP' && (
              <div className="space-y-4 pt-2 border-t border-border">
                <FormField
                  control={form.control}
                  name="command"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">
                        启动指令 <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="npx -y @modelcontextprotocol/server-sqlite"
                          className="h-9 text-xs font-mono"
                        />
                      </FormControl>
                      <FormMessage className="text-2xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="args"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">参数</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="sqlite:///root/database.db"
                          className="h-9 text-xs font-mono"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="envVars"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">环境变量 (JSON)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          className="text-xs font-mono"
                          placeholder='{"KEY": "value"}'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </form>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" size="sm" className="flex-1" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" size="sm" className="flex-1">
              {isEdit ? '保存修改' : '登记并保存'}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
