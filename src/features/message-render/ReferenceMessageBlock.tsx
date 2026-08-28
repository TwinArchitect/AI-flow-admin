import { useEffect, useState } from 'react';
import { Download, FileText, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ReferenceBlockPayload } from './richContent';
import {
  normalizeKnowledgeReference,
  resolveKnowledgeImageUrl,
  type KnowledgeReferencePart,
  type KnowledgeReferenceSource,
} from './knowledgeReference';
import {
  downloadKnowledgeDocument,
  fetchKnowledgeDocumentPreview,
  fetchKnowledgeImage,
} from './knowledgeReferenceApi';

function KnowledgeImage({ url, className }: { url: string; className: string }) {
  const [src, setSrc] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;
    setSrc(undefined);
    setFailed(false);
    void fetchKnowledgeImage(url)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (failed) {
    return <div className={`${className} flex items-center justify-center bg-muted text-muted-foreground`}><ImageIcon size={18} /></div>;
  }
  if (!src) {
    return <div className={`${className} flex items-center justify-center bg-muted text-muted-foreground`}><Loader2 size={16} className="animate-spin" /></div>;
  }
  return <img src={src} alt="知识库召回图片" loading="lazy" className={className} />;
}

function extensionLabel(source: KnowledgeReferenceSource) {
  return (source.fileExtension || source.answerSource || source.docName.split('.').pop() || 'DOC')
    .replace(/^\./, '')
    .toUpperCase();
}

function ReferencePreviewDialog({
  source,
  part,
  onClose,
}: {
  source: KnowledgeReferenceSource;
  part?: KnowledgeReferencePart;
  onClose: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const partImageUrl = resolveKnowledgeImageUrl(part?.imageUrl, part?.imageId);

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    void fetchKnowledgeDocumentPreview(source)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : '文档预览失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-3 pr-8">
            <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
              {extensionLabel(source)}
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-sm">{source.docName}</DialogTitle>
              {part?.pageStart ? <p className="mt-1 text-xs text-muted-foreground">第 {part.pageStart} 页附近</p> : null}
            </div>
            <Button variant="outline" size="sm" onClick={() => void downloadKnowledgeDocument(source)}>
              <Download size={14} />下载原文
            </Button>
          </div>
        </DialogHeader>
        {part?.content || partImageUrl ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
            {partImageUrl ? <KnowledgeImage url={partImageUrl} className="max-h-48 w-full rounded-md object-contain" /> : null}
            {part?.content ? <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{part.content}</p> : null}
          </div>
        ) : null}
        <div className="min-h-80 flex-1 overflow-hidden rounded-lg border border-border bg-muted/30">
          {loading ? (
            <div className="flex h-full min-h-80 items-center justify-center text-muted-foreground"><Loader2 className="animate-spin" /></div>
          ) : error ? (
            <div className="flex h-full min-h-80 items-center justify-center px-6 text-center text-sm text-muted-foreground">{error}</div>
          ) : previewUrl ? (
            <iframe title={source.docName} src={`${previewUrl}${part?.pageStart ? `#page=${part.pageStart}` : ''}`} className="h-[52vh] w-full bg-background" />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReferenceMessageBlock({ payload, streaming }: { payload: unknown; streaming?: boolean }) {
  const rawData = (payload as ReferenceBlockPayload | null)?.data;
  const data = normalizeKnowledgeReference(rawData);
  const [selected, setSelected] = useState<{ source: KnowledgeReferenceSource; part?: KnowledgeReferencePart }>();
  const [lightboxUrl, setLightboxUrl] = useState<string>();
  if (streaming || !data?.sources.length) return null;

  return (
    <>
      {data.imageUrls.length ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {data.imageUrls.map((url) => (
            <button key={url} type="button" onClick={() => setLightboxUrl(url)} className="overflow-hidden rounded-lg border border-border hover:border-primary/40" title="查看大图">
              <KnowledgeImage url={url} className="size-28 object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
          <FileText size={14} />引用文献
        </div>
        <div className="space-y-2">
          {data.sources.map((source) => (
            <div key={`${source.datasetId}-${source.docId}`} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">{extensionLabel(source)}</span>
              <button type="button" onClick={() => setSelected({ source })} className="min-w-0 flex-1 truncate text-left text-xs font-medium text-foreground hover:text-primary" title={`查看原文件：${source.docName}`}>
                {source.docName}
              </button>
              <div className="flex shrink-0 gap-1">
                {source.parts.map((part, index) => (
                  <button key={part.id} type="button" onClick={() => setSelected({ source, part })} className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary hover:bg-primary/20" title={`查看分块 ${index + 1}`}>
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected ? <ReferencePreviewDialog source={selected.source} part={selected.part} onClose={() => setSelected(undefined)} /> : null}
      <Dialog open={Boolean(lightboxUrl)} onOpenChange={(open) => !open && setLightboxUrl(undefined)}>
        <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none">
          {lightboxUrl ? <KnowledgeImage url={lightboxUrl} className="max-h-[85vh] w-full rounded-xl bg-background object-contain" /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
