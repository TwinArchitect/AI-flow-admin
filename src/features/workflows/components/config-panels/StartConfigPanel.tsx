import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_START_CONFIG } from '../../config/nodeDefaults';
import type { StartNodeConfig } from '../../types';
import { Field } from './shared/Field';

const TRIGGER_OPTIONS = [
  { value: 'manual', label: '手动触发' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'schedule', label: '定时触发' },
];

export function StartConfigPanel({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (config: Partial<StartNodeConfig>) => void;
}) {
  const value = { ...DEFAULT_START_CONFIG, ...(config as Partial<StartNodeConfig>) };

  return (
    <div className="space-y-5">
      <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        开始节点定义流程入口。本周先以手动输入作为最小真实路径的入口，后续再扩展 Webhook 和定时触发。
      </p>

      <Field label="触发方式">
        <Select
          value={value.triggerMode}
          onValueChange={(triggerMode) =>
            onUpdate({ triggerMode: triggerMode as StartNodeConfig['triggerMode'] })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="输入字段名">
        <Input
          value={value.inputField}
          onChange={(event) => onUpdate({ inputField: event.target.value })}
          placeholder="userInput"
        />
      </Field>

      <Field label="模拟输入">
        <Textarea
          value={value.sampleInput}
          onChange={(event) => onUpdate({ sampleInput: event.target.value })}
          placeholder="输入用于本周演示的用户问题..."
          className="min-h-24 text-sm"
        />
      </Field>

      <div className="border-t border-border pt-4">
        <div className="mb-2 text-xs font-semibold text-foreground">输出</div>
        <Badge variant="outline" className="font-mono text-[10px]">
          {value.inputField || 'userInput'}: string
        </Badge>
      </div>
    </div>
  );
}
