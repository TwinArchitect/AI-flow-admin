import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { normalizeConcatConfig } from '../../contracts/concatNodeContract';
import type { ConcatNodeConfig, WorkflowVariableOption } from '../../types';
import { Field } from './shared/Field';
import { VariablePicker } from './shared/VariablePicker';

export function ConcatConfigPanel({
  config,
  variables,
  onUpdate,
}: {
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<ConcatNodeConfig>) => void;
}) {
  const value = normalizeConcatConfig(config);
  const [selection, setSelection] = useState({ start: value.template.length, end: value.template.length });

  function insertVariable(ref: string) {
    const start = Math.min(selection.start, value.template.length);
    const end = Math.min(Math.max(selection.end, start), value.template.length);
    onUpdate({
      template: `${value.template.slice(0, start)}${ref}${value.template.slice(end)}`,
    });
    const nextPosition = start + ref.length;
    setSelection({ start: nextPosition, end: nextPosition });
  }

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div>
          <h3 className="text-xs font-semibold text-foreground">输入参数</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            将固定文本与上游变量组合为一个完整字符串。
          </p>
        </div>
        <Field label="拼接模板">
          <div className="mb-2 flex justify-end">
            <VariablePicker variables={variables} onSelect={insertVariable} />
          </div>
          <Textarea
            value={value.template}
            onChange={(event) => {
              onUpdate({ template: event.target.value });
              setSelection({
                start: event.target.selectionStart,
                end: event.target.selectionEnd,
              });
            }}
            onSelect={(event) => setSelection({
              start: event.currentTarget.selectionStart,
              end: event.currentTarget.selectionEnd,
            })}
            placeholder="输入固定文本，或插入上游变量"
            className="min-h-40 font-mono text-xs"
          />
          <div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
            <span>非字符串变量由后端转换为字符串后拼接</span>
            <span className="shrink-0 tabular-nums">{value.template.length}</span>
          </div>
        </Field>
      </section>

      <section className="space-y-3 border-t border-border pt-4">
        <div>
          <h3 className="text-xs font-semibold text-foreground">系统输出</h3>
          <p className="mt-1 text-[10px] text-muted-foreground">拼接结果可供所有下游节点引用。</p>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">
          system_text: string
        </Badge>
      </section>
    </div>
  );
}
