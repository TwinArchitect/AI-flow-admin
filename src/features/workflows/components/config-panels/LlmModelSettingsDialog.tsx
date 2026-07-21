import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { LlmAdvancedConfig } from '../../types';
import { Field } from './shared/Field';

export function LlmModelSettingsDialog({
  open,
  advanced,
  onOpenChange,
  onUpdate,
}: {
  open: boolean;
  advanced: LlmAdvancedConfig;
  onOpenChange: (open: boolean) => void;
  onUpdate: (patch: Partial<LlmAdvancedConfig>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>模型参数</DialogTitle>
          <DialogDescription>调整当前 LLM 节点的生成参数。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <Field label="回复上限">
            <Input
              type="number"
              min={0}
              value={advanced.maxToken}
              onChange={(event) => onUpdate({ maxToken: Number(event.target.value) })}
            />
            <p className="text-[10px] text-muted-foreground">单次回复最大 Token 数，默认 12000</p>
          </Field>
          <Field label="温度">
            <Input
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={advanced.temperature}
              onChange={(event) => onUpdate({ temperature: Number(event.target.value) })}
            />
            <p className="text-[10px] text-muted-foreground">0 更稳定，越高越发散</p>
          </Field>
          <Field label="Top P">
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={advanced.aiChatTopP ?? ''}
              placeholder="留空使用模型默认"
              onChange={(event) => onUpdate({
                aiChatTopP: event.target.value === '' ? undefined : Number(event.target.value),
              })}
            />
          </Field>
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">是否推理</span>
              <Switch
                size="sm"
                checked={advanced.aiChatReasoning}
                onCheckedChange={(aiChatReasoning) => onUpdate({ aiChatReasoning })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">隐藏 AI 输出</span>
              <Switch
                size="sm"
                checked={!advanced.isResponseAnswerText}
                onCheckedChange={(hidden) => onUpdate({ isResponseAnswerText: !hidden })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>完成</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
