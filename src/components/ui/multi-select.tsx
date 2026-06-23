'use client';

import * as React from 'react';
import { X, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  maxCount?: number;
  maxDisplay?: number;  // 最多显示几个标签，超出显示+n
  disabled?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = '请选择...',
  searchPlaceholder = '搜索...',
  emptyText = '未找到选项',
  maxCount,
  maxDisplay = 2,
  disabled,
  size = 'default',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  function toggle(optValue: string) {
    if (value.includes(optValue)) {
      onChange?.(value.filter((v) => v !== optValue));
    } else {
      if (maxCount && value.length >= maxCount) return;
      onChange?.([...value, optValue]);
    }
  }

  function remove(optValue: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange?.(value.filter((v) => v !== optValue));
  }

  const selectedLabels = value.map((v) => options.find((o) => o.value === v)?.label ?? v);
  const displayLabels = selectedLabels.slice(0, maxDisplay);
  const overflowCount = selectedLabels.length - maxDisplay;
  const sizeClasses = {
    sm: 'h-8 text-xs',
    default: 'h-9 text-sm',
  };
  const badgeSize = size === 'sm' ? 'text-[10px] px-1 py-0' : 'text-xs px-2 py-0.5';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'min-w-[200px] justify-between px-3 font-normal overflow-hidden',
            sizeClasses[size],
            !value.length && 'text-muted-foreground',
            className,
          )}
        >
          <div className="flex items-center gap-1 flex-1 overflow-hidden">
            {value.length === 0 && <span>{placeholder}</span>}
            {displayLabels.map((label, i) => (
              <Badge
                key={value[i]}
                variant="secondary"
                className={cn('gap-1 pr-1 shrink-0', badgeSize)}
              >
                <span className="truncate max-w-[80px]">{label}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => remove(value[i], e)}
                  onKeyDown={(e) => e.key === 'Enter' && remove(value[i], e as never)}
                  className="rounded-full hover:bg-muted-foreground/20 p-0.5 cursor-pointer shrink-0"
                >
                  <X size={size === 'sm' ? 8 : 10} />
                </span>
              </Badge>
            ))}
            {overflowCount > 0 && (
              <Badge variant="outline" className={cn('shrink-0', badgeSize)}>
                +{overflowCount}
              </Badge>
            )}
          </div>
          <ChevronsUpDown size={size === 'sm' ? 12 : 14} className="ml-1 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled || (!!maxCount && value.length >= maxCount && !value.includes(option.value))}
                  onSelect={() => toggle(option.value)}
                >
                  <Check
                    size={14}
                    className={cn('mr-2 shrink-0', value.includes(option.value) ? 'opacity-100' : 'opacity-0')}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {value.length > 0 && (
          <div className="border-t p-2 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">已选 {value.length}{maxCount ? `/${maxCount}` : ''} 项</span>
            <button type="button" onClick={() => onChange?.([])} className="text-xs text-muted-foreground hover:text-foreground">
              清空
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
