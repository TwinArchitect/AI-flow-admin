import { useEffect, useState } from 'react';
import { FileText, Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
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
import { useUploadWorkflowDebugFile } from '../../hooks/useWorkflowRuntime';
import {
  parseDebugFileValue,
  serializeDebugFileValue,
  validateWorkflowUploadFile,
} from '../../utils/workflowDebugContext';
import { Field } from './shared/Field';

const TYPE_OPTIONS: Array<{ value: WorkflowValueType; label: string }> = [
  { value: 'string', label: '文本' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'object', label: 'JSON 对象' },
  { value: 'array', label: '数组' },
  { value: 'file', label: '文件数组' },
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
  agentId,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  mode: 'add' | 'edit';
  variable?: StartVariable;
  agentId?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (variable: StartVariable) => void;
}) {
  const [draft, setDraft] = useState<StartVariable>(createVariable);
  const uploadMutation = useUploadWorkflowDebugFile();
  const defaultFile = draft.valueType === 'file'
    ? parseDebugFileValue(draft.defaultValue ?? '')
    : null;

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
            <Select value={draft.valueType} onValueChange={(value) => patch({
              valueType: value as WorkflowValueType,
              ...((value === 'file' || draft.valueType === 'file') ? { defaultValue: '' } : {}),
            })}>
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
            {draft.valueType === 'file' ? (
              defaultFile ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                  <FileText size={15} className="shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-xs">{defaultFile.fileName}</span>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => patch({ defaultValue: '' })} aria-label={`移除${defaultFile.fileName}`}>
                    <X size={13} />
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-3 text-xs text-muted-foreground hover:border-primary hover:text-primary">
                  {uploadMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Paperclip size={15} />}
                  {uploadMutation.isPending ? '正在上传…' : '上传默认文件'}
                  <input type="file" className="sr-only" disabled={uploadMutation.isPending} onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file) return;
                    if (!agentId) {
                      toast.error('请先保存智能体，再上传默认文件');
                      return;
                    }
                    const validationError = validateWorkflowUploadFile(file);
                    if (validationError) {
                      toast.error(validationError);
                      return;
                    }
                    void uploadMutation.mutateAsync({ file, voucherId: agentId }).then((uploaded) => {
                      patch({ defaultValue: serializeDebugFileValue(uploaded.id, uploaded.name) });
                    }).catch((error: unknown) => {
                      toast.error('文件上传失败', { description: error instanceof Error ? error.message : '未知错误' });
                    });
                  }} />
                </label>
              )
            ) : draft.valueType === 'string' || draft.valueType === 'object' || draft.valueType === 'array' ? (
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
