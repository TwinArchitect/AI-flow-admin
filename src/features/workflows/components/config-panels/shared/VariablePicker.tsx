import { getValueTypeLabel } from '../../../utils/valueTypes';
import { Braces, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WorkflowVariableOption } from '../../../types';

interface VariablePickerProps {
  variables: WorkflowVariableOption[];
  onSelect: (ref: string) => void;
  mode?: 'single' | 'multiple';
}

export function VariablePicker({ variables, onSelect, mode = 'single' }: VariablePickerProps) {
  const nodes = Array.from(
    variables.reduce((groups, variable) => {
      const group = groups.get(variable.nodeId);
      if (group) group.push(variable);
      else groups.set(variable.nodeId, [variable]);
      return groups;
    }, new Map<string, WorkflowVariableOption[]>()),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" title={mode === 'single' ? '每次选择一个变量，替换该字段的引用' : '可连续插入多个变量，与已有文本组合'}>
          <Braces size={13} />
          {mode === 'single' ? '单变量插入' : '多变量插入'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[520px] max-w-[calc(100vw-24px)] p-2"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">选择节点，再选择变量</DropdownMenuLabel>
        <div className="px-2 pb-1 text-[10px] text-muted-foreground">
          {mode === 'single' ? '选择一个变量作为字段值' : '每次选择一个，可多次插入并与文本组合'}
        </div>
        <DropdownMenuSeparator />
        {variables.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">暂无可用变量，请先连接上游节点</div>
        ) : (
          nodes.map(([nodeId, nodeVariables]) => (
            <DropdownMenuSub key={nodeId}>
              <DropdownMenuSubTrigger className="gap-3 px-3 py-3">
                <span className="min-w-0 flex-1 whitespace-normal break-words text-sm font-medium">
                  {nodeVariables[0].nodeLabel}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{nodeVariables.length} 个变量</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-[min(520px,var(--radix-dropdown-menu-content-available-height))] w-[520px] max-w-[calc(100vw-24px)] overflow-y-auto p-2">
                {nodeVariables.map((variable) => (
            <DropdownMenuItem
              key={variable.ref}
              textValue={`${variable.nodeLabel} - ${variable.outputLabel}`}
              className="flex cursor-pointer items-start gap-3 px-3 py-3"
              onClick={() => onSelect(variable.ref)}
            >
              <Plus className="mt-0.5 size-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="min-w-0">
                  <span className="whitespace-normal break-words text-sm font-medium text-foreground">
                    {variable.nodeLabel} - {variable.outputLabel}
                  </span>
                </div>
                <div className="mt-1 whitespace-normal break-all font-mono text-xs leading-relaxed text-muted-foreground">
                  {variable.ref}
                </div>
              </div>
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {getValueTypeLabel(variable.valueType)}
              </span>
            </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
