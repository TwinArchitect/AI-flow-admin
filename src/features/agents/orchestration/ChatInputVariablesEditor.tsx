import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StartVariableDialog } from '@/features/workflows/components/config-panels/StartVariableDialog';
import { ensureSystemStartVariables, isSystemStartVariable } from '@/features/workflows/contracts/startNodeContract';
import { getValueTypeLabel } from '@/features/workflows/utils/valueTypes';
import type { StartVariable } from '@/features/workflows/types';

export function ChatInputVariablesEditor({ variables, agentId, onChange }: {
  variables: StartVariable[]; agentId: string; onChange: (variables: StartVariable[]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StartVariable>();
  const normalized = ensureSystemStartVariables(variables);
  return <section className="space-y-3" aria-label="对话输入变量">
    <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-medium">输入变量</h3><p className="mt-1 text-xs text-muted-foreground">定义调用时可传入的参数；在人设中输入 / 或点击插入变量。</p></div><Button variant="outline" size="sm" onClick={() => { setEditing(undefined); setDialogOpen(true); }}><Plus size={14} />添加变量</Button></div>
    <div className="divide-y divide-border rounded-lg border border-border">
      {normalized.map((variable) => {
        const system = isSystemStartVariable(variable);
        return <div key={variable.id} className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-medium">{variable.description?.trim() || variable.label || variable.key}</span><Badge variant="secondary">{getValueTypeLabel(variable.valueType)}</Badge>{system ? <Badge variant="outline">系统</Badge> : variable.required ? <Badge variant="destructive">必填</Badge> : null}</div><p className="mt-1 truncate font-mono text-xs text-muted-foreground">{`{{VARIABLE_NODE_ID.${variable.key}}}`}</p></div>
          {!system && <><Button variant="ghost" size="icon-sm" aria-label={`修改输入变量${variable.label}`} onClick={() => { setEditing(variable); setDialogOpen(true); }}><Pencil size={14} /></Button><Button variant="ghost" size="icon-sm" aria-label={`删除输入变量${variable.label}`} onClick={() => onChange(normalized.filter((item) => item.id !== variable.id))}><Trash2 size={14} /></Button></>}
        </div>;
      })}
    </div>
    <StartVariableDialog open={dialogOpen} mode={editing ? 'edit' : 'add'} variable={editing} agentId={agentId} onOpenChange={setDialogOpen} onConfirm={(variable) => onChange(ensureSystemStartVariables(editing ? normalized.map((item) => item.id === editing.id ? variable : item) : [...normalized, variable]))} />
  </section>;
}
