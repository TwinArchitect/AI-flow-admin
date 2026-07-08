import { Braces, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WorkflowVariableOption } from '../../../types';

interface VariablePickerProps {
  variables: WorkflowVariableOption[];
  onSelect: (ref: string) => void;
}

export function VariablePicker({ variables, onSelect }: VariablePickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Braces size={13} />
          插入变量
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground">上游可用变量</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {variables.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">暂无可用变量，请先连接上游节点</div>
        ) : (
          variables.map((variable) => (
            <DropdownMenuItem
              key={variable.ref}
              className="flex cursor-pointer items-start gap-2 py-2"
              onClick={() => onSelect(variable.ref)}
            >
              <Plus className="mt-0.5 size-3.5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-xs font-medium text-foreground">
                    {variable.nodeLabel} / {variable.outputLabel}
                  </span>
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {variable.nodeId}
                  </span>
                </div>
                <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                  {variable.ref}
                </div>
              </div>
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {variable.valueType}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
