import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { StartVariable, WorkflowValueType } from '../../types';
import { Field } from './shared/Field';

const TYPE_OPTIONS: Array<{ value: WorkflowValueType; label: string }> = [
  { value: 'string', label: '文本' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'object', label: 'JSON 对象' },
  { value: 'array', label: '数组' },
  { value: 'file', label: '文件' },
];

function createVariable(): StartVariable {
  return {
    id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    key: Math.random().toString(36).slice(2, 10),
    label: '',
    description: '',
    valueType: 'string',
    required: true,
    maxLength: 512,
    defaultValue: '',
  };
}

export function StartVariableDialog({
  open,
  mode,
  variable,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  mode: 'add' | 'edit';
  variable?: StartVariable;
  onOpenChange: (open: boolean) => void;
  onConfirm: (variable: StartVariable) => void;
}) {
  const [draft, setDraft] = useState<StartVariable>(createVariable);

  useEffect(() => {
    if (!open) return;
    setDraft(mode === 'edit' && variable ? { ...variable } : createVariable());
  }, [mode, open, variable]);

  const patch = (value: Partial<StartVariable>) => setDraft((current) => ({ ...current, ...value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? '添加变量' : '修改变量'}</DialogTitle>
          <DialogDescription>变量会作为全局参数提交，并可在下游节点中引用。</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <Field label="字段类型">
            <Select value={draft.valueType} onValueChange={(value) => patch({ valueType: value as WorkflowValueType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="变量名称">
            <Input value={draft.label} onChange={(event) => patch({ label: event.target.value })} placeholder="如 name" />
          </Field>
          <Field label="字段说明">
            <Input value={draft.description ?? ''} onChange={(event) => patch({ description: event.target.value })} placeholder="如 姓名" />
          </Field>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div>
              <div className="text-xs font-medium text-foreground">必填</div>
              <div className="text-[10px] text-muted-foreground">调试和 API 调用时必须提供</div>
            </div>
            <Switch checked={draft.required ?? false} onCheckedChange={(required) => patch({ required })} />
          </div>
          {draft.valueType === 'string' && (
            <Field label="最大长度">
              <Input
                type="number"
                min={1}
                value={draft.maxLength ?? ''}
                onChange={(event) => patch({ maxLength: event.target.value ? Number(event.target.value) : undefined })}
                placeholder="留空不限制"
              />
            </Field>
          )}
          <Field label="默认值">
            {draft.valueType === 'string' || draft.valueType === 'object' || draft.valueType === 'array' ? (
              <Textarea
                value={draft.defaultValue ?? ''}
                onChange={(event) => patch({ defaultValue: event.target.value })}
                className="min-h-20 font-mono text-xs"
                placeholder={draft.valueType === 'string' ? '默认值' : 'JSON 格式'}
              />
            ) : (
              <Input value={draft.defaultValue ?? ''} onChange={(event) => patch({ defaultValue: event.target.value })} placeholder="默认值" />
            )}
          </Field>
          <p className="font-mono text-[10px] text-muted-foreground">变量引用：{'{{VARIABLE_NODE_ID.'}{draft.key}{'}}'}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button
            disabled={!draft.label.trim()}
            onClick={() => {
              onConfirm(draft);
              onOpenChange(false);
            }}
          >
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
