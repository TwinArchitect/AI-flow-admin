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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_LLM_CONFIG } from '../../config/nodeDefaults';
import type { LlmNodeConfig, WorkflowVariableOption } from '../../types';
import { Field } from './shared/Field';
import { VariablePicker } from './shared/VariablePicker';

const MODEL_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'deepseek-v3', label: 'DeepSeek V3' },
  { value: 'deepseek-r1', label: 'DeepSeek R1' },
  { value: 'qwen-max', label: 'Qwen Max' },
];

export function LlmConfigPanel({
  config,
  variables,
  onUpdate,
}: {
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<LlmNodeConfig>) => void;
}) {
  const value = { ...DEFAULT_LLM_CONFIG, ...(config as Partial<LlmNodeConfig>) };
  const advanced = { ...DEFAULT_LLM_CONFIG.advanced, ...value.advanced };
  const selectedModel = value.model?.model ?? '';

  return (
    <div className="space-y-5">
      <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        LLM 节点负责最小真实路径中的核心处理。本周先固定输入来自开始节点，输出交给结束节点展示。
      </p>

      <Field label="模型选择">
        <Select
          value={selectedModel}
          onValueChange={(model) => onUpdate({ model: { id: '', model, type: 'llm' } })}
        >
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

      <Field label={`Temperature: ${advanced.temperature.toFixed(1)}`}>
        <Slider
          min={0}
          max={1}
          step={0.1}
          value={[advanced.temperature]}
          onValueChange={([temperature]) =>
            onUpdate({ advanced: { ...advanced, temperature } })
          }
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
          max={32000}
          step={256}
          value={advanced.maxToken}
          onChange={(event) =>
            onUpdate({ advanced: { ...advanced, maxToken: Number(event.target.value) } })
          }
        />
      </Field>

      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
        <div>
          <div className="text-xs font-medium text-foreground">对话记忆</div>
          <div className="text-[10px] text-muted-foreground">开启后携带最近多轮上下文</div>
        </div>
        <Switch
          checked={value.memoryEnabled}
          onCheckedChange={(memoryEnabled) =>
            onUpdate({
              memoryEnabled,
              history: memoryEnabled ? Math.max(value.history, 6) : 0,
            })
          }
        />
      </div>

      <Field label="携带历史轮数">
        <Input
          type="number"
          min={0}
          max={50}
          value={value.history}
          disabled={!value.memoryEnabled}
          onChange={(event) => onUpdate({ history: Number(event.target.value) })}
        />
      </Field>

      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
        <div>
          <div className="text-xs font-medium text-foreground">推理内容</div>
          <div className="text-[10px] text-muted-foreground">保留 reasoningText 输出定义</div>
        </div>
        <Switch
          checked={advanced.aiChatReasoning}
          onCheckedChange={(aiChatReasoning) =>
            onUpdate({ advanced: { ...advanced, aiChatReasoning } })
          }
        />
      </div>

      <Field label="系统提示词">
        <Textarea
          value={value.systemPrompt}
          onChange={(event) => onUpdate({ systemPrompt: event.target.value })}
          placeholder="输入系统提示词，定义模型的角色和行为..."
          className="min-h-28 text-sm"
        />
      </Field>

      <Field
        label={
          <div className="flex items-center justify-between gap-2">
            <span>用户提示词</span>
            <VariablePicker
              variables={variables}
              onSelect={(ref) =>
                onUpdate({
                  userChatInput: value.userChatInput ? `${value.userChatInput}\n${ref}` : ref,
                })
              }
            />
          </div>
        }
      >
        <Textarea
          value={value.userChatInput}
          onChange={(event) => onUpdate({ userChatInput: event.target.value })}
          placeholder="{{start.userChatInput}}"
          className="min-h-24 font-mono text-xs"
        />
      </Field>

      <div className="border-t border-border pt-4">
        <div className="mb-2 text-xs font-semibold text-foreground">输出</div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">
            answerText: string
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px]">
            history: chatHistory
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px]">
            reasoningText: string
          </Badge>
        </div>
      </div>
    </div>
  );
}
