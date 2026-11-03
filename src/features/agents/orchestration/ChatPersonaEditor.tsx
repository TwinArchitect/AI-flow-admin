import { useRef, useState } from 'react';
import { Braces } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VariableTextarea } from '@/features/workflows/components/config-panels/shared/VariableValueField';
import { ensureSystemStartVariables } from '@/features/workflows/contracts/startNodeContract';
import { getValueTypeLabel } from '@/features/workflows/utils/valueTypes';
import type { StartVariable, WorkflowVariableOption } from '@/features/workflows/types';

export function ChatPersonaEditor({ value, variables, onChange }: {
  value: string; variables: StartVariable[]; onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const selection = useRef({ start: value.length, end: value.length });
  const slashRange = useRef<{ start: number; end: number } | null>(null);
  const options: WorkflowVariableOption[] = ensureSystemStartVariables(variables).map((variable) => ({
    nodeId: 'VARIABLE_NODE_ID', nodeLabel: '输入变量', nodeType: 'global', outputKey: variable.key,
    outputLabel: variable.description?.trim() || variable.label?.trim() || variable.key, valueType: variable.valueType,
    ref: `{{VARIABLE_NODE_ID.${variable.key}}}`,
  }));
  const rememberSelection = () => {
    if (textarea.current) selection.current = { start: textarea.current.selectionStart, end: textarea.current.selectionEnd };
  };
  return <div className="space-y-2">
    <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">输入 / 可插入输入变量。</p><Button variant="outline" size="sm" onClick={() => { slashRange.current = null; setOpen(true); }}><Braces size={14} />插入输入变量</Button></div>
    <VariableTextarea ref={textarea} variables={options} rows={16} value={value} onSelect={rememberSelection} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => {
      if (event.key === '/' && !event.nativeEvent.isComposing && !event.ctrlKey && !event.metaKey && !event.altKey) {
        rememberSelection();
        const { start, end } = selection.current;
        if (start > 0 && !/\s/.test(value[start - 1])) return;
        event.preventDefault();
        onChange(value.slice(0, start) + '/' + value.slice(end));
        slashRange.current = { start, end: start + 1 };
        setOpen(true);
      }
    }} placeholder="定义角色、人设、思考和回复规范" />
    <Dialog open={open} onOpenChange={(next) => { if (!next) slashRange.current = null; setOpen(next); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>插入输入变量</DialogTitle><DialogDescription>选择后插入人设光标处，保留变量引用键。</DialogDescription></DialogHeader><div className="max-h-[55vh] space-y-2 overflow-y-auto">{options.map((option) => <Button key={option.ref} variant="outline" className="h-auto w-full justify-between gap-3 whitespace-normal py-3 text-left" onClick={() => {
      const range = slashRange.current ?? selection.current;
      const start = Math.min(range.start, value.length);
      const end = Math.min(range.end, value.length);
      onChange(value.slice(0, start) + option.ref + value.slice(end));
      selection.current = { start: start + option.ref.length, end: start + option.ref.length };
      slashRange.current = null;
      setOpen(false);
    }}><span><span className="block font-medium">{option.outputLabel}</span><span className="mt-1 block break-all font-mono text-xs text-muted-foreground">{option.ref}</span></span><span className="shrink-0 text-xs text-muted-foreground">{getValueTypeLabel(option.valueType)}</span></Button>)}</div></DialogContent></Dialog>
  </div>;
}
