import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function TextareaDemo() {
  return (
    <div className="space-y-6 max-w-sm">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">基础</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>描述</Label>
            <Textarea placeholder="请输入描述..." />
          </div>
          <div className="space-y-1.5">
            <Label>自定义高度</Label>
            <Textarea placeholder="更高的输入框..." rows={6} />
          </div>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">状态</h3>
        <div className="space-y-3">
          <Textarea placeholder="默认" />
          <Textarea placeholder="禁用" disabled />
          <Textarea readOnly defaultValue="只读内容，无法编辑此区域的文字。" />
        </div>
      </section>
    </div>
  );
}
