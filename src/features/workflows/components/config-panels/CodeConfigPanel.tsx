import { WORKFLOW_DATA_TYPES } from '../../utils/valueTypes';
import { getValueTypeLabel, getReferenceValueType } from '../../utils/valueTypes';
import { useState } from 'react';
import { BookOpen, HelpCircle, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VariableInput as Input } from './shared/VariableValueField';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CodeScriptEditor } from './CodeScriptEditor';
import {
  CODE_FIXED_OUTPUTS,
  DEFAULT_CODE,
  DEFAULT_PYTHON_CODE,
  normalizeCodeConfig,
} from '../../contracts/codeNodeContract';
import type {
  CodeInputVariable,
  CodeNodeConfig,
  CodeOutputVariable,
  WorkflowValueType,
  WorkflowVariableOption,
} from '../../types';
import { buildErrorCatchHandle } from '../../utils/edgeHandles';
import { normalizeCodeSource } from '../../utils/normalizeCodeSource';
import { CodeExamplesDialog } from './CodeExamplesDialog';
import { PromptOptimizeControl } from './shared/PromptOptimizeControl';
import { VariablePicker } from './shared/VariablePicker';

function createInputVariable(): CodeInputVariable {
  return {
    id: `code-input-${Date.now()}`,
    key: '',
    label: '',
    value: '',
    required: true,
    valueType: 'string',
  };
}

function createOutputVariable(): CodeOutputVariable {
  return {
    id: `code-output-${Date.now()}`,
    key: '',
    label: '',
    valueType: 'string',
  };
}

export function CodeConfigPanel({
  nodeId,
  agentId,
  config,
  variables,
  onUpdate,
  onRemoveSourceHandle,
}: {
  nodeId: string;
  agentId?: string;
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<CodeNodeConfig>) => void;
  onRemoveSourceHandle: (handleId: string) => void;
}) {
  const value = normalizeCodeConfig(config);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [pythonHelpOpen, setPythonHelpOpen] = useState(false);

  function updateInput(index: number, patch: Partial<CodeInputVariable>) {
    onUpdate({
      inputVariables: value.inputVariables.map((item, itemIndex) => (
        itemIndex === index ? { ...item, ...patch } : item
      )),
    });
  }

  function updateOutput(index: number, patch: Partial<CodeOutputVariable>) {
    onUpdate({
      outputVariables: value.outputVariables.map((item, itemIndex) => (
        itemIndex === index ? { ...item, ...patch } : item
      )),
    });
  }

  return (
    <div className="space-y-5">
      <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        {value.codeType === 'py' ? '在 Python 沙盒中执行 main 函数，输入变量按顺序传入函数参数。' : '在 Rhino JavaScript 沙盒中执行脚本，输入变量按顺序对应 arg0、arg1…。'}输出字段按相对 JSONPath 从返回结果提取。
      </p>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-foreground">输入变量</div>
            <p className="text-[10px] text-muted-foreground">作为代码执行参数传入</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onUpdate({ inputVariables: [...value.inputVariables, createInputVariable()] })}
          >
            <Plus size={13} />
            添加变量
          </Button>
        </div>
        {value.inputVariables.length === 0 && (
          <div className="rounded-md border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">
            暂无输入变量
          </div>
        )}
        {value.inputVariables.map((item, index) => (
          <div key={item.id} className="space-y-2 border-b border-border pb-3 last:border-b-0">
            <div className="grid grid-cols-[1fr_104px_28px] gap-2">
              <Input variables={variables}
                value={item.key}
                onChange={(event) => updateInput(index, {
                  key: event.target.value,
                  label: event.target.value,
                })}
                placeholder="变量名"
                className="h-8 font-mono text-xs"
              />
              <Select
                value={item.valueType}
                onValueChange={(valueType) => updateInput(index, {
                  valueType: valueType as WorkflowValueType,
                })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WORKFLOW_DATA_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{getValueTypeLabel(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onUpdate({
                  inputVariables: value.inputVariables.filter((_, itemIndex) => itemIndex !== index),
                })}
                aria-label="删除输入变量"
              >
                <Trash2 size={13} />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input variables={variables}
                value={item.value}
                onChange={(event) => updateInput(index, { value: event.target.value })}
                placeholder="固定值或引用上游变量"
                className="h-8 min-w-0 flex-1 font-mono text-xs"
              />
              <VariablePicker
                variables={variables}
                onSelect={(ref) => updateInput(index, { value: ref, valueType: getReferenceValueType(variables.find((variable) => variable.ref === ref)?.valueType ?? item.valueType) })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">运行时必填</Label>
              <Switch
                size="sm"
                checked={item.required}
                onCheckedChange={(required) => updateInput(index, { required })}
              />
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3 border-t border-border pt-4">
        <div className="text-xs font-semibold text-foreground">代码内容</div>
        <div className="flex items-center justify-between gap-2">
          <Select value={value.codeType} onValueChange={(language: CodeNodeConfig['codeType']) => {
            const isDefault = !value.code.trim() || [DEFAULT_CODE.trim(), DEFAULT_PYTHON_CODE.trim()].includes(value.code.trim());
            onUpdate({ codeType: language, ...(isDefault ? { code: language === 'py' ? DEFAULT_PYTHON_CODE : DEFAULT_CODE } : {}) });
          }}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="js">JavaScript</SelectItem><SelectItem value="py">Python</SelectItem></SelectContent>
          </Select>
          {value.codeType === 'py' && <Button type="button" variant="ghost" size="icon-sm" aria-label="可用 Python 包说明" aria-expanded={pythonHelpOpen} onClick={() => setPythonHelpOpen(open => !open)}><HelpCircle size={14} /></Button>}
          <Button type="button" variant="outline" size="sm" onClick={() => setExamplesOpen(true)}>
            <BookOpen size={13} />代码示例
          </Button>
        </div>
        {value.codeType === 'py' && pythonHelpOpen && (
          <div role="region" aria-label="Python 包与使用限制" className="space-y-2 rounded-md border border-border bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">可用 Python 包（实际以部署环境为准）</p>
            <p>文本与数据格式：json、re、string、csv、io、html、xml.etree.ElementTree</p>
            <p>计算、日期与集合：math、decimal、fractions、statistics、datetime、time、collections、itertools、functools、random</p>
            <p>编码与模板：base64、hashlib、hmac、uuid、jinja2</p>
            <p>默认未安装：numpy、pandas、openpyxl、Pillow、beautifulsoup4、PyYAML。</p>
            <p>httpx 可导入，但默认禁止网络请求；requests 虽已安装，默认环境导入受限。</p>
            <p>文件、网络和进程操作受限制，不支持脚本内在线安装依赖，需要额外库请联系管理员预装。</p>
          </div>
        )}
        <PromptOptimizeControl
          scene="code_optimize"
          content={value.code}
          agentId={agentId}
          codeLanguage={value.codeType}
          inputParams={value.inputVariables.map((item, index) => (
            `arg${index}（${item.key.trim() || `arg${index}`}）:${item.valueType}`
          )).join(', ') || undefined}
          outputHint={value.outputVariables.map((item) => (
            item.label.trim()
              ? `${item.key.trim() || 'result'}=${item.label.trim()}`
              : `${item.key.trim() || 'result'}:${item.valueType}`
          )).join(', ') || undefined}
          onApply={(code) => onUpdate({ code: normalizeCodeSource(code, value.codeType) })}
        >
          <div className="relative">
            <CodeScriptEditor language={value.codeType}
              agentId={agentId}
              inputParams={value.inputVariables.map((item, index) => `arg${index}（${item.key.trim() || `arg${index}`}）:${item.valueType}`).join(', ') || undefined}
              outputHint={value.outputVariables.map(item => item.label.trim() ? `${item.key.trim() || 'result'}=${item.label.trim()}` : `${item.key.trim() || 'result'}:${item.valueType}`).join(', ') || undefined}
              value={value.code}
              onChange={(code) => onUpdate({ code })}
            />
            <span className="pointer-events-none absolute bottom-2 left-3 text-[10px] tabular-nums text-muted-foreground">
              {value.code.length}
            </span>
          </div>
        </PromptOptimizeControl>
      </section>

      <section className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-foreground">输出变量</div>
            <p className="text-[10px] text-muted-foreground">字段名供下游引用，JSONPath 相对 return 结果且无需填写 $.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onUpdate({ outputVariables: [...value.outputVariables, createOutputVariable()] })}
          >
            <Plus size={13} />
            添加变量
          </Button>
        </div>
        {value.outputVariables.length === 0 && (
          <div className="rounded-md border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">
            暂无自定义输出变量
          </div>
        )}
        {value.outputVariables.map((item, index) => (
          <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_104px_28px] gap-2">
            <Input variables={variables}
              value={item.key}
              onChange={(event) => updateOutput(index, { key: event.target.value })}
              placeholder="字段名"
              className="h-8 font-mono text-xs"
            />
            <Input variables={variables}
              value={item.label}
              onChange={(event) => updateOutput(index, { label: event.target.value.replace(/^\$\.?/, '') })}
              placeholder="data.id 或 [0].scene"
              className="h-8 font-mono text-xs"
            />
            <Select
              value={item.valueType}
              onValueChange={(valueType) => updateOutput(index, {
                valueType: valueType as WorkflowValueType,
              })}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WORKFLOW_DATA_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{getValueTypeLabel(type)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onUpdate({
                outputVariables: value.outputVariables.filter((_, itemIndex) => itemIndex !== index),
              })}
              aria-label="删除输出变量"
            >
              <Trash2 size={13} />
            </Button>
          </div>
        ))}
      </section>

      <section className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
          <div>
            <Label className="text-xs text-foreground">启用异常分支</Label>
            <p className="text-[10px] text-muted-foreground">脚本失败后通过异常分支继续执行</p>
          </div>
          <Switch
            size="sm"
            checked={value.catchError}
            onCheckedChange={(catchError) => {
              if (!catchError) onRemoveSourceHandle(buildErrorCatchHandle(nodeId));
              onUpdate({ catchError });
            }}
          />
        </div>
      </section>

      <section className="space-y-2 border-t border-border pt-4">
        <div className="text-xs font-semibold text-foreground">系统输出</div>
        <div className="flex flex-wrap gap-2">
          {CODE_FIXED_OUTPUTS.map((output) => (
            <Badge key={output.key} variant="outline" className="font-mono text-[10px]">
              {output.key}: {output.valueType}
            </Badge>
          ))}
        </div>
      </section>

      <CodeExamplesDialog
        language={value.codeType}
        open={examplesOpen}
        onOpenChange={setExamplesOpen}
        onSelect={(code) => onUpdate({ code: normalizeCodeSource(code, value.codeType) })}
      />
    </div>
  );
}
