import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  normalizeReadFilesConfig,
  READ_FILES_NODE_OUTPUTS,
} from '../../contracts/readFilesNodeContract';
import type { ReadFilesNodeConfig, WorkflowVariableOption } from '../../types';
import { buildErrorCatchHandle } from '../../utils/edgeHandles';
import { Field } from './shared/Field';
import { VariablePicker } from './shared/VariablePicker';

export function ReadFilesConfigPanel({
  nodeId,
  config,
  variables,
  onUpdate,
  onRemoveSourceHandle,
}: {
  nodeId: string;
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<ReadFilesNodeConfig>) => void;
  onRemoveSourceHandle: (handleId: string) => void;
}) {
  const value = normalizeReadFilesConfig(config);
  const fileRef = value.filePathRefs[0] ?? '';
  const preferredVariables = variables.filter((variable) => (
    ['file', 'array', 'arrayString', 'arrayObject', 'any'].includes(variable.valueType)
      || /file|文件|附件/i.test(`${variable.outputKey}${variable.outputLabel}`)
  ));

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="text-xs font-semibold text-foreground">输入参数</div>
        <Field label="文件引用">
          <div className="flex items-center gap-2">
            <Input
              value={fileRef}
              readOnly
              placeholder="选择用户附件或上游文件变量"
              className="h-8 min-w-0 flex-1 font-mono text-xs"
            />
            <VariablePicker
              variables={preferredVariables.length ? preferredVariables : variables}
              onSelect={(ref) => onUpdate({ filePathRefs: [ref] })}
            />
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            调试运行时上传的附件通过全局变量 files 提供。
          </p>
        </Field>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <div className="text-xs font-semibold text-foreground">智能解析</div>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
          <div>
            <p className="text-xs font-medium text-foreground">开启智能解析</p>
            <p className="text-[10px] text-muted-foreground">对扫描版 PDF 或图片尝试 OCR</p>
          </div>
          <Switch
            size="sm"
            checked={value.smartParse}
            onCheckedChange={(smartParse) => onUpdate({ smartParse })}
          />
        </div>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <div className="text-xs font-semibold text-foreground">异常处理</div>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
          <div>
            <p className="text-xs font-medium text-foreground">启用异常分支</p>
            <p className="text-[10px] text-muted-foreground">解析失败后通过异常分支继续执行</p>
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
          {READ_FILES_NODE_OUTPUTS.map((output) => (
            <Badge key={output.key} variant="outline" className="font-mono text-[10px]">
              {output.key}: {output.valueType}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
