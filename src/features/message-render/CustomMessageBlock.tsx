import { DataTableMessageBlock } from './DataTableMessageBlock';
import { EChartsMessageBlock } from './EChartsMessageBlock';
import { ReferenceMessageBlock } from './ReferenceMessageBlock';
import { QuestionGuideMessageBlock } from './QuestionGuideMessageBlock';
import {
  DATA_TABLE_BLOCK_KIND,
  ECHARTS_BLOCK_KIND,
  QUESTION_GUIDE_BLOCK_KIND,
  REFERENCE_BLOCK_KIND,
} from './richContent';

export function CustomMessageBlock({
  kind,
  payload,
  streaming,
  onSuggestedQuestionClick,
}: {
  kind: string;
  payload: unknown;
  streaming?: boolean;
  onSuggestedQuestionClick?: (question: string) => void;
}) {
  if (kind === ECHARTS_BLOCK_KIND) return <EChartsMessageBlock payload={payload} />;
  if (kind === DATA_TABLE_BLOCK_KIND) return <DataTableMessageBlock payload={payload} />;
  if (kind === REFERENCE_BLOCK_KIND) return <ReferenceMessageBlock payload={payload} streaming={streaming} />;
  if (kind === QUESTION_GUIDE_BLOCK_KIND) {
    return (
      <QuestionGuideMessageBlock
        payload={payload}
        disabled={streaming || !onSuggestedQuestionClick}
        onQuestionClick={onSuggestedQuestionClick}
      />
    );
  }
  return (
    <div className="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
      暂不支持的内容类型：{kind}
    </div>
  );
}
