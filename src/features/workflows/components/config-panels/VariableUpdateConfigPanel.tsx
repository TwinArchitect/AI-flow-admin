import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createVariableUpdateItem,
  normalizeVariableUpdateConfig,
  VARIABLE_UPDATE_VALUE_TYPES,
} from '../../contracts/variableUpdateNodeContract';
import type {
  VariableUpdateItem,
  VariableUpdateNodeConfig,
  WorkflowVariableOption,
} from '../../types';
import { VariablePicker } from './shared/VariablePicker';

export function VariableUpdateConfigPanel({
  config,
  variables,
  onUpdate,
}: {
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<VariableUpdateNodeConfig>) => void;
}) {
  const value = normalizeVariableUpdateConfig(config);

  function updateItem(index: number, patch: Partial<VariableUpdateItem>) {
    onUpdate({
      updateList: value.updateList.map((item, current) => (
        current === index ? { ...item, ...patch } : item
      )),
    });
  }

  return (
    <div className="space-y-4">
      <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        更新全局变量或上游节点输出；下游节点继续使用原变量引用即可取得更新后的值。
      </p>

      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-foreground">更新规则</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">按配置顺序执行赋值</div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onUpdate({ updateList: [...value.updateList, createVariableUpdateItem()] })}
        >
          <Plus size={13} />
          添加更新项
        </Button>
      </div>

      {value.updateList.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
          暂无更新项
        </div>
      ) : value.updateList.map((item, index) => (
        <section key={item.id} className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">更新项 {index + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onUpdate({
                updateList: value.updateList.filter((_, current) => current !== index),
              })}
              aria-label={`删除更新项 ${index + 1}`}
            >
              <Trash2 size={13} />
            </Button>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-medium text-foreground">目标变量</div>
            <div className="flex items-center gap-2">
              <Input
                value={item.variableRef}
                readOnly
                placeholder="选择全局变量或上游输出"
                className="h-8 min-w-0 flex-1 font-mono text-xs"
              />
              <VariablePicker
                variables={variables}
                onSelect={(variableRef) => updateItem(index, { variableRef })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-foreground">赋值方式</div>
              <Select
                value={item.valueMode}
                onValueChange={(valueMode) => updateItem(index, {
                  valueMode: valueMode as VariableUpdateItem['valueMode'],
                  value: '',
                })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="input">固定值</SelectItem>
                  <SelectItem value="reference">引用变量</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-foreground">数据类型</div>
              <Select
                value={item.valueType}
                onValueChange={(valueType) => updateItem(index, {
                  valueType: valueType as VariableUpdateItem['valueType'],
                })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VARIABLE_UPDATE_VALUE_TYPES.map((valueType) => (
                    <SelectItem key={valueType} value={valueType}>{valueType}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-medium text-foreground">
              {item.valueMode === 'reference' ? '赋值变量' : '固定值'}
            </div>
            {item.valueMode === 'reference' ? (
              <div className="flex items-center gap-2">
                <Input
                  value={item.value}
                  readOnly
                  placeholder="选择上游变量"
                  className="h-8 min-w-0 flex-1 font-mono text-xs"
                />
                <VariablePicker
                  variables={variables}
                  onSelect={(variableRef) => updateItem(index, { value: variableRef })}
                />
              </div>
            ) : (
              <Input
                value={item.value}
                onChange={(event) => updateItem(index, { value: event.target.value })}
                placeholder="输入固定值"
                className="h-8 text-xs"
              />
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
