import DOMPurify from 'dompurify';
import { Brain, ChevronDown, Download, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { MessageBlock } from '@/types';
import type { BlockRendererProps } from './registry';
import { MarkdownMessageView } from './MarkdownMessageView';
import { CustomMessageBlock } from './CustomMessageBlock';

type TextBlock = Extract<MessageBlock, { type: 'text' }>;
type MarkdownBlock = Extract<MessageBlock, { type: 'markdown' }>;
type ReasoningBlock = Extract<MessageBlock, { type: 'reasoning' }>;
type HtmlBlock = Extract<MessageBlock, { type: 'html' }>;
type ImageBlock = Extract<MessageBlock, { type: 'image' }>;
type CustomBlock = Extract<MessageBlock, { type: 'custom' }>;

interface AttachmentPayload {
  fileId: string;
  fileName: string;
  variant?: 'image' | 'file';
  previewUrl?: string;
  downloadUrl?: string;
}

export function TextBlockRenderer({ block }: BlockRendererProps<TextBlock>) {
  return <p className="whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">{block.text}</p>;
}

export function MarkdownBlockRenderer({ block, ctx }: BlockRendererProps<MarkdownBlock>) {
  return <MarkdownMessageView content={block.source} streaming={ctx.streaming} />;
}

export function ReasoningBlockRenderer({ block, ctx }: BlockRendererProps<ReasoningBlock>) {
  if (!block.source.trim()) return null;
  return (
    <details open={ctx.streaming ? true : undefined} className="group w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-primary/20 bg-primary/5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-primary">
          <Brain size={13} className="shrink-0" />推理过程
          {ctx.streaming ? <span className="animate-pulse font-normal text-muted-foreground">生成中…</span> : null}
        </span>
        <ChevronDown size={14} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="min-w-0 max-w-full overflow-x-auto border-t border-primary/10 px-3 pb-3 pt-2">
        <MarkdownMessageView content={block.source} streaming={ctx.streaming} className="text-xs text-muted-foreground" />
      </div>
    </details>
  );
}

export function HtmlBlockRenderer({ block }: BlockRendererProps<HtmlBlock>) {
  const safeHtml = useMemo(() => DOMPurify.sanitize(block.html), [block.html]);
  if (!safeHtml.trim()) return null;
  return <div className="min-w-0 max-w-full break-words text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_pre]:overflow-x-auto" dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}

export function ImageBlockRenderer({ block }: BlockRendererProps<ImageBlock>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="block max-w-full cursor-zoom-in" onClick={() => setOpen(true)}>
        <img src={block.url} alt={block.alt ?? '图片'} className="max-h-80 max-w-full rounded-lg border border-border object-contain" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[88vh] max-w-[92vw] items-center justify-center overflow-hidden p-4 sm:max-w-[92vw]">
          <DialogTitle className="sr-only">{block.alt ?? '图片预览'}</DialogTitle>
          <img src={block.url} alt={block.alt ?? '图片'} className="max-h-full max-w-full object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}

function attachmentDownloadUrl(payload: AttachmentPayload) {
  return payload.downloadUrl ?? `/gpt/file/download?id=${encodeURIComponent(payload.fileId)}`;
}

export function AttachmentBlockRenderer({ block, ctx }: BlockRendererProps<CustomBlock>) {
  const payload = block.payload as AttachmentPayload;
  const [open, setOpen] = useState(false);
  const image = payload.variant === 'image' && payload.previewUrl;
  if (!payload?.fileId || !payload.fileName) return <CustomBlockFallback block={block} ctx={ctx} />;
  if (image) {
    return (
      <>
        <button type="button" className="block max-w-full cursor-zoom-in" onClick={() => setOpen(true)}>
          <img src={payload.previewUrl} alt={payload.fileName} className="max-h-48 max-w-full rounded-lg border border-border object-contain" />
        </button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="flex h-[88vh] max-w-[92vw] items-center justify-center overflow-hidden p-4 sm:max-w-[92vw]">
            <DialogTitle className="sr-only">{payload.fileName}</DialogTitle>
            <img src={payload.previewUrl} alt={payload.fileName} className="max-h-full max-w-full object-contain" />
          </DialogContent>
        </Dialog>
      </>
    );
  }
  return (
    <a href={attachmentDownloadUrl(payload)} download={payload.fileName} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-muted/70">
      <FileText size={14} className="shrink-0" /><span className="max-w-52 truncate">{payload.fileName}</span><Download size={12} className="shrink-0 text-muted-foreground" />
    </a>
  );
}

export function KnownCustomBlockRenderer({ block, ctx }: BlockRendererProps<CustomBlock>) {
  return <CustomMessageBlock kind={block.kind} payload={block.payload} streaming={ctx.streaming} onSuggestedQuestionClick={ctx.onSuggestedQuestionClick} />;
}

export function CustomBlockFallback({ block }: BlockRendererProps<CustomBlock>) {
  return <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted p-3 text-xs text-muted-foreground">{`[${block.kind}] ${JSON.stringify(block.payload, null, 2)}`}</pre>;
}
