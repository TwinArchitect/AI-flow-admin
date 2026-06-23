import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function SwitchDemo() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">基础</h3>
        <div className="space-y-3 max-w-xs">
          {['开启通知', '自动保存', '深色模式', '双重验证'].map((item, i) => (
            <div key={item} className="flex items-center justify-between">
              <Label htmlFor={`sw-${i}`}>{item}</Label>
              <Switch id={`sw-${i}`} defaultChecked={i < 2} />
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">状态</h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2"><Switch /><Label>默认</Label></div>
          <div className="flex items-center gap-2"><Switch defaultChecked /><Label>开启</Label></div>
          <div className="flex items-center gap-2"><Switch disabled /><Label className="text-muted-foreground">禁用</Label></div>
          <div className="flex items-center gap-2"><Switch disabled defaultChecked /><Label className="text-muted-foreground">禁用开启</Label></div>
        </div>
      </section>
    </div>
  );
}
