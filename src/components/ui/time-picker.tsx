'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  step?: number;
  className?: string;
  /** 是否显示秒 */
  showSeconds?: boolean;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export function TimePicker({
  value,
  onChange,
  placeholder = '选择时间',
  disabled,
  step = 30,
  showSeconds = false,
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internalH, setH] = React.useState(0);
  const [internalM, setM] = React.useState(0);
  const [internalS, setS] = React.useState(0);

  // 解析外部 value
  React.useEffect(() => {
    if (!value) return;
    const parts = value.split(':').map(Number);
    setH(parts[0] ?? 0);
    setM(parts[1] ?? 0);
    setS(parts[2] ?? 0);
  }, [value]);

  function commit(h: number, m: number, s: number) {
    const t = showSeconds ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}`;
    onChange?.(t);
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);
  const seconds = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);

  const display = value || (open ? `${pad(internalH)}:${pad(internalM)}${showSeconds ? `:${pad(internalS)}` : ''}` : '');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn('w-[140px] justify-start text-left font-normal', !value && 'text-muted-foreground', className)}
        >
          <Clock size={16} className="mr-2 shrink-0" />
          {display || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex divide-x">
          {/* 小时 */}
          <ScrollArea className="h-52 w-14">
            <div className="py-1">
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => { setH(h); commit(h, internalM, internalS); }}
                  className={cn(
                    'w-full px-2 py-1.5 text-center text-sm hover:bg-accent rounded-none',
                    internalH === h && 'bg-primary text-primary-foreground hover:bg-primary',
                  )}
                >
                  {pad(h)}
                </button>
              ))}
            </div>
          </ScrollArea>
          {/* 分钟 */}
          <ScrollArea className="h-52 w-14">
            <div className="py-1">
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setM(m); commit(internalH, m, internalS); }}
                  className={cn(
                    'w-full px-2 py-1.5 text-center text-sm hover:bg-accent rounded-none',
                    internalM === m && 'bg-primary text-primary-foreground hover:bg-primary',
                  )}
                >
                  {pad(m)}
                </button>
              ))}
            </div>
          </ScrollArea>
          {/* 秒 */}
          {showSeconds && (
            <ScrollArea className="h-52 w-14">
              <div className="py-1">
                {seconds.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setS(s); commit(internalH, internalM, s); }}
                    className={cn(
                      'w-full px-2 py-1.5 text-center text-sm hover:bg-accent rounded-none',
                      internalS === s && 'bg-primary text-primary-foreground hover:bg-primary',
                    )}
                  >
                    {pad(s)}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        <div className="border-t p-2 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>关闭</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
