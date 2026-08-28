import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  CLASSIFY_DEFAULT_AGENT_KEY,
  CLASSIFY_DEFAULT_AGENT_LABEL,
  CLASSIFY_HISTORY_MAX,
  createClassifyAgent,
  getClassifyCustomAgents,
  normalizeClassifyConfig,
} from '../../contracts/classifyNodeContract';
import { useWorkflowModels } from '../../hooks/useWorkflowModels';
import type { ClassifyNodeConfig, WorkflowVariableOption } from '../../types';
import { buildClassifySourceHandle } from '../../utils/edgeHandles';
import { Field } from './shared/Field';
import { VariablePicker } from './shared/VariablePicker';

export function ClassifyConfigPanel({
  nodeId,
  config,
  variables,
  onUpdate,
  onRemoveSourceHandle,
}: {
  nodeId: string;
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<ClassifyNodeConfig>) => void;
  onRemoveSourceHandle: (handleId: string) => void;
}) {
  const value = normalizeClassifyConfig(config);
  const customAgents = getClassifyCustomAgents(value.agents);
  const { data: models = [], isLoading, error } = useWorkflowModels();

  function updateAgents(agents: ClassifyNodeConfig['agents']) {
    onUpdate({ agents });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="text-xs font-semibold text-foreground">模型配置</div>
        <Field label="AI 模型">
          <Select
            value={value.model?.id ?? ''}
            onValueChange={(id) => {
              const model = models.find((item) => item.id === id);
              onUpdate({ model: model ? {
                id: model.id,
                model: model.model,
                type: model.type,
                authToken: model.authToken,
                url: model.url,
              } : null });
            }}
          >
            <SelectTrigger><SelectValue placeholder={isLoading ? '加载中...' : '请选择模型'} /></SelectTrigger>
            <SelectContent>
              {value.model && !models.some((model) => model.id === value.model?.id) && (
                <SelectItem value={value.model.id}>{value.model.model}（当前配置）</SelectItem>
              )}
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>{model.name || model.model}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-xs text-destructive">模型列表加载失败</p>}
        </Field>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <div className="text-xs font-semibold text-foreground">输入参数</div>
        <Field label="背景知识">
          <div className="mb-2 flex justify-end">
            <VariablePicker
              variables={variables}
              onSelect={(ref) => onUpdate({ systemPrompt: `${value.systemPrompt}${ref}` })}
            />
          </div>
          <Textarea
            value={value.systemPrompt}
            maxLength={100000}
            onChange={(event) => onUpdate({ systemPrompt: event.target.value })}
            placeholder="描述业务场景，帮助模型理解分类依据"
            className="min-h-24 text-xs"
          />
          <p className="text-right text-[10px] text-muted-foreground">{value.systemPrompt.length}/100000</p>
        </Field>

        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
          <div>
            <p className="text-xs font-medium text-foreground">开启记忆</p>
            <p className="text-[10px] text-muted-foreground">携带历史对话上下文进行分类</p>
          </div>
          <Switch
            size="sm"
            checked={value.memoryEnabled}
            onCheckedChange={(memoryEnabled) => onUpdate({
              memoryEnabled,
              history: memoryEnabled && value.history === 0 ? 6 : value.history,
            })}
          />
        </div>
        {value.memoryEnabled && (
          <Field label={`聊天记录轮数：${value.history}`}>
            <Slider
              min={1}
              max={CLASSIFY_HISTORY_MAX}
              step={1}
              value={[Math.max(1, value.history)]}
              onValueChange={([history]) => onUpdate({ history })}
            />
          </Field>
        )}

        <Field label="用户问题">
          <div className="mb-2 flex justify-end">
            <VariablePicker variables={variables} onSelect={(ref) => onUpdate({ userChatInput: ref })} />
          </div>
          <Textarea
            value={value.userChatInput}
            onChange={(event) => onUpdate({ userChatInput: event.target.value })}
            placeholder="通常选择开始节点的用户问题"
            className="min-h-20 font-mono text-xs"
          />
        </Field>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-foreground">意图分类</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">每个分类对应一个画布分支</div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateAgents([...customAgents, createClassifyAgent()])}
          >
            <Plus size={13} />
            添加分类
          </Button>
        </div>

        {customAgents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-7 text-center text-xs text-muted-foreground">
            暂无自定义分类
          </div>
        ) : customAgents.map((agent, index) => (
          <div key={agent.key} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
            <Badge variant="secondary" className="shrink-0 text-[10px]">#{index + 1}</Badge>
            <Input
              value={agent.value}
              onChange={(event) => updateAgents(customAgents.map((item) => (
                item.key === agent.key ? { ...item, value: event.target.value } : item
              )))}
              placeholder="例如：售前咨询、售后问题"
              className="h-8 min-w-0 flex-1 text-xs"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                onRemoveSourceHandle(buildClassifySourceHandle(nodeId, agent.key));
                updateAgents(customAgents.filter((item) => item.key !== agent.key));
              }}
              aria-label={`删除分类 ${index + 1}`}
            >
              <Trash2 size={13} />
            </Button>
          </div>
        ))}

        <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-3">
          <div>
            <p className="text-xs font-semibold text-foreground">{CLASSIFY_DEFAULT_AGENT_LABEL}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">未匹配任何意图时走此分支</p>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">{CLASSIFY_DEFAULT_AGENT_KEY}</span>
        </div>
      </section>

      <section className="space-y-2 border-t border-border pt-5">
        <div className="text-xs font-semibold text-foreground">系统输出</div>
        <Badge variant="outline" className="font-mono text-[10px]">cqResult: string</Badge>
      </section>
    </div>
  );
}
