import { useEffect, useState } from 'react';
import type { MediaAsset } from '../types';
import { KnowledgeMediaImage, MediaLightbox } from './KnowledgeMediaImage';
import { KbDocumentElementContent } from './KbDocumentElementContent';

export function ChunkMediaPreview({ assets, imageId }: { assets?: MediaAsset[]; imageId?: string | null }) {
  const resolvedAssets = assets?.length ? assets : imageId?.trim() ? [{ assetId: imageId.trim(), previewUrl: `/gpt/kb/media/preview/${encodeURIComponent(imageId.trim())}` }] : [];
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => { setActive(null); }, [assets, imageId]);
  if (!resolvedAssets.length) return null;
  return <div className="mt-3 space-y-3"><div className="grid gap-3 sm:grid-cols-2">{resolvedAssets.map((asset, index) => <div key={asset.assetId || index} className="space-y-2"><KnowledgeMediaImage asset={asset} onClick={() => setActive(index)} /><KbDocumentElementContent asset={asset} />{asset.caption && <p className="text-xs text-muted-foreground">{asset.caption}</p>}{asset.ocrText && <p className="text-xs whitespace-pre-wrap text-muted-foreground">OCR：{asset.ocrText}</p>}</div>)}</div>{active != null && <MediaLightbox assets={resolvedAssets} index={active} onIndexChange={setActive} onClose={() => setActive(null)} />}</div>;
}
