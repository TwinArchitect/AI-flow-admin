import { useState } from 'react';
import { TimePicker } from '@/components/ui/time-picker';
import { Label } from '@/components/ui/label';

export function TimePickerDemo() {
  const [t1, setT1] = useState<string | undefined>();
  const [t2, setT2] = useState<string | undefined>('09:00');
  const [t3, setT3] = useState<string | undefined>();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">基础（30 分钟步长）</h3>
        <div className="space-y-1.5">
          <Label>开始时间</Label>
          <TimePicker value={t1} onChange={setT1} step={30} />
          <p className="text-xs text-muted-foreground">已选：{t1 ?? '无'}</p>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">15 分钟步长 + 默认值</h3>
        <div className="space-y-1.5">
          <Label>结束时间</Label>
          <TimePicker value={t2} onChange={setT2} step={15} />
          <p className="text-xs text-muted-foreground">已选：{t2 ?? '无'}</p>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">精确到秒</h3>
        <div className="space-y-1.5">
          <Label>精确时间</Label>
          <TimePicker value={t3} onChange={setT3} step={1} showSeconds />
          <p className="text-xs text-muted-foreground">已选：{t3 ?? '无'}</p>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">禁用状态</h3>
        <TimePicker value="14:30" disabled />
      </section>
    </div>
  );
}
