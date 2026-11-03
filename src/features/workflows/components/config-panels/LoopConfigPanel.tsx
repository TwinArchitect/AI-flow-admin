import { Badge } from '@/components/ui/badge';
import { VariableInput as Input } from './shared/VariableValueField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LOOP_FIXED_OUTPUTS, LOOP_START_OUTPUTS, normalizeLoopConfig } from '../../contracts/loopNodeContract';
import { getValueTypeLabel } from '../../utils/valueTypes';
import type { LoopNodeConfig, WorkflowVariableOption } from '../../types';
import { Field } from './shared/Field';
import { VariablePicker } from './shared/VariablePicker';

export function LoopConfigPanel({ config, variables, onUpdate }: {
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<LoopNodeConfig>) => void;
}) {
  const value = normalizeLoopConfig(config);
  const arrayVariables = variables.filter((item) => item.scope !== 'loopChild' && item.valueType.startsWith('array'));
  return <div className="space-y-6">
    <section className="space-y-4">
      <h3 className="text-xs font-semibold">循环模式</h3>
      <Field label="运行方式">
        <Select value={value.loopRunMode} onValueChange={(loopRunMode: LoopNodeConfig['loopRunMode']) => onUpdate({ loopRunMode })}>
          <SelectTrigger aria-label="循环运行方式"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="array">数组循环</SelectItem><SelectItem value="conditional">条件循环</SelectItem></SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{value.loopRunMode === 'array' ? '遍历数组中的每一项，依次执行循环体内的节点。' : '重复执行循环体，通过判断器连接循环终止节点结束循环。'}</p>
      </Field>
      {value.loopRunMode === 'array' && <Field label="输入数组（必填）">
        <div className="flex gap-2"><Input variables={variables} value={value.loopRunInputArray} readOnly placeholder="选择上游数组变量" className="min-w-0 font-mono text-xs" /><VariablePicker variables={arrayVariables} onSelect={(loopRunInputArray) => onUpdate({ loopRunInputArray })} /></div>
        <p className="text-xs text-muted-foreground">只能引用一个全局或上游数组变量。</p>
      </Field>}
    </section>
    <section className="space-y-4 border-t border-border pt-5">
      <h3 className="text-xs font-semibold">循环结果</h3>
      <Field label="收集结果（必填）">
        <div className="flex gap-2"><Input variables={variables} value={value.loopOutputSource} readOnly placeholder="选择每轮收集的输出" className="min-w-0 font-mono text-xs" /><VariablePicker variables={variables} onSelect={(loopOutputSource) => onUpdate({ loopOutputSource })} /></div>
      </Field>
      <p className="text-xs leading-relaxed text-muted-foreground">每轮收集一次，按执行顺序汇总到 results（字符串数组）。未产生值时收集空字符串，空循环返回 []。</p>
      <div className="flex flex-wrap gap-2">{LOOP_FIXED_OUTPUTS.map((output) => <Badge key={output.key} variant="outline">{output.label} · {output.key}: {getValueTypeLabel(output.valueType)}</Badge>)}<Badge variant="outline">错误信息 · system_error_text: 文本</Badge></div>
    </section>
    <section className="space-y-2 border-t border-border pt-5">
      <h3 className="text-xs font-semibold">循环开始节点输出</h3>
      <div className="flex flex-wrap gap-2">{LOOP_START_OUTPUTS.map((output) => <Badge key={output.key} variant="outline">{output.label} · {output.key}: {getValueTypeLabel(output.valueType)}</Badge>)}</div>
    </section>
  </div>;
}
