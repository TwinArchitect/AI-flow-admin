import { ArrowRight, Lightbulb } from 'lucide-react';
import type { QuestionGuideBlockPayload } from './richContent';

function resolvePayload(value: unknown): QuestionGuideBlockPayload | null {
  if (!value || typeof value !== 'object') return null;
  const payload = value as Partial<QuestionGuideBlockPayload>;
  if (!Array.isArray(payload.questions) || !payload.questions.every((item) => typeof item === 'string')) {
    return null;
  }
  return { questions: payload.questions };
}

export function QuestionGuideMessageBlock({
  payload: rawPayload,
  disabled,
  onQuestionClick,
}: {
  payload: unknown;
  disabled?: boolean;
  onQuestionClick?: (question: string) => void;
}) {
  const payload = resolvePayload(rawPayload);
  if (!payload?.questions.length) return null;

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Lightbulb size={13} className="shrink-0 text-amber-500" />
        <span>猜你想问</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {payload.questions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onQuestionClick?.(question)}
            className="group flex w-full items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="min-w-0 flex-1 break-words leading-5">{question}</span>
            <ArrowRight size={12} className="shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}
