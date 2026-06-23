import * as React from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnSizingState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type Table as TanTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from './dropdown-menu';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

// ── 排序图标 ────────────────────────────────────────────────────────
function SortingIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (!isSorted) return <ArrowUpDown size={14} className="ml-1 shrink-0 text-muted-foreground/40" />;
  return isSorted === 'asc'
    ? <ArrowUp size={14} className="ml-1 shrink-0 text-primary" />
    : <ArrowDown size={14} className="ml-1 shrink-0 text-primary" />;
}

function reorderColumnOrder(current: string[], draggedId: string, targetId: string): string[] {
  const draggedIndex = current.indexOf(draggedId);
  const targetIndex = current.indexOf(targetId);

  if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
    return current;
  }

  const next = [...current];
  const [moved] = next.splice(draggedIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

// ── 分页栏 ──────────────────────────────────────────────────────────
function DataTablePagination<TData>({ table }: { table: TanTable<TData> }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <span className="mr-2">
            已选 {table.getFilteredSelectedRowModel().rows.length} /
            {table.getFilteredRowModel().rows.length} 条
          </span>
        )}
        <span>每页</span>
        <Select
          value={String(table.getState().pagination.pageSize)}
          onValueChange={v => table.setPageSize(Number(v))}
        >
          <SelectTrigger className="w-[64px] h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 50].map(s => (
              <SelectItem key={s} value={String(s)}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>条，共 {table.getFilteredRowModel().rows.length} 条</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs"
          disabled={!table.getCanPreviousPage()} onClick={() => table.setPageIndex(0)}>
          首页
        </Button>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs"
          disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
          上一页
        </Button>
        <span className="px-2 text-muted-foreground tabular-nums">
          {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </span>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs"
          disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
          下一页
        </Button>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs"
          disabled={!table.getCanNextPage()} onClick={() => table.setPageIndex(table.getPageCount() - 1)}>
          末页
        </Button>
      </div>
    </div>
  );
}

// ── 列显示/隐藏控制 ─────────────────────────────────────────────────
function DataTableViewOptions<TData>({ table }: { table: TanTable<TData> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
          列 <ChevronDown size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table.getAllColumns()
          .filter(col => col.getCanHide())
          .map(col => (
            <DropdownMenuCheckboxItem
              key={col.id}
              checked={col.getIsVisible()}
              onCheckedChange={v => col.toggleVisibility(!!v)}
            >
              {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── DataTable Props ─────────────────────────────────────────────────
export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** 搜索框 placeholder */
  searchPlaceholder?: string;
  /** 按哪个字段做全局搜索（列 id） */
  searchColumn?: string;
  /** 工具栏额外内容（批量操作等） */
  toolbar?: (table: TanTable<TData>) => React.ReactNode;
  /** 是否显示行选择列 */
  selectable?: boolean;
  /** 是否显示列显隐控制 */
  showViewOptions?: boolean;
  /** 是否显示分页栏 */
  showPagination?: boolean;
  /** 初始每页条数 */
  pageSize?: number;
  /** 是否开启列宽拖动 */
  enableColumnResizing?: boolean;
  /** 是否开启列拖拽排序 */
  enableColumnReordering?: boolean;
  className?: string;
}

// ── 选择列定义（通用） ──────────────────────────────────────────────
export function createSelectColumn<TData>(): ColumnDef<TData> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
            ? 'indeterminate'
            : false
        }
        onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={v => row.toggleSelected(!!v)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  };
}

// ── 主组件 ──────────────────────────────────────────────────────────
export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = '搜索...',
  searchColumn,
  toolbar,
  selectable = false,
  showViewOptions = true,
  showPagination = true,
  pageSize = 10,
  enableColumnResizing = false,
  enableColumnReordering = false,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([]);
  const [draggingColumnId, setDraggingColumnId] = React.useState<string | null>(null);
  const isResizingRef = React.useRef(false);

  const applyWidth = React.useCallback((el: HTMLElement | null, size: number) => {
    if (!el) return;
    const width = `${size}px`;
    el.style.width = width;
    el.style.minWidth = width;
    el.style.maxWidth = width;
  }, []);

  React.useEffect(() => {
    const handleResizeEnd = () => {
      isResizingRef.current = false;
    };

    window.addEventListener('mouseup', handleResizeEnd);
    window.addEventListener('touchend', handleResizeEnd);

    return () => {
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('touchend', handleResizeEnd);
    };
  }, []);

  const allColumns = React.useMemo<ColumnDef<TData, TValue>[]>(
    () => (selectable ? [createSelectColumn<TData>() as ColumnDef<TData, TValue>, ...columns] : columns),
    [columns, selectable],
  );

  const defaultColumnOrder = React.useMemo<string[]>(
    () =>
      allColumns.map((col, idx) => {
        const accessorKey = (col as { accessorKey?: string }).accessorKey;
        return col.id ?? accessorKey ?? `column_${idx}`;
      }),
    [allColumns],
  );

  React.useEffect(() => {
    setColumnOrder(prev => {
      if (prev.length === defaultColumnOrder.length && prev.every(id => defaultColumnOrder.includes(id))) {
        return prev;
      }
      return defaultColumnOrder;
    });
  }, [defaultColumnOrder]);

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, columnSizing, columnOrder },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    enableColumnResizing,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className={cn('rounded-lg border', className)}>
      {/* 工具栏 */}
      <div className="flex items-center gap-2 p-3 border-b flex-wrap">
        {searchColumn && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''}
            onChange={e => table.getColumn(searchColumn)?.setFilterValue(e.target.value)}
            className="h-8 text-sm max-w-xs"
          />
        )}
        {toolbar?.(table)}
        {showViewOptions && (
          <div className="ml-auto">
            <DataTableViewOptions table={table} />
          </div>
        )}
      </div>

      {/* 表格 */}
      <Table className={cn(enableColumnResizing && 'table-fixed')}>
        <TableHeader>
          {table.getHeaderGroups().map(hg => (
            <TableRow key={hg.id}>
              {hg.headers.map(header => {
                const columnId = header.column.id;
                const canReorder =
                  enableColumnReordering &&
                  !header.isPlaceholder &&
                  columnId !== 'select';

                return (
                <TableHead
                  key={header.id}
                  ref={el => {
                    applyWidth(el, header.getSize());
                  }}
                  className={cn(
                    'group relative pr-4',
                    canReorder && 'cursor-grab',
                    draggingColumnId === columnId && 'opacity-60',
                  )}
                  draggable={canReorder}
                  onDragStart={e => {
                    if (!canReorder || isResizingRef.current) {
                      e.preventDefault();
                      return;
                    }
                    setDraggingColumnId(columnId);
                  }}
                  onDragOver={e => {
                    if (!canReorder) return;
                    e.preventDefault();
                  }}
                  onDrop={() => {
                    if (!canReorder || !draggingColumnId) return;
                    setColumnOrder(prev => reorderColumnOrder(prev, draggingColumnId, columnId));
                    setDraggingColumnId(null);
                  }}
                  onDragEnd={() => setDraggingColumnId(null)}
                >
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <button
                      onClick={header.column.getToggleSortingHandler()}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <SortingIcon isSorted={header.column.getIsSorted()} />
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}

                  {enableColumnResizing && header.column.getCanResize() && (
                    <div
                      onMouseDown={e => {
                        e.stopPropagation();
                        isResizingRef.current = true;
                        header.getResizeHandler()(e);
                      }}
                      onTouchStart={e => {
                        e.stopPropagation();
                        isResizingRef.current = true;
                        header.getResizeHandler()(e);
                      }}
                      onMouseUp={() => {
                        isResizingRef.current = false;
                      }}
                      onTouchEnd={() => {
                        isResizingRef.current = false;
                      }}
                      onDragStart={e => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className={cn(
                        'absolute right-0 top-1/2 z-10 h-6 w-2 -translate-y-1/2 cursor-col-resize select-none touch-none',
                        'before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:-translate-x-1/2',
                        header.column.getIsResizing()
                          ? 'opacity-100 bg-primary/10 before:bg-primary'
                          : 'opacity-0 bg-transparent before:bg-border group-hover:opacity-100 hover:bg-border/20 hover:before:bg-primary/70',
                      )}
                      aria-label="调整列宽"
                      title="拖动调整列宽"
                    />
                  )}
                </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}
                className={row.getIsSelected() ? 'bg-muted/50' : undefined}>
                {row.getVisibleCells().map(cell => (
                  <TableCell
                    key={cell.id}
                    ref={el => {
                      applyWidth(el, cell.column.getSize());
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={allColumns.length} className="text-center py-10 text-muted-foreground text-sm">
                暂无数据
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* 分页 */}
      {showPagination && <DataTablePagination table={table} />}
    </div>
  );
}
