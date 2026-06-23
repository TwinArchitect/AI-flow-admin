import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function RadioGroupDemo() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">基础</h3>
        <RadioGroup defaultValue="monthly">
          {[{ value: 'daily', label: '每日' }, { value: 'weekly', label: '每周' }, { value: 'monthly', label: '每月' }].map((item) => (
            <div key={item.value} className="flex items-center gap-2">
              <RadioGroupItem value={item.value} id={`rg-${item.value}`} />
              <Label htmlFor={`rg-${item.value}`}>{item.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">卡片式选择</h3>
        <RadioGroup defaultValue="pro" className="grid grid-cols-3 gap-3 max-w-md">
          {[
            { value: 'free', label: '免费版', desc: '5 个工作流' },
            { value: 'pro', label: '专业版', desc: '无限工作流' },
            { value: 'enterprise', label: '企业版', desc: '私有部署' },
          ].map((item) => (
            <div key={item.value}>
              <RadioGroupItem value={item.value} id={`plan-${item.value}`} className="sr-only" />
              <Label
                htmlFor={`plan-${item.value}`}
                className="flex flex-col items-center gap-1 rounded-lg border p-3 cursor-pointer hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
              >
                <span className="font-medium text-sm">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </section>
    </div>
  );
}
