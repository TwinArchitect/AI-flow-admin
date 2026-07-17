/**
 * ModelSelect — 模型选择下拉（简化版）
 *
 * 原型依赖 AgentModelSelect（portal + overlay），当前使用 shadcn Select 实现等价交互。
 * 迁移映射：
 *   bg-slate-50 dark:bg-slate-800 → bg-accent
 *   border-slate-200 dark:border-slate-800 → border-border
 *   text-slate-700 dark:text-slate-200 → text-foreground
 *   text-brand-* → text-primary
 */

import { Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ModelOption {
  id: string;
  label: string;
}

interface ModelSelectProps {
  value: string;
  options?: ModelOption[];
  onChange: (value: string) => void;
}

const DEFAULT_MODELS: ModelOption[] = [
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o-mini' },
  { id: 'deepseek-r1', label: 'DeepSeek-R1' },
  { id: 'qwen-max', label: 'Qwen-Max' },
  { id: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
];

export function ModelSelect({ value, options = DEFAULT_MODELS, onChange }: ModelSelectProps) {
  const selected = options.find((m) => m.id === value);

  return (
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger className="h-7 min-w-[140px] max-w-[200px] rounded-lg border-border bg-accent text-xs font-bold text-foreground shadow-sm gap-1.5 px-2.5">
        <Sparkles size={13} className="text-primary shrink-0" />
        <SelectValue placeholder="选择模型">
          {selected?.label ?? '选择模型'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[160px]">
        {options.map((model) => (
          <SelectItem key={model.id} value={model.id} className="text-xs font-medium">
            {model.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
