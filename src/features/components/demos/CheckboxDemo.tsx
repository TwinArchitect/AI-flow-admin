import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function CheckboxDemo() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">基础</h3>
        <div className="space-y-2">
          {['邮件通知', '短信通知', '系统消息', '周报推送'].map((item, i) => (
            <div key={item} className="flex items-center gap-2">
              <Checkbox id={`cb-${i}`} defaultChecked={i < 2} />
              <Label htmlFor={`cb-${i}`}>{item}</Label>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">状态</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2"><Checkbox id="cb-default" /><Label htmlFor="cb-default">默认</Label></div>
          <div className="flex items-center gap-2"><Checkbox id="cb-checked" defaultChecked /><Label htmlFor="cb-checked">选中</Label></div>
          <div className="flex items-center gap-2"><Checkbox id="cb-disabled" disabled /><Label htmlFor="cb-disabled" className="text-muted-foreground">禁用</Label></div>
          <div className="flex items-center gap-2"><Checkbox id="cb-disabled-checked" disabled defaultChecked /><Label htmlFor="cb-disabled-checked" className="text-muted-foreground">禁用已选</Label></div>
        </div>
      </section>
    </div>
  );
}
