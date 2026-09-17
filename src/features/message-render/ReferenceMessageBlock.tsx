import { useEffect, useMemo, useState } from 'react';
import { FileText, ImageIcon, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DocPreviewModal } from '@/features/agents/knowledgeBase/components/DocPreviewModal';
import type { ReferenceBlockPayload, ReferenceImagesBlockPayload } from './richContent';
import {
  normalizeKnowledgeReference,
  type KnowledgeReferencePart,
  type KnowledgeReferenceSource,
} from './knowledgeReference';
import { fetchKnowledgeImage } from './knowledgeReferenceApi';

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

export function ReferenceMessageBlock({ payload, streaming }: { payload: unknown; streaming?: boolean }) {
  const typedPayload = payload as ReferenceBlockPayload | null;
  const rawData = typedPayload?.data;
  const data = normalizeKnowledgeReference(rawData);
  const [selected, setSelected] = useState<{ source: KnowledgeReferenceSource; part?: KnowledgeReferencePart }>();
  const [lightboxUrl, setLightboxUrl] = useState<string>();
  const previewFile = useMemo(() => selected ? {
    id: selected.source.docId,
    name: selected.source.docName,
    parser: selected.source.fileExtension || selected.source.answerSource || '',
    initialPage: selected.part?.pageStart,
  } : null, [selected]);
  if (streaming || !data?.sources.length) return null;

  return (
    <>
      {!typedPayload?.suppressImages && data.imageUrls.length ? (
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
      <DocPreviewModal
        open={Boolean(selected)}
        file={previewFile}
        datasetId={selected?.source.datasetId}
        onClose={() => setSelected(undefined)}
      />
      <Dialog open={Boolean(lightboxUrl)} onOpenChange={(open) => !open && setLightboxUrl(undefined)}>
        <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none">
          {lightboxUrl ? <KnowledgeImage url={lightboxUrl} className="max-h-[85vh] w-full rounded-xl bg-background object-contain" /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ReferenceImagesMessageBlock({ payload, streaming }: { payload: unknown; streaming?: boolean }) {
  const imageUrls = (payload as ReferenceImagesBlockPayload | null)?.imageUrls ?? [];
  const [lightboxUrl, setLightboxUrl] = useState<string>();
  if (streaming || !imageUrls.length) return null;
  return (
    <>
      <div className="mb-2 flex flex-wrap gap-2">
        {imageUrls.map((url) => (
          <button key={url} type="button" onClick={() => setLightboxUrl(url)} className="overflow-hidden rounded-lg border border-border hover:border-primary/40" title="查看大图">
            <KnowledgeImage url={url} className="size-28 object-cover" />
          </button>
        ))}
      </div>
      <Dialog open={Boolean(lightboxUrl)} onOpenChange={(open) => !open && setLightboxUrl(undefined)}>
        <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none">
          {lightboxUrl ? <KnowledgeImage url={lightboxUrl} className="max-h-[85vh] w-full rounded-xl bg-background object-contain" /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
