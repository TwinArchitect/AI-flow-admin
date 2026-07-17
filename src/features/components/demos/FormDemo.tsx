import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const schema = z.object({
  name: z.string().min(2, '姓名至少 2 个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  role: z.string({ error: '请选择角色' }),
  bio: z.string().max(100, '简介不超过 100 字').optional(),
  agree: z.boolean().refine((v) => v === true, '必须同意服务条款'),
});

type FormValues = z.infer<typeof schema>;

export function FormDemo() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', bio: '', agree: false },
  });

  function onSubmit(values: FormValues) {
    toast.success(`提交成功：${values.name} (${values.email})`);
    form.reset();
  }

  return (
    <div className="max-w-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>姓名 *</FormLabel>
              <FormControl><Input placeholder="请输入姓名" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱 *</FormLabel>
              <FormControl><Input type="email" placeholder="请输入邮箱" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="role" render={({ field }) => (
            <FormItem>
              <FormLabel>角色 *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="请选择角色" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="editor">编辑</SelectItem>
                  <SelectItem value="viewer">查看者</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="bio" render={({ field }) => (
            <FormItem>
              <FormLabel>简介</FormLabel>
              <FormControl><Textarea placeholder="请输入简介（选填）" rows={3} {...field} /></FormControl>
              <FormDescription>不超过 100 字</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="agree" render={({ field }) => (
            <FormItem className="flex items-start gap-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div>
                <FormLabel>同意服务条款 *</FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )} />
          <Button type="submit" className="w-full">提交</Button>
        </form>
      </Form>
    </div>
  );
}
