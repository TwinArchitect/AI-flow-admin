import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';

export function CalendarDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [range, setRange] = useState<DateRange | undefined>();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">单日选择</h3>
        <div className="space-y-2">
          <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-lg border w-fit" />
          <p className="text-sm text-muted-foreground">
            已选：{date ? date.toLocaleDateString('zh-CN') : '无'}
          </p>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">区间选择</h3>
        <div className="space-y-2">
          <Calendar mode="range" selected={range} onSelect={setRange} className="rounded-lg border w-fit" numberOfMonths={2} />
          <p className="text-sm text-muted-foreground">
            {range?.from
              ? `${range.from.toLocaleDateString('zh-CN')} ~ ${range.to ? range.to.toLocaleDateString('zh-CN') : '...'}`
              : '未选择'}
          </p>
        </div>
      </section>
    </div>
  );
}
