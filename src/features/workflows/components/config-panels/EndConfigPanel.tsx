import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_END_CONFIG } from '../../config/nodeDefaults';
import type { EndNodeConfig } from '../../types';
import { Field } from './shared/Field';

export function EndConfigPanel({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (config: Partial<EndNodeConfig>) => void;
}) {
  const value = { ...DEFAULT_END_CONFIG, ...(config as Partial<EndNodeConfig>) };

  return (
    <div className="space-y-5">
      <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        结束节点负责组织最终响应。本周先使用模板引用 LLM 输出，后续可扩展多字段输出和结构化响应。
      </p>

      <Field label="响应模板">
        <Textarea
          value={value.responseTemplate}
          onChange={(event) => onUpdate({ responseTemplate: event.target.value })}
          placeholder="{{llm.text}}"
          className="min-h-28 font-mono text-xs"
        />
      </Field>

      <Field label="最终输出字段">
        <Input
          value={value.outputField}
          onChange={(event) => onUpdate({ outputField: event.target.value })}
          placeholder="answer"
        />
      </Field>

      <div className="border-t border-border pt-4">
        <div className="mb-2 text-xs font-semibold text-foreground">输出</div>
        <Badge variant="outline" className="font-mono text-[10px]">
          {value.outputField || 'answer'}: string
        </Badge>
      </div>
    </div>
  );
}
