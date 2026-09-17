import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageBlock, MessageRole } from '@/types';
import { getBlockRenderer } from './registry';
import { registerDefaultRenderers } from './registerDefaultRenderers';

registerDefaultRenderers();

export interface ConversationMessageContentProps {
  blocks: MessageBlock[];
  role: MessageRole;
  streaming?: boolean;
  onSuggestedQuestionClick?: (question: string) => void;
}

/** 运行对话与智能体助手共用的唯一消息正文渲染入口。 */
export function ConversationMessageContent({
  blocks,
  role,
  streaming,
  onSuggestedQuestionClick,
}: ConversationMessageContentProps) {
  if (!blocks.length && streaming) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Sparkles size={12} className="animate-pulse" />
        <span>思考中</span>
      </span>
    );
  }

  return (
    <div className={cn('min-w-0 w-full space-y-2', role === 'user' && 'text-white')}>
      {blocks.map((block, index) => {
        const renderer = getBlockRenderer(block);
        if (!renderer) return null;
        const Renderer = renderer.Component;
        return <Renderer key={`${block.type}-${index}`} block={block} ctx={{ role, streaming, onSuggestedQuestionClick }} />;
      })}
      {streaming ? <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-primary/60" /> : null}
    </div>
  );
}
