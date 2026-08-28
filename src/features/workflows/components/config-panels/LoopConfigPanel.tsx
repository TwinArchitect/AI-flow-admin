import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LOOP_START_OUTPUTS,
  normalizeLoopConfig,
} from '../../contracts/loopNodeContract';
import type { LoopCustomOutput, LoopNodeConfig, WorkflowValueType, WorkflowVariableOption } from '../../types';
import { Field } from './shared/Field';
import { VariablePicker } from './shared/VariablePicker';

const OUTPUT_TYPES: WorkflowValueType[] = [
  'string', 'number', 'boolean', 'object', 'any',
  'arrayString', 'arrayNumber', 'arrayBoolean', 'arrayObject', 'arrayAny',
];

function emptyOutput(): LoopCustomOutput {
  return {
    id: `loop-output-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    key: '',
    label: '',
    valueType: 'object',
    value: '',
  };
}

export function LoopConfigPanel({
  config,
  variables,
  onUpdate,
}: {
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<LoopNodeConfig>) => void;
}) {
  const value = normalizeLoopConfig(config);
  const arrayVariables = variables.filter((item) => item.scope !== 'loopChild' && (item.valueType === 'array' || item.valueType.startsWith('array')));
  const childVariables = variables.filter((item) => item.scope === 'loopChild');
  const updateOutput = (id: string, patch: Partial<LoopCustomOutput>) => {
    onUpdate({ customOutputs: value.customOutputs.map((item) => item.id === id ? { ...item, ...patch } : item) });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <div className="text-xs font-semibold text-foreground">循环配置</div>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            当前后端仅完整支持数组循环。循环开始节点会在每轮输出当前索引和当前项。
          </p>
        </div>
        <Field label="运行方式">
          <Input value="数组循环" readOnly className="bg-muted" />
        </Field>
        <Field label="输入数组（必填）">
          <div className="flex gap-2">
            <Input value={value.loopRunInputArray} readOnly placeholder="选择上游数组变量" className="min-w-0 font-mono text-xs" />
            <VariablePicker variables={arrayVariables} onSelect={(loopRunInputArray) => onUpdate({ loopRunInputArray })} />
          </div>
        </Field>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-foreground">循环输出变量</div>
            <p className="mt-1 text-[10px] text-muted-foreground">循环结束后读取循环体内指定节点的最终输出。</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onUpdate({ customOutputs: [...value.customOutputs, emptyOutput()] })}>
            添加输出
          </Button>
        </div>
        {value.customOutputs.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">暂无自定义输出</div>
        ) : value.customOutputs.map((item) => (
          <div key={item.id} className="space-y-2 rounded-md border border-border p-3">
            <div className="flex gap-2">
              <Input
                value={item.key}
                onChange={(event) => updateOutput(item.id, { key: event.target.value, label: event.target.value })}
                placeholder="输出变量名"
                className="min-w-0"
              />
              <Select value={item.valueType} onValueChange={(valueType: WorkflowValueType) => updateOutput(item.id, { valueType })}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{OUTPUT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => onUpdate({ customOutputs: value.customOutputs.filter((row) => row.id !== item.id) })} aria-label="删除循环输出">
                <Trash2 size={14} />
              </Button>
            </div>
            <div className="flex gap-2">
              <Input value={item.value} readOnly placeholder="选择循环体内节点变量" className="min-w-0 font-mono text-xs" />
              <VariablePicker variables={childVariables} onSelect={(ref) => updateOutput(item.id, { value: ref })} />
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-2 border-t border-border pt-5">
        <div className="text-xs font-semibold text-foreground">循环开始节点输出</div>
        <div className="flex flex-wrap gap-2">
          {LOOP_START_OUTPUTS.map((output) => <Badge key={output.key} variant="outline" className="font-mono text-[10px]">{output.key}: {output.valueType}</Badge>)}
        </div>
      </section>
    </div>
  );
}
