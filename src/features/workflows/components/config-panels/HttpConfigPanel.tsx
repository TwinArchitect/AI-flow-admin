import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  HTTP_TIMEOUT_MAX,
  HTTP_TIMEOUT_MIN,
  normalizeHttpConfig,
} from '../../contracts/httpNodeContract';
import type {
  HttpNodeConfig,
  HttpInputVariable,
  HttpOutputExtract,
  WorkflowOutputSchema,
  WorkflowVariableOption,
} from '../../types';
import { buildErrorCatchHandle } from '../../utils/edgeHandles';
import { Field } from './shared/Field';
import { KeyValueRows } from './shared/KeyValueRows';
import { VariablePicker } from './shared/VariablePicker';

const HTTP_METHODS: HttpNodeConfig['method'][] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const OUTPUT_TYPES: WorkflowOutputSchema['valueType'][] = [
  'string', 'number', 'boolean', 'object', 'arrayString', 'arrayNumber',
  'arrayBoolean', 'arrayObject', 'arrayAny', 'any',
];

function createOutput(): HttpOutputExtract {
  return {
    id: `http-output-${Date.now()}`,
    key: '',
    jsonPath: '',
    valueType: 'any',
  };
}

function createInputVariable(): HttpInputVariable {
  return {
    id: `http-input-${Date.now()}`,
    key: '',
    label: '',
    value: '',
    required: false,
    valueType: 'string',
  };
}

export function HttpConfigPanel({
  nodeId,
  config,
  variables,
  onUpdate,
  onRemoveSourceHandle,
}: {
  nodeId: string;
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<HttpNodeConfig>) => void;
  onRemoveSourceHandle: (handleId: string) => void;
}) {
  const value = normalizeHttpConfig(config);

  function updateOutput(index: number, patch: Partial<HttpOutputExtract>) {
    onUpdate({
      outputExtracts: value.outputExtracts.map((output, outputIndex) =>
        outputIndex === index ? { ...output, ...patch } : output,
      ),
    });
  }

  function updateInputVariable(index: number, patch: Partial<HttpInputVariable>) {
    onUpdate({
      inputVariables: value.inputVariables.map((input, inputIndex) =>
        inputIndex === index ? { ...input, ...patch } : input,
      ),
    });
  }

  return (
    <div className="space-y-5">
      <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        发出真实 HTTP 请求。请求参数支持引用上游节点输出，响应可通过 JSONPath 提取为下游变量。
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-foreground">自定义输入变量</div>
            <p className="text-[10px] text-muted-foreground">将上游输出映射为 HTTP 模块输入</p>
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
            暂无自定义输入变量
          </div>
        )}
        {value.inputVariables.map((input, index) => (
          <div key={input.id} className="space-y-2 border-b border-border pb-3 last:border-b-0">
            <div className="grid grid-cols-[1fr_100px_28px] gap-2">
              <Input
                value={input.key}
                onChange={(event) => updateInputVariable(index, {
                  key: event.target.value,
                  label: event.target.value,
                })}
                placeholder="变量名，例如 q"
                className="h-8 font-mono text-xs"
              />
              <Select
                value={input.valueType}
                onValueChange={(valueType) => updateInputVariable(index, {
                  valueType: valueType as HttpInputVariable['valueType'],
                })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OUTPUT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onUpdate({
                  inputVariables: value.inputVariables.filter((_, inputIndex) => inputIndex !== index),
                })}
                aria-label="删除输入变量"
              >
                <Trash2 size={13} />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={input.value}
                onChange={(event) => updateInputVariable(index, { value: event.target.value })}
                placeholder="{{start.userChatInput}}"
                className="h-8 flex-1 font-mono text-xs"
              />
              <VariablePicker
                variables={variables}
                onSelect={(ref) => updateInputVariable(index, { value: ref })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">运行时必填</Label>
              <Switch
                size="sm"
                checked={input.required}
                onCheckedChange={(required) => updateInputVariable(index, { required })}
              />
            </div>
          </div>
        ))}
      </div>

      <Field
        label={
          <div className="flex items-center justify-between gap-2">
            <span>请求地址</span>
            <VariablePicker
              variables={variables}
              onSelect={(ref) => onUpdate({ url: `${value.url}${ref}` })}
            />
          </div>
        }
      >
        <div className="grid grid-cols-[96px_1fr] gap-2">
          <Select
            value={value.method}
            onValueChange={(method) => onUpdate({ method: method as HttpNodeConfig['method'] })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {HTTP_METHODS.map((method) => (
                <SelectItem key={method} value={method}>{method}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={value.url}
            onChange={(event) => onUpdate({ url: event.target.value })}
            placeholder="https://api.example.com/data"
            className="font-mono text-xs"
          />
        </div>
      </Field>

      <Field label={`超时时长（${HTTP_TIMEOUT_MIN}-${HTTP_TIMEOUT_MAX} 秒）`}>
        <Input
          type="number"
          min={HTTP_TIMEOUT_MIN}
          max={HTTP_TIMEOUT_MAX}
          value={value.timeout}
          onChange={(event) => onUpdate({ timeout: Number(event.target.value) })}
        />
      </Field>

      <Tabs defaultValue="params" className="space-y-3">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="params">Params</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
        </TabsList>
        <TabsContent value="params">
          <KeyValueRows
            rows={value.params}
            variables={variables}
            keyPlaceholder="参数名"
            valuePlaceholder="参数值"
            onChange={(params) => onUpdate({ params })}
          />
        </TabsContent>
        <TabsContent value="headers">
          <KeyValueRows
            rows={value.headers}
            variables={variables}
            keyPlaceholder="Header"
            valuePlaceholder="Value"
            onChange={(headers) => onUpdate({ headers })}
          />
        </TabsContent>
        <TabsContent value="body" className="space-y-3">
          <Select
            value={value.contentType}
            onValueChange={(contentType) =>
              onUpdate({ contentType: contentType as HttpNodeConfig['contentType'] })
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="form">表单（x-www-form-urlencoded）</SelectItem>
              <SelectItem value="none">无 Body</SelectItem>
            </SelectContent>
          </Select>
          {value.contentType === 'json' && (
            <div className="space-y-2">
              <div className="flex justify-end">
                <VariablePicker
                  variables={variables}
                  onSelect={(ref) => onUpdate({ jsonBody: `${value.jsonBody}${ref}` })}
                />
              </div>
              <Textarea
                value={value.jsonBody}
                onChange={(event) => onUpdate({ jsonBody: event.target.value })}
                placeholder={'{\n  "key": "{{start.userChatInput}}"\n}'}
                className="min-h-36 font-mono text-xs"
              />
            </div>
          )}
          {value.contentType === 'form' && (
            <KeyValueRows
              rows={value.formBody}
              variables={variables}
              keyPlaceholder="字段名"
              valuePlaceholder="字段值"
              onChange={(formBody) => onUpdate({ formBody })}
            />
          )}
          {value.contentType === 'none' && (
            <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
              当前请求不携带 Body
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs text-foreground">错误捕获</Label>
            <p className="text-[10px] text-muted-foreground">保留 error 输出供后续节点处理</p>
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
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-foreground">输出字段提取</div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onUpdate({ outputExtracts: [...value.outputExtracts, createOutput()] })}
          >
            <Plus size={13} />
            添加字段
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">httpRawResponse: any</Badge>
          <Badge variant="outline" className="font-mono text-[10px]">error: string</Badge>
        </div>
        {value.outputExtracts.map((output, index) => (
          <div key={output.id} className="grid grid-cols-[1fr_1fr_92px_28px] gap-2">
            <Input
              value={output.key}
              onChange={(event) => updateOutput(index, { key: event.target.value })}
              placeholder="字段名"
              className="h-8 text-xs"
            />
            <Input
              value={output.jsonPath}
              onChange={(event) => updateOutput(index, { jsonPath: event.target.value })}
              placeholder="choices[0].message.content"
              className="h-8 font-mono text-xs"
            />
            <Select
              value={output.valueType}
              onValueChange={(valueType) =>
                updateOutput(index, { valueType: valueType as HttpOutputExtract['valueType'] })
              }
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {OUTPUT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onUpdate({
                outputExtracts: value.outputExtracts.filter((_, outputIndex) => outputIndex !== index),
              })}
              aria-label="删除输出字段"
            >
              <Trash2 size={13} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
