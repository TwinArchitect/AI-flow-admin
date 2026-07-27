import { Textarea } from '@/components/ui/textarea';
import {
  normalizeReplyConfig,
  REPLY_CONTENT_MAX_LENGTH,
} from '../../contracts/replyNodeContract';
import type { ReplyNodeConfig, WorkflowVariableOption } from '../../types';
import { Field } from './shared/Field';
import { VariablePicker } from './shared/VariablePicker';

export function ReplyConfigPanel({
  config,
  variables,
  onUpdate,
}: {
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<ReplyNodeConfig>) => void;
}) {
  const value = normalizeReplyConfig(config);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-xs font-semibold text-foreground">回复内容</h3>
        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
          直接向用户发送指定内容，可混合插入上游变量。
        </p>
      </div>
      <Field label="回复文本">
        <div className="mb-2 flex justify-end">
          <VariablePicker
            variables={variables}
            onSelect={(ref) => onUpdate({ content: `${value.content}${ref}` })}
          />
        </div>
        <Textarea
          value={value.content}
          maxLength={REPLY_CONTENT_MAX_LENGTH}
          onChange={(event) => onUpdate({ content: event.target.value })}
          placeholder="输入固定回复内容，或插入上游变量"
          className="min-h-40 font-mono text-xs"
        />
        <p className="text-right text-[10px] text-muted-foreground">
          {value.content.length}/{REPLY_CONTENT_MAX_LENGTH}
        </p>
      </Field>
      <p className="border-t border-border pt-4 text-[10px] leading-relaxed text-muted-foreground">
        该节点发送回复后继续执行下游节点，不提供可引用的业务输出。
      </p>
    </section>
  );
}
