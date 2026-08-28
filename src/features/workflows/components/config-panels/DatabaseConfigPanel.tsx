import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  DATABASE_NODE_OUTPUTS,
  DATABASE_TIMEOUT_MAX,
  DATABASE_TIMEOUT_MIN,
  DATABASE_TYPE_OPTIONS,
  normalizeDatabaseConfig,
} from '../../contracts/databaseNodeContract';
import type { DatabaseNodeConfig, DatabaseType, WorkflowVariableOption } from '../../types';
import { buildErrorCatchHandle } from '../../utils/edgeHandles';
import { Field } from './shared/Field';
import { VariablePicker } from './shared/VariablePicker';

export function DatabaseConfigPanel({
  nodeId,
  config,
  variables,
  onUpdate,
  onRemoveSourceHandle,
}: {
  nodeId: string;
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<DatabaseNodeConfig>) => void;
  onRemoveSourceHandle: (handleId: string) => void;
}) {
  const value = normalizeDatabaseConfig(config);
  const updateSql = (patch: Partial<DatabaseNodeConfig['sql']>) => {
    onUpdate({ sql: { ...value.sql, ...patch } });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="text-xs font-semibold text-foreground">连接配置</div>
        <Field label="数据库类型">
          <Select
            value={value.dbType}
            onValueChange={(dbType) => onUpdate({ dbType: dbType as DatabaseType })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DATABASE_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="数据库名称">
          <Input
            value={value.databaseName}
            onChange={(event) => onUpdate({ databaseName: event.target.value })}
            placeholder="例如：agent_db"
          />
        </Field>
        <Field label="地址">
          <Input
            value={value.host}
            onChange={(event) => onUpdate({ host: event.target.value })}
            placeholder="127.0.0.1:3306"
          />
          <p className="text-[10px] text-muted-foreground">主机与端口，例如 127.0.0.1:3306</p>
        </Field>
        <Field label="用户名">
          <Input
            value={value.username}
            onChange={(event) => onUpdate({ username: event.target.value })}
            placeholder="数据库用户名"
            autoComplete="off"
          />
        </Field>
        <Field label="密码">
          <Input
            type="password"
            value={value.password}
            onChange={(event) => onUpdate({ password: event.target.value })}
            placeholder="数据库密码"
            autoComplete="new-password"
          />
        </Field>
        <Field label="连接超时">
          <div className="relative">
            <Input
              type="number"
              min={DATABASE_TIMEOUT_MIN}
              max={DATABASE_TIMEOUT_MAX}
              value={value.connectTimeout}
              onChange={(event) => onUpdate({ connectTimeout: Number(event.target.value) })}
              className="pr-10"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">秒</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            范围 {DATABASE_TIMEOUT_MIN}–{DATABASE_TIMEOUT_MAX} 秒
          </p>
        </Field>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <div className="text-xs font-semibold text-foreground">SQL 语句</div>
        <Field label="输入方式">
          <Select
            value={value.sql.valueMode}
            onValueChange={(valueMode: 'input' | 'reference') => updateSql({ valueMode, value: '' })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="input">固定 SQL</SelectItem>
              <SelectItem value="reference">引用上游变量</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="SQL">
          {value.sql.valueMode === 'reference' && (
            <div className="mb-2 flex justify-end">
              <VariablePicker variables={variables} onSelect={(ref) => updateSql({ value: ref })} />
            </div>
          )}
          <Textarea
            value={value.sql.value}
            onChange={(event) => updateSql({ value: event.target.value })}
            placeholder={value.sql.valueMode === 'reference' ? '选择上游字符串变量' : 'SELECT * FROM users WHERE id = 1'}
            className="min-h-28 font-mono text-xs"
          />
        </Field>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
          <div>
            <p className="text-xs font-medium text-foreground">启用异常分支</p>
            <p className="text-[10px] text-muted-foreground">查询失败后通过异常分支继续执行</p>
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

      <section className="space-y-2 border-t border-border pt-5">
        <div className="text-xs font-semibold text-foreground">系统输出</div>
        <div className="flex flex-wrap gap-2">
          {DATABASE_NODE_OUTPUTS.map((output) => (
            <Badge key={output.key} variant="outline" className="font-mono text-[10px]">
              {output.key}: {output.valueType}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
