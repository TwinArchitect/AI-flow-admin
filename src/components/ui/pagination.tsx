import type { ReactNode } from 'react';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  disabled?: boolean;
  selection?: ReactNode;
  className?: string;
}

/** 从 DataTable 提取，表格和列表共用；页码从 1 开始。 */
export function Pagination({ page, pageCount, pageSize, total, onPageChange, onPageSizeChange, disabled, selection, className }: PaginationProps) {
  const count = Math.max(1, pageCount);
  return (
    <nav aria-label="分页" className={cn('flex w-full flex-wrap items-center justify-between gap-3 text-sm', className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {selection}<span>每页</span>
        {onPageSizeChange ? (
          <Select value={String(pageSize)} onValueChange={v => onPageSizeChange(Number(v))} disabled={disabled}>
            <SelectTrigger className="w-[64px] h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{Array.from(new Set([5, 10, 20, 50, pageSize])).sort((a, b) => a - b).map(size => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
          </Select>
        ) : <span>{pageSize}</span>}
        <span>条，共 {total} 条</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={disabled || page <= 1} onClick={() => onPageChange(1)}>首页</Button>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)}>上一页</Button>
        <span className="px-2 text-muted-foreground tabular-nums">{page} / {count}</span>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={disabled || page >= count} onClick={() => onPageChange(page + 1)}>下一页</Button>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={disabled || page >= count} onClick={() => onPageChange(count)}>末页</Button>
      </div>
    </nav>
  );
}
