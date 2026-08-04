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
  CONDITION_OPERATOR_OPTIONS,
  conditionOperatorNeedsValue,
  createConditionBranch,
  createConditionRule,
  normalizeConditionConfig,
} from '../../contracts/conditionNodeContract';
import type {
  ConditionBranchLogic,
  ConditionNodeConfig,
  ConditionOperator,
  ConditionRule,
  WorkflowVariableOption,
} from '../../types';
import {
  buildConditionSourceHandle,
  getConditionBranchLabel,
} from '../../utils/edgeHandles';
import { VariablePicker } from './shared/VariablePicker';

export function ConditionConfigPanel({
  nodeId,
  config,
  variables,
  onUpdate,
  onRemoveSourceHandle,
}: {
  nodeId: string;
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<ConditionNodeConfig>) => void;
  onRemoveSourceHandle: (handleId: string) => void;
}) {
  const value = normalizeConditionConfig(config);

  function updateRule(branchIndex: number, ruleIndex: number, patch: Partial<ConditionRule>) {
    onUpdate({
      branches: value.branches.map((branch, currentBranchIndex) => (
        currentBranchIndex === branchIndex
          ? {
              ...branch,
              rules: branch.rules.map((rule, currentRuleIndex) => (
                currentRuleIndex === ruleIndex ? { ...rule, ...patch } : rule
              )),
            }
          : branch
      )),
    });
  }

  function removeBranch(branchIndex: number) {
    for (let index = branchIndex; index < value.branches.length; index += 1) {
      onRemoveSourceHandle(buildConditionSourceHandle(nodeId, index));
    }
    onUpdate({ branches: value.branches.filter((_, index) => index !== branchIndex) });
  }

  return (
    <div className="space-y-4">
      <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        从上到下判断，命中首个条件分支后执行对应连线；全部未命中时进入 ELSE。
      </p>

      {value.branches.map((branch, branchIndex) => (
        <section key={branch.id} className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-foreground">
              {getConditionBranchLabel(branchIndex)}
            </div>
            <div className="flex items-center gap-1.5">
              <Select
                value={branch.condition}
                onValueChange={(condition) => onUpdate({
                  branches: value.branches.map((item, index) => (
                    index === branchIndex
                      ? { ...item, condition: condition as ConditionBranchLogic }
                      : item
                  )),
                })}
              >
                <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">全部满足</SelectItem>
                  <SelectItem value="OR">任一满足</SelectItem>
                </SelectContent>
              </Select>
              {value.branches.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeBranch(branchIndex)}
                  aria-label={`删除 ${getConditionBranchLabel(branchIndex)} 分支`}
                >
                  <Trash2 size={13} />
                </Button>
              )}
            </div>
          </div>

          {branch.rules.map((rule, ruleIndex) => {
            const needsValue = conditionOperatorNeedsValue(rule.condition);
            return (
              <div key={rule.id} className="space-y-2 rounded-md bg-muted/50 p-2.5">
                <div className="flex items-center gap-2">
                  <Input
                    value={rule.variableRef}
                    readOnly
                    placeholder="选择上游变量"
                    className="h-8 min-w-0 flex-1 font-mono text-xs"
                  />
                  <VariablePicker
                    variables={variables}
                    onSelect={(variableRef) => updateRule(branchIndex, ruleIndex, { variableRef })}
                  />
                  {branch.rules.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onUpdate({
                        branches: value.branches.map((item, index) => (
                          index === branchIndex
                            ? { ...item, rules: item.rules.filter((_, current) => current !== ruleIndex) }
                            : item
                        )),
                      })}
                      aria-label="删除条件"
                    >
                      <Trash2 size={13} />
                    </Button>
                  )}
                </div>

                <Select
                  value={rule.condition}
                  onValueChange={(condition) => updateRule(branchIndex, ruleIndex, {
                    condition: condition as ConditionOperator,
                  })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPERATOR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {needsValue && (
                  <div className="space-y-2">
                    <Select
                      value={rule.valueMode}
                      onValueChange={(valueMode) => updateRule(branchIndex, ruleIndex, {
                        valueMode: valueMode as ConditionRule['valueMode'],
                        value: '',
                      })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="input">固定值</SelectItem>
                        <SelectItem value="reference">上游变量</SelectItem>
                      </SelectContent>
                    </Select>
                    {rule.valueMode === 'reference' ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={rule.value}
                          readOnly
                          placeholder="选择比较变量"
                          className="h-8 min-w-0 flex-1 font-mono text-xs"
                        />
                        <VariablePicker
                          variables={variables}
                          onSelect={(comparisonRef) => updateRule(branchIndex, ruleIndex, {
                            value: comparisonRef,
                          })}
                        />
                      </div>
                    ) : (
                      <Input
                        value={rule.value}
                        onChange={(event) => updateRule(branchIndex, ruleIndex, {
                          value: event.target.value,
                        })}
                        placeholder="输入比较值"
                        className="h-8 text-xs"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onUpdate({
              branches: value.branches.map((item, index) => (
                index === branchIndex
                  ? { ...item, rules: [...item.rules, createConditionRule()] }
                  : item
              )),
            })}
          >
            <Plus size={13} />
            添加条件
          </Button>
        </section>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => onUpdate({ branches: [...value.branches, createConditionBranch()] })}
      >
        <Plus size={13} />
        添加 ELSE IF
      </Button>

      <div className="rounded-lg border border-dashed border-border px-3 py-3">
        <div className="text-xs font-semibold text-foreground">ELSE</div>
        <p className="mt-1 text-[10px] text-muted-foreground">未命中以上任何条件时执行</p>
      </div>
    </div>
  );
}
