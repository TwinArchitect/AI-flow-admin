import { useState } from 'react';
import { Brain, ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MessageBlock, MessageRole } from '@/types';
import { CustomMessageBlock } from './CustomMessageBlock';

function SimpleMarkdown({ source }: { source: string }) {
  const parts = source.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\n)/g);
  return (
    <span className="whitespace-pre-wrap leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a key={index} href={linkMatch[2]} className="text-primary hover:underline" target="_blank" rel="noreferrer">
              {linkMatch[1]}
            </a>
          );
        }
        if (part === '\n') return <br key={index} />;
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

function ReasoningBlock({ source, streaming }: { source: string; streaming?: boolean }) {
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? Boolean(streaming);
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Button
        variant="ghost"
        onClick={() => setManualOpen(!open)}
        className="w-full justify-start gap-2 rounded-none px-3 py-2 text-xs font-bold text-muted-foreground"
      >
        {streaming
          ? <Loader2 size={12} className="shrink-0 animate-spin text-primary" />
          : <Brain size={12} className="shrink-0 text-primary" />}
        <span>推理过程</span>
        <ChevronDown size={12} className={cn('ml-auto shrink-0 transition-transform', open && 'rotate-180')} />
      </Button>
      {open ? (
        <div className="whitespace-pre-wrap border-t border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
          {source}
        </div>
      ) : null}
    </div>
  );
}

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
    <div className={cn('space-y-2', role === 'user' && 'text-white')}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'text':
            return <span key={index} className="text-sm leading-relaxed">{block.text}</span>;
          case 'markdown':
            return <SimpleMarkdown key={index} source={block.source} />;
          case 'reasoning':
            return <ReasoningBlock key={index} source={block.source} streaming={streaming} />;
          case 'image':
            return <img key={index} src={block.url} alt={block.alt ?? ''} className="max-w-full rounded-lg border border-border" />;
          case 'custom':
            return (
              <CustomMessageBlock
                key={index}
                kind={block.kind}
                payload={block.payload}
                streaming={streaming}
                onSuggestedQuestionClick={onSuggestedQuestionClick}
              />
            );
          default:
            return null;
        }
      })}
      {streaming ? <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-primary/60" /> : null}
    </div>
  );
}
