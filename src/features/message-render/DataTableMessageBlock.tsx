import { Table2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DataTableBlockPayload } from './richContent';

function isPayload(value: unknown): value is DataTableBlockPayload {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<DataTableBlockPayload>;
  return Array.isArray(row.columns) && Array.isArray(row.rows) && typeof row.total === 'number';
}

function formatCell(value: unknown) {
  if (value == null) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function DataTableMessageBlock({ payload }: { payload: unknown }) {
  if (!isPayload(payload)) return null;
  return (
    <section className="min-w-[320px] overflow-hidden rounded-md border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <span className="flex items-center gap-2 text-xs font-medium text-foreground">
          <Table2 size={14} className="text-primary" />
          {payload.title || '数据表格'}
        </span>
        <span className="text-[10px] text-muted-foreground">{payload.total} 行</span>
      </header>
      <div className="max-h-80 overflow-auto">
        <Table className="text-xs">
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              {payload.columns.map((column) => <TableHead key={column} className="h-8">{column}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {payload.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {payload.columns.map((column) => (
                  <TableCell key={column} className="max-w-64 truncate py-1.5" title={formatCell(row[column])}>
                    {formatCell(row[column])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {payload.total > payload.rows.length && (
        <p className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
          为保证渲染性能，仅展示前 {payload.rows.length} 行。
        </p>
      )}
    </section>
  );
}
