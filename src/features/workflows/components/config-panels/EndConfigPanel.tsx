import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_END_CONFIG } from '../../config/nodeDefaults';
import type { EndNodeConfig, WorkflowVariableOption } from '../../types';
import { Field } from './shared/Field';
import { VariablePicker } from './shared/VariablePicker';

export function EndConfigPanel({
  config,
  variables,
  onUpdate,
}: {
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<EndNodeConfig>) => void;
}) {
  const value = {
    ...DEFAULT_END_CONFIG,
    ...(config as Partial<EndNodeConfig>),
    outputVariables:
      (config as Partial<EndNodeConfig>).outputVariables ?? DEFAULT_END_CONFIG.outputVariables,
  };
  const primaryOutput = value.outputVariables[0] ?? DEFAULT_END_CONFIG.outputVariables[0];

  return (
    <div className="space-y-5">
      <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        结束节点负责组织最终响应。本周先使用模板引用 LLM 输出，后续可扩展多字段输出和结构化响应。
      </p>

      <div className="rounded-md border border-border bg-background px-3 py-2">
        <div className="text-xs font-medium text-foreground">当前输出变量</div>
        <div className="mt-1 font-mono text-[11px] text-muted-foreground">
          {primaryOutput.key || 'answer'} = {primaryOutput.value || '{{llm-demo.answerText}}'}
        </div>
      </div>

      <Field
        label={
          <div className="flex items-center justify-between gap-2">
            <span>输出引用</span>
            <VariablePicker
              variables={variables}
              onSelect={(ref) =>
                onUpdate({
                  outputVariables: value.outputVariables.map((variable, index) =>
                    index === 0 ? { ...variable, value: ref } : variable,
                  ),
                })
              }
            />
          </div>
        }
      >
        <Textarea
          value={primaryOutput.value}
          onChange={(event) =>
            onUpdate({
              outputVariables: value.outputVariables.map((variable, index) =>
                index === 0 ? { ...variable, value: event.target.value } : variable,
              ),
            })
          }
          placeholder="{{llm-demo.answerText}}"
          className="min-h-28 font-mono text-xs"
        />
      </Field>

      <Field label="最终输出字段">
        <Input
          value={primaryOutput.key}
          onChange={(event) =>
            onUpdate({
              outputVariables: value.outputVariables.map((variable, index) =>
                index === 0 ? { ...variable, key: event.target.value } : variable,
              ),
            })
          }
          placeholder="answer"
        />
      </Field>

      <div className="border-t border-border pt-4">
        <div className="mb-2 text-xs font-semibold text-foreground">输出</div>
        <Badge variant="outline" className="font-mono text-[10px]">
          {primaryOutput.key || 'answer'}: string
        </Badge>
      </div>
    </div>
  );
}
