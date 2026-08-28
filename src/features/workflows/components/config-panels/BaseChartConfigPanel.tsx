import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  BASE_CHART_NODE_OUTPUTS,
  BASE_CHART_TYPE_OPTIONS,
  normalizeBaseChartConfig,
} from '../../contracts/baseChartNodeContract';
import type { BaseChartField, BaseChartNodeConfig, WorkflowVariableOption } from '../../types';
import { Field } from './shared/Field';
import { VariablePicker } from './shared/VariablePicker';

type ChartFieldKey = 'title' | 'xAxis' | 'yAxis' | 'chartType';

function ChartFieldEditor({
  label,
  field,
  fieldKey,
  variables,
  onChange,
}: {
  label: string;
  field: BaseChartField;
  fieldKey: ChartFieldKey;
  variables: WorkflowVariableOption[];
  onChange: (key: ChartFieldKey, field: BaseChartField) => void;
}) {
  const isChartType = fieldKey === 'chartType';
  const isAxis = fieldKey === 'xAxis' || fieldKey === 'yAxis';
  return (
    <Field label={label}>
      <Select
        value={field.valueMode}
        onValueChange={(valueMode: 'input' | 'reference') => onChange(fieldKey, { valueMode, value: '' })}
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="input">固定值</SelectItem>
          <SelectItem value="reference">引用上游变量</SelectItem>
        </SelectContent>
      </Select>
      {field.valueMode === 'reference' ? (
        <div className="flex gap-2">
          <Input value={field.value} readOnly placeholder="选择上游变量" className="min-w-0 font-mono text-xs" />
          <VariablePicker variables={variables} onSelect={(value) => onChange(fieldKey, { ...field, value })} />
        </div>
      ) : isChartType ? (
        <Select value={field.value} onValueChange={(value) => onChange(fieldKey, { ...field, value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {BASE_CHART_TYPE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : isAxis ? (
        <Textarea
          value={field.value}
          onChange={(event) => onChange(fieldKey, { ...field, value: event.target.value })}
          placeholder={fieldKey === 'xAxis' ? '["A","B","C"]' : '[1,2,3]'}
          className="min-h-20 font-mono text-xs"
        />
      ) : (
        <Input value={field.value} onChange={(event) => onChange(fieldKey, { ...field, value: event.target.value })} placeholder="BI 图表标题" />
      )}
    </Field>
  );
}

export function BaseChartConfigPanel({
  config,
  variables,
  onUpdate,
}: {
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<BaseChartNodeConfig>) => void;
}) {
  const value = normalizeBaseChartConfig(config);
  const updateField = (key: ChartFieldKey, field: BaseChartField) => onUpdate({ [key]: field });
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="text-xs font-semibold text-foreground">图表配置</div>
        <ChartFieldEditor label="图表类型" fieldKey="chartType" field={value.chartType} variables={variables} onChange={updateField} />
        <ChartFieldEditor label="图表标题（可选）" fieldKey="title" field={value.title} variables={variables} onChange={updateField} />
        <ChartFieldEditor label="X 轴数据" fieldKey="xAxis" field={value.xAxis} variables={variables} onChange={updateField} />
        <ChartFieldEditor label="Y 轴数据" fieldKey="yAxis" field={value.yAxis} variables={variables} onChange={updateField} />
        <p className="text-[10px] leading-relaxed text-muted-foreground">轴数据固定值填写 JSON 数组，或者引用上游数组变量。</p>
      </section>
      <section className="space-y-3 border-t border-border pt-5">
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
          <div>
            <p className="text-xs font-medium text-foreground">输出图表</p>
            <p className="text-[10px] text-muted-foreground">开启后请求生成图表输出</p>
          </div>
          <Switch size="sm" checked={value.outputChart} onCheckedChange={(outputChart) => onUpdate({ outputChart })} />
        </div>
      </section>
      <section className="space-y-2 border-t border-border pt-5">
        <div className="text-xs font-semibold text-foreground">系统输出</div>
        <div className="flex flex-wrap gap-2">
          {BASE_CHART_NODE_OUTPUTS.map((output) => (
            <Badge key={output.key} variant="outline" className="font-mono text-[10px]">{output.key}: {output.valueType}</Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
