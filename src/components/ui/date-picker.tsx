'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// ── 单日 ──────────────────────────────────────────────────────────
interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = '选择日期', disabled, className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  function handleSelect(date: Date | undefined) {
    onChange?.(date);
    if (date) setOpen(false);  // 选择后关闭
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn('w-[200px] justify-start text-left font-normal', !value && 'text-muted-foreground', className)}
        >
          <CalendarIcon size={16} className="mr-2 shrink-0" />
          {value ? format(value, 'yyyy-MM-dd') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={handleSelect} locale={zhCN} />
      </PopoverContent>
    </Popover>
  );
}

// ── 日期时间 ──────────────────────────────────────────────────────
interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({ value, onChange, placeholder = '选择日期时间', disabled, className }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [time, setTime] = React.useState(value ? format(value, 'HH:mm') : '00:00');

  function handleDateSelect(date: Date | undefined) {
    if (!date) { onChange?.(undefined); return; }
    const [h, m] = time.split(':').map(Number);
    const next = new Date(date);
    next.setHours(h, m, 0, 0);
    onChange?.(next);
    setOpen(false);  // 选择后关闭
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTime(e.target.value);
    if (value) {
      const [h, m] = e.target.value.split(':').map(Number);
      const next = new Date(value);
      next.setHours(h, m, 0, 0);
      onChange?.(next);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn('w-[220px] justify-start text-left font-normal', !value && 'text-muted-foreground', className)}
        >
          <CalendarIcon size={16} className="mr-2 shrink-0" />
          {value ? format(value, 'yyyy-MM-dd HH:mm') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={handleDateSelect} locale={zhCN} />
        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-8">时间</span>
            <input
              type="time"
              value={time}
              onChange={handleTimeChange}
              className="flex-1 rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-background"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── 日期区间 ──────────────────────────────────────────────────────
export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({ value, onChange, placeholder = '选择日期范围', disabled, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn('w-[280px] justify-start text-left font-normal', !value?.from && 'text-muted-foreground', className)}
        >
          <CalendarIcon size={16} className="mr-2 shrink-0" />
          {value?.from
            ? value.to
              ? `${format(value.from, 'yyyy-MM-dd')} ~ ${format(value.to, 'yyyy-MM-dd')}`
              : format(value.from, 'yyyy-MM-dd')
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="range" selected={value} onSelect={onChange} locale={zhCN} numberOfMonths={2} />
      </PopoverContent>
    </Popover>
  );
}

// ── 日期时间区间 ──────────────────────────────────────────────────
export interface DateTimeRange {
  from?: Date;
  to?: Date;
}

interface DateTimeRangePickerProps {
  value?: DateTimeRange;
  onChange?: (range: DateTimeRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimeRangePicker({
  value,
  onChange,
  placeholder = '选择日期时间范围',
  disabled,
  className,
}: DateTimeRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [fromTime, setFromTime] = React.useState(value?.from ? format(value.from, 'HH:mm') : '00:00');
  const [toTime, setToTime] = React.useState(value?.to ? format(value.to, 'HH:mm') : '23:59');

  const dateRange: DateRange | undefined = value?.from
    ? { from: value.from, to: value.to }
    : undefined;

  function applyTime(date: Date, timeStr: string): Date {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
  }

  function handleRangeSelect(range: DateRange | undefined) {
    if (!range?.from) { onChange?.(undefined); return; }
    onChange?.({
      from: applyTime(range.from, fromTime),
      to: range.to ? applyTime(range.to, toTime) : undefined,
    });
    // 不自动关闭，让用户调整时间
  }

  function handleFromTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFromTime(e.target.value);
    if (value?.from) {
      onChange?.({ ...value, from: applyTime(value.from, e.target.value) });
    }
  }

  function handleToTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setToTime(e.target.value);
    if (value?.to) {
      onChange?.({ ...value, to: applyTime(value.to, e.target.value) });
    }
  }

  const displayText = value?.from
    ? value.to
      ? `${format(value.from, 'MM-dd HH:mm')} ~ ${format(value.to, 'MM-dd HH:mm')}`
      : format(value.from, 'yyyy-MM-dd HH:mm')
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn('w-[340px] justify-start text-left font-normal', !value?.from && 'text-muted-foreground', className)}
        >
          <CalendarIcon size={16} className="mr-2 shrink-0" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={handleRangeSelect}
          locale={zhCN}
          numberOfMonths={2}
        />
        <div className="border-t p-3 flex gap-6">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-muted-foreground whitespace-nowrap">开始时间</span>
            <input
              type="time"
              value={fromTime}
              onChange={handleFromTimeChange}
              className="flex-1 rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-background"
            />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-muted-foreground whitespace-nowrap">结束时间</span>
            <input
              type="time"
              value={toTime}
              onChange={handleToTimeChange}
              className="flex-1 rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-background"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
