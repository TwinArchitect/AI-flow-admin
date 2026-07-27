import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ensureSystemStartVariables,
  normalizeStartConfig,
} from '../../contracts/startNodeContract';
import type { StartNodeConfig, StartVariable } from '../../types';
import { StartVariableDialog } from './StartVariableDialog';

export function StartConfigPanel({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (config: Partial<StartNodeConfig>) => void;
}) {
  const value = normalizeStartConfig(config);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [editingVariable, setEditingVariable] = useState<StartVariable>();
  const customVariables = value.variables.filter((variable) => !variable.system && variable.key !== 'files');

  function commitVariables(variables: StartVariable[]) {
    onUpdate({ variables: ensureSystemStartVariables(variables) });
  }

  function openAddDialog() {
    setDialogMode('add');
    setEditingVariable(undefined);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold text-foreground">自定义输入变量</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">用户问题由开始节点自动提供；附件在运行调试时按需上传，无需在这里预设。</p>
        </div>
        <Button variant="outline" size="sm" onClick={openAddDialog}><Plus size={13} />添加变量</Button>
      </div>

      <div className="space-y-2">
        {customVariables.length === 0 ? (
          <p className="border-y border-border py-4 text-center text-[10px] text-muted-foreground">暂无自定义输入变量</p>
        ) : customVariables.map((variable) => (
            <div key={variable.id} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-medium text-foreground">
                    {variable.description?.trim() || variable.label || variable.key}
                  </span>
                  <Badge variant="secondary" className="text-[9px]">{variable.valueType}</Badge>
                  <Badge variant="default" className="text-[9px]">全局</Badge>
                  {variable.required && <Badge variant="destructive" className="text-[9px]">必填</Badge>}
                </div>
                <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                  {`{{VARIABLE_NODE_ID.${variable.key}}}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setDialogMode('edit');
                    setEditingVariable(variable);
                    setDialogOpen(true);
                  }}
                  aria-label={`修改${variable.label}`}
                ><Pencil size={13} /></Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => commitVariables(value.variables.filter((item) => item.id !== variable.id))}
                  aria-label={`删除${variable.label}`}
                ><Trash2 size={13} /></Button>
              </div>
            </div>
          ))}
      </div>

      <div className="border-t border-border pt-4">
        <div className="mb-2 text-xs font-semibold text-foreground">固定输出</div>
        <Badge variant="outline" className="font-mono text-[10px]">userChatInput: string</Badge>
      </div>

      <StartVariableDialog
        open={dialogOpen}
        mode={dialogMode}
        variable={editingVariable}
        onOpenChange={setDialogOpen}
        onConfirm={(variable) => commitVariables(
          dialogMode === 'edit'
            ? value.variables.map((item) => item.id === variable.id ? variable : item)
            : [...value.variables, variable],
        )}
      />
    </div>
  );
}
