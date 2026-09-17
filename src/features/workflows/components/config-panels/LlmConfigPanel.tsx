import { useMemo, useRef, useState } from 'react';
import { FolderOpen, Settings2 } from 'lucide-react';
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
import { normalizeLlmConfig } from '../../contracts/llmNodeContract';
import { useWorkflowModels } from '../../hooks/useWorkflowModels';
import type { LlmNodeConfig, WorkflowVariableOption } from '../../types';
import { buildErrorCatchHandle } from '../../utils/edgeHandles';
import { Field } from './shared/Field';
import { PromptOptimizeControl } from './shared/PromptOptimizeControl';
import { VariablePicker } from './shared/VariablePicker';
import { LlmModelSettingsDialog } from './LlmModelSettingsDialog';

function SectionTitle({ children, optional }: { children: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
      <span>{children}</span>
      {optional && <Badge variant="secondary" className="text-[9px]">可选</Badge>}
    </div>
  );
}

export function LlmConfigPanel({
  nodeId,
  agentId,
  config,
  variables,
  onUpdate,
  onRemoveSourceHandle,
}: {
  nodeId: string;
  agentId?: string;
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<LlmNodeConfig>) => void;
  onRemoveSourceHandle: (handleId: string) => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);
  const userPromptRef = useRef<HTMLTextAreaElement>(null);
  const value = normalizeLlmConfig(config);
  const { data: models = [], isLoading, error } = useWorkflowModels();
  const fileVariables = useMemo(() => variables.filter((variable) => (
    ['file', 'array', 'arrayString'].includes(variable.valueType)
      || /file|文件/i.test(`${variable.outputKey}${variable.outputLabel}`)
  )), [variables]);

  const updateAdvanced = (patch: Partial<LlmNodeConfig['advanced']>) => {
    onUpdate({ advanced: { ...value.advanced, ...patch } });
  };

  const insertPromptVariable = (field: 'systemPrompt' | 'userChatInput', ref: string) => {
    const textarea = field === 'systemPrompt' ? systemPromptRef.current : userPromptRef.current;
    const current = value[field];
    const start = textarea?.selectionStart ?? current.length;
    const end = textarea?.selectionEnd ?? start;
    onUpdate({ [field]: `${current.slice(0, start)}${ref}${current.slice(end)}` });
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + ref.length, start + ref.length);
    });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionTitle>模型配置</SectionTitle>
        <Field label="AI 模型">
          <div className="flex gap-2">
            <Select
              value={value.model?.id ?? ''}
              onValueChange={(id) => {
                const model = models.find((item) => item.id === id);
                onUpdate({ model: model ? { ...model } : null });
              }}
            >
              <SelectTrigger className="min-w-0 flex-1">
                <SelectValue placeholder={isLoading ? '加载中...' : '请选择模型'} />
              </SelectTrigger>
              <SelectContent>
                {value.model && !models.some((model) => model.id === value.model?.id) && (
                  <SelectItem value={value.model.id}>{value.model.model}（当前配置）</SelectItem>
                )}
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>{model.name || model.model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
              <Settings2 size={15} />
              <span className="sr-only">模型参数</span>
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">模型列表加载失败</p>}
        </Field>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <SectionTitle>输入参数</SectionTitle>
        <Field label="系统提示词">
          <div className="mb-2 flex justify-end">
            <VariablePicker
              variables={variables}
              onSelect={(ref) => insertPromptVariable('systemPrompt', ref)}
            />
          </div>
          <PromptOptimizeControl
            scene="system_prompt_optimize"
            content={value.systemPrompt}
            agentId={agentId}
            onApply={(systemPrompt) => onUpdate({ systemPrompt })}
          >
            <Textarea
              ref={systemPromptRef}
              value={value.systemPrompt}
              maxLength={100000}
              onChange={(event) => onUpdate({ systemPrompt: event.target.value })}
              placeholder="例如：你是一个专业的助手..."
              className="min-h-28 pb-10 text-xs"
            />
          </PromptOptimizeControl>
          <p className="text-right text-[10px] text-muted-foreground">{value.systemPrompt.length}/100000</p>
        </Field>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
          <div>
            <p className="text-xs font-medium text-foreground">开启记忆</p>
            <p className="text-[10px] text-muted-foreground">携带历史对话上下文</p>
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
              max={50}
              step={1}
              value={[Math.max(1, value.history)]}
              onValueChange={([history]) => onUpdate({ history })}
            />
          </Field>
        )}
        <Field label="用户问题">
          <div className="mb-2 flex justify-end">
            <VariablePicker variables={variables} onSelect={(ref) => insertPromptVariable('userChatInput', ref)} />
          </div>
          <PromptOptimizeControl
            scene="user_prompt_optimize"
            content={value.userChatInput}
            agentId={agentId}
            onApply={(userChatInput) => onUpdate({ userChatInput })}
          >
            <Textarea
              ref={userPromptRef}
              value={value.userChatInput}
              onChange={(event) => onUpdate({ userChatInput: event.target.value })}
              placeholder={'例如：请根据以下内容回答\n{{start.userChatInput}}'}
              className="min-h-24 pb-10 font-mono text-xs"
            />
          </PromptOptimizeControl>
        </Field>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <SectionTitle optional>多模态能力</SectionTitle>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
          <div>
            <p className="text-xs font-medium text-foreground">启用多模态</p>
            <p className="text-[10px] text-muted-foreground">支持图片和文件输入</p>
          </div>
          <Switch
            size="sm"
            checked={value.multimodalEnabled}
            onCheckedChange={(multimodalEnabled) => onUpdate({
              multimodalEnabled,
              fileUrlRefs: multimodalEnabled ? value.fileUrlRefs : [],
              advanced: {
                ...value.advanced,
                aiChatVision: multimodalEnabled,
                aiChatExtractFiles: multimodalEnabled,
              },
            })}
          />
        </div>
        {value.multimodalEnabled && (
          <Field label="文件列表">
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Input
                  value={value.fileUrlRefs[0] ?? ''}
                  onChange={(event) => onUpdate({ fileUrlRefs: event.target.value ? [event.target.value] : [] })}
                  placeholder="选择文件类型的上游变量"
                  className="pr-8 font-mono text-xs"
                />
                <FolderOpen className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              <VariablePicker
                variables={fileVariables.length ? fileVariables : variables}
                onSelect={(ref) => onUpdate({ fileUrlRefs: [ref] })}
              />
            </div>
          </Field>
        )}
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <SectionTitle optional>异常处理</SectionTitle>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
          <span className="text-xs font-medium text-foreground">启用异常分支</span>
          <Switch
            size="sm"
            checked={value.catchError}
            onCheckedChange={(catchError) => {
              if (!catchError) onRemoveSourceHandle(buildErrorCatchHandle(nodeId));
              onUpdate({ catchError });
            }}
          />
        </div>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <SectionTitle>系统输出</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">history: chatHistory</Badge>
          <Badge variant="outline" className="font-mono text-[10px]">answerText: string</Badge>
          <Badge variant="outline" className="font-mono text-[10px]">reasoningText: string</Badge>
        </div>
      </section>

      <LlmModelSettingsDialog
        open={settingsOpen}
        advanced={value.advanced}
        onOpenChange={setSettingsOpen}
        onUpdate={updateAdvanced}
      />
    </div>
  );
}
