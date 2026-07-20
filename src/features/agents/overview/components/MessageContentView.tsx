/**
 * MessageContentView — 消息块渲染组件（简化版）
 *
 * 完整版 message-render 有注册渲染器机制，当前只保留页面所需的静态渲染：
 * - text → 纯文本
 * - markdown → 简单 inline markdown（处理粗体/换行）
 * - reasoning → 推理内容折叠框
 * - image → 图片展示
 *
 * 迁移映射：
 *   bg-slate-100 dark:bg-slate-800 → bg-accent
 *   text-slate-500 → text-muted-foreground
 *   text-brand-* → text-primary
 *   border-slate-200 → border-border
 */

import { useState } from 'react';
import { ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MessageBlock, MessageRole } from '@/types';

/** 简单的 markdown 内联渲染（只处理 **bold**、\n、链接） */
function SimpleMarkdown({ source }: { source: string }) {
  const parts = source.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\n)/g);
  return (
    <span className="leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a key={i} href={linkMatch[2]} className="text-primary hover:underline" target="_blank" rel="noreferrer">
              {linkMatch[1]}
            </a>
          );
        }
        if (part === '\n') return <br key={i} />;
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

/** 推理内容折叠框 */
function ReasoningBlock({ source }: { source: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Button
        variant="ghost"
        onClick={() => setOpen(!open)}
        className="w-full justify-start gap-2 px-3 py-2 text-xs font-bold text-muted-foreground rounded-none"
      >
        <Loader2 size={12} className="text-primary animate-spin shrink-0" />
        <span>推理过程</span>
        <ChevronDown size={12} className={cn('ml-auto transition-transform shrink-0', open && 'rotate-180')} />
      </Button>
      {open && (
        <div className="p-3 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap bg-background border-t border-border">
          {source}
        </div>
      )}
    </div>
  );
}

interface MessageContentViewProps {
  blocks: MessageBlock[];
  role: MessageRole;
  streaming?: boolean;
}

export function MessageContentView({ blocks, role, streaming }: MessageContentViewProps) {
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
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'text':
            return <span key={idx} className="text-sm leading-relaxed">{block.text}</span>;
          case 'markdown':
            return <SimpleMarkdown key={idx} source={block.source} />;
          case 'reasoning':
            return <ReasoningBlock key={idx} source={block.source} />;
          case 'image':
            return (
              <img
                key={idx}
                src={block.url}
                alt={block.alt ?? ''}
                className="max-w-full rounded-lg border border-border"
              />
            );
          case 'custom':
            return (
              <div key={idx} className="p-3 bg-accent rounded-lg text-xs text-muted-foreground border border-border">
                自定义内容: {block.kind}
              </div>
            );
          default:
            return null;
        }
      })}
      {streaming && <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5" />}
    </div>
  );
}
