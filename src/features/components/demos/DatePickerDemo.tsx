import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { DatePicker, DateTimePicker, DateRangePicker, DateTimeRangePicker } from '@/components/ui/date-picker';
import type { DateTimeRange } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

export function DatePickerDemo() {
  const [date, setDate] = useState<Date | undefined>();
  const [datetime, setDatetime] = useState<Date | undefined>();
  const [range, setRange] = useState<DateRange | undefined>();
  const [datetimeRange, setDatetimeRange] = useState<DateTimeRange | undefined>();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">单日选择</h3>
        <div className="space-y-1.5">
          <Label>日期</Label>
          <DatePicker value={date} onChange={setDate} />
          <p className="text-xs text-muted-foreground">已选：{date?.toLocaleDateString('zh-CN') ?? '无'}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">日期时间选择</h3>
        <div className="space-y-1.5">
          <Label>日期 + 时间</Label>
          <DateTimePicker value={datetime} onChange={setDatetime} />
          <p className="text-xs text-muted-foreground">已选：{datetime?.toLocaleString('zh-CN') ?? '无'}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">日期区间选择</h3>
        <div className="space-y-1.5">
          <Label>日期范围</Label>
          <DateRangePicker value={range} onChange={setRange} />
          <p className="text-xs text-muted-foreground">
            {range?.from
              ? `${range.from.toLocaleDateString('zh-CN')} ~ ${range.to?.toLocaleDateString('zh-CN') ?? '...'}`
              : '未选择'}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">日期时间区间选择</h3>
        <div className="space-y-1.5">
          <Label>开始 ~ 结束（含时间）</Label>
          <DateTimeRangePicker value={datetimeRange} onChange={setDatetimeRange} />
          <p className="text-xs text-muted-foreground">
            {datetimeRange?.from
              ? `${format(datetimeRange.from, 'yyyy-MM-dd HH:mm')} ~ ${datetimeRange.to ? format(datetimeRange.to, 'yyyy-MM-dd HH:mm') : '...'}`
              : '未选择'}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">禁用状态</h3>
        <div className="flex gap-3 flex-wrap">
          <DatePicker disabled placeholder="日期禁用" />
          <DateTimePicker disabled placeholder="日期时间禁用" />
          <DateRangePicker disabled placeholder="区间禁用" />
        </div>
      </section>
    </div>
  );
}
