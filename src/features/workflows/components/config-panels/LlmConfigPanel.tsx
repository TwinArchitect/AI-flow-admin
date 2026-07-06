import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_LLM_CONFIG } from '../../config/nodeDefaults';
import type { LlmNodeConfig } from '../../types';
import { Field } from './shared/Field';

const MODEL_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'deepseek-v3', label: 'DeepSeek V3' },
  { value: 'deepseek-r1', label: 'DeepSeek R1' },
  { value: 'qwen-max', label: 'Qwen Max' },
];

export function LlmConfigPanel({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (config: Partial<LlmNodeConfig>) => void;
}) {
  const value = { ...DEFAULT_LLM_CONFIG, ...(config as Partial<LlmNodeConfig>) };

  return (
    <div className="space-y-5">
      <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        LLM 节点负责最小真实路径中的核心处理。本周先固定输入来自开始节点，输出交给结束节点展示。
      </p>

      <Field label="模型选择">
        <Select value={value.model} onValueChange={(model) => onUpdate({ model })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择模型" />
          </SelectTrigger>
          <SelectContent>
            {MODEL_OPTIONS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label={`Temperature: ${value.temperature.toFixed(1)}`}>
        <Slider
          min={0}
          max={1}
          step={0.1}
          value={[value.temperature]}
          onValueChange={([temperature]) => onUpdate({ temperature })}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>精准</span>
          <span>创意</span>
        </div>
      </Field>

      <Field label="最大输出 Token">
        <Input
          type="number"
          min={256}
          max={8192}
          step={256}
          value={value.maxTokens}
          onChange={(event) => onUpdate({ maxTokens: Number(event.target.value) })}
        />
      </Field>

      <Field label="系统提示词">
        <Textarea
          value={value.systemPrompt}
          onChange={(event) => onUpdate({ systemPrompt: event.target.value })}
          placeholder="输入系统提示词，定义模型的角色和行为..."
          className="min-h-28 text-sm"
        />
      </Field>

      <Field label="用户提示词">
        <Textarea
          value={value.userPrompt}
          onChange={(event) => onUpdate({ userPrompt: event.target.value })}
          placeholder="{{start.userInput}}"
          className="min-h-24 font-mono text-xs"
        />
      </Field>

      <Field label="输出字段">
        <Input
          value={value.outputField}
          onChange={(event) => onUpdate({ outputField: event.target.value })}
          placeholder="text"
        />
      </Field>

      <div className="border-t border-border pt-4">
        <div className="mb-2 text-xs font-semibold text-foreground">输出</div>
        <Badge variant="outline" className="font-mono text-[10px]">
          {value.outputField || 'text'}: string
        </Badge>
      </div>
    </div>
  );
}
