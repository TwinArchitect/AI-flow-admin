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
import { DEFAULT_HTTP_CONFIG } from '../../config/nodeDefaults';
import type { HttpNodeConfig } from '../../types';
import { Field } from './shared/Field';
import { KeyValueRows } from './shared/KeyValueRows';

const HTTP_METHODS: HttpNodeConfig['method'][] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

export function HttpConfigPanel({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (config: Partial<HttpNodeConfig>) => void;
}) {
  const value = { ...DEFAULT_HTTP_CONFIG, ...(config as Partial<HttpNodeConfig>) };

  return (
    <div className="space-y-5">
      <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        发出 HTTP 请求以连接外部服务，例如联网搜索、业务接口查询或数据写入。
      </p>

      <Field label="API">
        <div className="grid grid-cols-[96px_1fr] gap-2">
          <Select
            value={value.method}
            onValueChange={(method) => onUpdate({ method: method as HttpNodeConfig['method'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HTTP_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={value.url}
            onChange={(event) => onUpdate({ url: event.target.value })}
            placeholder="https://api.example.com/data"
          />
        </div>
      </Field>

      <Field label="超时时长">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1000}
            max={60000}
            step={1000}
            value={value.timeout}
            onChange={(event) => onUpdate({ timeout: Number(event.target.value) })}
            className="w-32"
          />
          <span className="text-xs text-muted-foreground">毫秒</span>
        </div>
      </Field>

      <Tabs defaultValue="params" className="space-y-3">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="params">Params</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
        </TabsList>
        <TabsContent value="params">
          <KeyValueRows
            rows={value.params}
            keyPlaceholder="参数名"
            valuePlaceholder="参数值"
            onChange={(params) => onUpdate({ params })}
          />
        </TabsContent>
        <TabsContent value="headers">
          <KeyValueRows
            rows={value.headers}
            keyPlaceholder="Header"
            valuePlaceholder="Value"
            onChange={(headers) => onUpdate({ headers })}
          />
        </TabsContent>
        <TabsContent value="body">
          <Textarea
            value={value.body}
            onChange={(event) => onUpdate({ body: event.target.value })}
            placeholder={'{\n  "key": "value"\n}'}
            className="min-h-36 font-mono text-xs"
          />
        </TabsContent>
      </Tabs>

      <div className="space-y-4 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-foreground">报错捕获</Label>
          <Switch
            size="sm"
            checked={value.captureError}
            onCheckedChange={(captureError) => onUpdate({ captureError })}
          />
        </div>
        <Field label="输出字段">
          <Input
            value={value.outputField}
            onChange={(event) => onUpdate({ outputField: event.target.value })}
            placeholder="response"
          />
        </Field>
      </div>
    </div>
  );
}
