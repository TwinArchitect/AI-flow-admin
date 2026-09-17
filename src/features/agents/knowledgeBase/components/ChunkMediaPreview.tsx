import { useEffect, useState } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { fetchKnowledgeMediaBlob } from '../api/mediaApi';
import type { MediaAsset } from '../types';

export function ChunkMediaPreview({ assets, imageId }: { assets?: MediaAsset[]; imageId?: string | null }) {
  const resolvedAssets = assets?.length
    ? assets
    : imageId?.trim()
      ? [{ assetId: imageId.trim(), previewUrl: `/gpt/kb/media/preview/${imageId.trim()}` }]
      : [];
  const primary = resolvedAssets.find((asset) => Boolean(asset.previewUrl));
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setSrc(null);
    setFailed(false);
    if (!primary?.previewUrl) return undefined;
    void fetchKnowledgeMediaBlob(primary.previewUrl)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [primary?.previewUrl]);

  if (!primary?.previewUrl) return null;
  if (failed) return <div className="mt-3 flex h-24 items-center justify-center rounded-lg border bg-muted/30 text-muted-foreground" title="图片加载失败"><ImageIcon size={18} /></div>;
  if (!src) return <div className="mt-3 flex h-24 items-center justify-center rounded-lg border bg-muted/30 text-muted-foreground"><Loader2 size={16} className="animate-spin" /></div>;

  return (
    <div className="mt-3 space-y-1.5">
      <img src={src} alt={primary.caption || '分块关联图片'} className="max-h-44 w-full rounded-lg border bg-muted/30 object-contain" loading="lazy" />
      {primary.caption && <p className="text-2xs text-muted-foreground">{primary.caption}</p>}
      {primary.ocrText && <p className="rounded bg-muted/40 px-2 py-1 text-2xs text-muted-foreground">OCR：{primary.ocrText}</p>}
      {resolvedAssets.length > 1 && <p className="text-2xs text-muted-foreground">另有 {resolvedAssets.length - 1} 张关联图片</p>}
    </div>
  );
}
