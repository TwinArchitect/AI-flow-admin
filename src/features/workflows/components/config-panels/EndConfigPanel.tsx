import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { normalizeEndConfig } from '../../contracts/endNodeContract';
import type { EndNodeConfig, WorkflowVariableOption } from '../../types';
import { VariablePicker } from './shared/VariablePicker';

export function EndConfigPanel({
  config,
  variables,
  onUpdate,
}: {
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<EndNodeConfig>) => void;
}) {
  const value = normalizeEndConfig(config);

  function updateOutputs(outputVariables: EndNodeConfig['outputVariables']) {
    onUpdate({ outputVariables });
  }

  function addOutput() {
    updateOutputs([
      ...value.outputVariables,
      { id: `end-var-${Date.now()}`, key: '', value: '' },
    ]);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold text-foreground">输出变量</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">将上游节点的结果组织为工作流最终输出。</p>
        </div>
        <Button variant="outline" size="sm" onClick={addOutput}><Plus size={13} />添加输出</Button>
      </div>

      {value.outputVariables.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">暂无输出变量</div>
      ) : (
        <div className="space-y-3">
          {value.outputVariables.map((output, index) => (
            <div key={output.id} className="space-y-2 rounded-md border border-border bg-background p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={output.key}
                  onChange={(event) => updateOutputs(value.outputVariables.map((item) =>
                    item.id === output.id ? { ...item, key: event.target.value } : item,
                  ))}
                  placeholder="输出变量名"
                  className="h-8 flex-1"
                />
                <VariablePicker
                  variables={variables}
                  onSelect={(ref) => updateOutputs(value.outputVariables.map((item) =>
                    item.id === output.id ? { ...item, value: ref } : item,
                  ))}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => updateOutputs(value.outputVariables.filter((item) => item.id !== output.id))}
                  aria-label={`删除输出变量${index + 1}`}
                ><Trash2 size={13} /></Button>
              </div>
              <Textarea
                value={output.value}
                onChange={(event) => updateOutputs(value.outputVariables.map((item) =>
                  item.id === output.id ? { ...item, value: event.target.value } : item,
                ))}
                placeholder="输入固定值或插入上游变量"
                className="min-h-20 font-mono text-xs"
              />
            </div>
          ))}
        </div>
      )}

      {value.outputVariables.length > 0 && (
        <div className="border-t border-border pt-4">
          <div className="mb-2 text-xs font-semibold text-foreground">最终输出</div>
          <div className="flex flex-wrap gap-2">
            {value.outputVariables.filter((output) => output.key.trim()).map((output) => (
              <Badge key={output.id} variant="outline" className="font-mono text-[10px]">{output.key}: string</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
