import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function ToastDemo() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">类型</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => toast.success('操作成功！')}>Success</Button>
          <Button variant="outline" onClick={() => toast.error('操作失败，请重试')}>Error</Button>
          <Button variant="outline" onClick={() => toast.warning('注意：此操作不可撤销')}>Warning</Button>
          <Button variant="outline" onClick={() => toast.info('提示：数据已自动保存')}>Info</Button>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">带描述</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => toast.success('用户已创建', { description: '新用户张三已成功加入团队。' })}>带描述</Button>
          <Button variant="outline" onClick={() => toast.error('提交失败', { description: '服务器返回 500 错误，请稍后重试。' })}>错误详情</Button>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">带操作</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => toast('文件已删除', { action: { label: '撤销', onClick: () => toast.success('已撤销') } })}>可撤销</Button>
          <Button variant="outline" onClick={() => toast.loading('正在上传...', { duration: 2000 })}>Loading</Button>
          <Button variant="outline" onClick={() => {
            const id = toast.loading('处理中...');
            setTimeout(() => toast.success('处理完成！', { id }), 2000);
          }}>异步更新</Button>
        </div>
      </section>
    </div>
  );
}
