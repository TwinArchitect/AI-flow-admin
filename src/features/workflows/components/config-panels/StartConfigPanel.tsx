import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_START_CONFIG } from '../../config/nodeDefaults';
import type { StartNodeConfig } from '../../types';
import { Field } from './shared/Field';

export function StartConfigPanel({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (config: Partial<StartNodeConfig>) => void;
}) {
  const value = {
    ...DEFAULT_START_CONFIG,
    ...(config as Partial<StartNodeConfig>),
    variables:
      (config as Partial<StartNodeConfig>).variables ?? DEFAULT_START_CONFIG.variables,
  };
  const primaryVariable = value.variables[0] ?? DEFAULT_START_CONFIG.variables[0];
  const updatePrimaryVariable = (patch: Partial<typeof primaryVariable>) =>
    onUpdate({
      variables: value.variables.map((variable, index) =>
        index === 0 ? { ...variable, ...patch } : variable,
      ),
    });

  return (
    <div className="space-y-5">
      <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        开始节点定义流程入口。本周先以手动输入作为最小真实路径的入口，后续再扩展 Webhook 和定时触发。
      </p>

      <Field label="输入字段名">
        <Input
          value={primaryVariable.key}
          onChange={(event) => updatePrimaryVariable({ key: event.target.value })}
          placeholder="userChatInput"
        />
      </Field>

      <Field label="显示名称">
        <Input
          value={primaryVariable.label}
          onChange={(event) => updatePrimaryVariable({ label: event.target.value })}
          placeholder="用户问题"
        />
      </Field>

      <Field label="字段说明">
        <Input
          value={primaryVariable.description ?? ''}
          onChange={(event) => updatePrimaryVariable({ description: event.target.value })}
          placeholder="工作流入口用户输入"
        />
      </Field>

      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
        <div>
          <div className="text-xs font-medium text-foreground">必填</div>
          <div className="text-[10px] text-muted-foreground">运行时必须提供该输入</div>
        </div>
        <Switch
          checked={primaryVariable.required ?? false}
          onCheckedChange={(required) => updatePrimaryVariable({ required })}
        />
      </div>

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
          {primaryVariable.key || 'userChatInput'}: string
        </Badge>
      </div>
    </div>
  );
}
