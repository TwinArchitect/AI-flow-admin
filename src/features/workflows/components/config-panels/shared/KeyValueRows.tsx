import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { HttpParamRow, WorkflowVariableOption } from '../../../types';
import { VariablePicker } from './VariablePicker';

export function KeyValueRows({
  rows,
  keyPlaceholder,
  valuePlaceholder,
  variables = [],
  onChange,
}: {
  rows: HttpParamRow[];
  keyPlaceholder: string;
  valuePlaceholder: string;
  variables?: WorkflowVariableOption[];
  onChange: (rows: HttpParamRow[]) => void;
}) {
  function createRow(value = ''): HttpParamRow {
    return { id: `http-row-${Date.now()}`, key: '', type: 'string', value };
  }

  function updateRow(index: number, patch: Partial<HttpParamRow>) {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            暂无配置项
          </div>
        ) : (
          rows.map((row, index) => (
            <div key={row.id} className="grid grid-cols-[1fr_1fr_28px] gap-2">
              <Input
                value={row.key}
                onChange={(event) => updateRow(index, { key: event.target.value })}
                placeholder={keyPlaceholder}
                className="h-8 text-xs"
              />
              <Input
                value={row.value}
                onChange={(event) => updateRow(index, { value: event.target.value })}
                placeholder={valuePlaceholder}
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}
                aria-label="删除配置项"
              >
                <Trash2 size={13} />
              </Button>
            </div>
          ))
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() => onChange([...rows, createRow()])}
      >
        <Plus size={13} />
        添加一行
      </Button>
      <VariablePicker
        variables={variables}
        onSelect={(ref) => onChange([...rows, createRow(ref)])}
      />
    </div>
  );
}
