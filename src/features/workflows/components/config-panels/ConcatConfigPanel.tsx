import { useState } from 'react';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { normalizeConcatConfig, TEMPLATE_VALUE_TYPES } from '../../contracts/concatNodeContract';
import type { ConcatNodeConfig, TemplateInputVariable, WorkflowValueType, WorkflowVariableOption } from '../../types';
import { Field } from './shared/Field';
import { VariablePicker } from './shared/VariablePicker';

const EXAMPLES = [
  { title: '多变量问候', template: 'Hi {{ customer }},\n\n{{ body }}\n\n---\nBest regards' },
  { title: '条件分支', template: '{% if order.is_vip %}\n尊敬的 VIP 会员 {{ order.customer }}\n{% else %}\n亲爱的 {{ order.customer }}\n{% endif %}' },
  { title: '列表循环', template: '{% for item in results %}\n### 结果 {{ loop.index }}\n{{ item.content }}\n{% endfor %}' },
  { title: '过滤器与默认值', template: "姓名：{{ name | upper }}\n标签：{{ tags | join(', ') | default('无') }}" },
];

function newInput(): TemplateInputVariable {
  return {
    id: `template-input-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    key: '', label: '', value: '', required: true, valueType: 'string',
  };
}

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
  const [examplesOpen, setExamplesOpen] = useState(false);

  function updateInputs(inputVariables: TemplateInputVariable[]) {
    onUpdate({ inputVariables });
  }

  function patchInput(id: string, patch: Partial<TemplateInputVariable>) {
    updateInputs(value.inputVariables.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-foreground">输入变量</h3>
            <p className="mt-1 text-[10px] text-muted-foreground">定义 Jinja2 模板上下文中的变量名与上游引用。</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => updateInputs([...value.inputVariables, newInput()])}>
            <Plus size={13} />添加变量
          </Button>
        </div>
        {value.inputVariables.length === 0 ? (
          <p className="rounded-md border border-dashed border-border py-4 text-center text-[10px] text-muted-foreground">暂无输入变量，模板中可直接写固定文本</p>
        ) : value.inputVariables.map((item) => (
          <div key={item.id} className="space-y-2 rounded-md border border-border bg-background p-3">
            <div className="grid grid-cols-[1fr_120px_auto] gap-2">
              <Input value={item.key} placeholder="变量名，如 customer" onChange={(event) => patchInput(item.id, { key: event.target.value, label: event.target.value })} />
              <Select value={item.valueType} onValueChange={(valueType) => patchInput(item.id, { valueType: valueType as WorkflowValueType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TEMPLATE_VALUE_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="ghost" size="icon-sm" onClick={() => updateInputs(value.inputVariables.filter((row) => row.id !== item.id))} aria-label="删除输入变量">
                <Trash2 size={13} />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 rounded-md border border-border px-3 py-2 font-mono text-xs text-muted-foreground">
                {item.value || '请选择上游变量'}
              </div>
              <VariablePicker variables={variables} onSelect={(ref) => patchInput(item.id, { value: ref })} />
            </div>
            <label className="flex items-center justify-between text-[10px] text-muted-foreground">
              必填输入
              <Switch checked={item.required} onCheckedChange={(required) => patchInput(item.id, { required })} />
            </label>
          </div>
        ))}
      </section>

      <section className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-foreground">Jinja2 模板</h3>
            <p className="mt-1 text-[10px] text-muted-foreground">使用 {'{{ variable }}'}、条件、循环与过滤器生成文本。</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setExamplesOpen(true)}><BookOpen size={13} />模板示例</Button>
        </div>
        <Field label="模板内容">
          <Textarea
            value={value.template}
            onChange={(event) => onUpdate({ template: event.target.value })}
            placeholder="{% if customer %}Hi {{ customer }}{% endif %}"
            className="min-h-56 resize-y font-mono text-xs"
          />
          <p className="text-right text-[10px] tabular-nums text-muted-foreground">{value.template.length} 字符</p>
        </Field>
      </section>

      <section className="space-y-2 border-t border-border pt-4">
        <h3 className="text-xs font-semibold text-foreground">系统输出</h3>
        <Badge variant="outline" className="font-mono text-[10px]">system_text: string</Badge>
      </section>

      <Dialog open={examplesOpen} onOpenChange={setExamplesOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>模板示例</DialogTitle>
            <DialogDescription>选择后会替换当前模板内容。</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2">
            {EXAMPLES.map((example) => (
              <button key={example.title} type="button" className="rounded-md border border-border p-3 text-left hover:border-primary" onClick={() => {
                onUpdate({ template: example.template });
                setExamplesOpen(false);
              }}>
                <div className="text-xs font-semibold text-foreground">{example.title}</div>
                <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-[10px] text-muted-foreground">{example.template}</pre>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
