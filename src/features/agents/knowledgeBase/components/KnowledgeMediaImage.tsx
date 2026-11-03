import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fetchKnowledgeMediaBlob } from '../api/mediaApi';
import type { MediaAsset } from '../types';
import { KbDocumentElementContent } from './KbDocumentElementContent';

export function KnowledgeMediaImage({ asset, onClick, large = false }: { asset: MediaAsset; onClick?: () => void; large?: boolean }) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState('');
  const url = asset.previewUrl || (asset.assetId ? `/gpt/kb/media/preview/${encodeURIComponent(asset.assetId)}` : '');
  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    setSrc(''); setError('');
    if (url) void fetchKnowledgeMediaBlob(url).then((blob) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob); setSrc(objectUrl);
    }).catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : '媒体加载失败'); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url]);
  if (!url) return null;
  const body = error ? <p role="alert" className="p-5 text-xs text-destructive">{error}</p> : src ? <img src={src} alt={asset.caption || '解析元素'} className={`${large ? 'max-h-[65dvh]' : 'h-36'} w-full object-contain`} onError={() => setError('媒体内容无法显示')} /> : <p className="p-5 text-xs text-muted-foreground">加载图片…</p>;
  return onClick ? <button type="button" className="block w-full rounded-lg border border-border bg-muted/20 p-2" onClick={onClick} aria-label={`放大查看 ${asset.caption || asset.assetId}`}>{body}</button> : <div className="rounded-lg bg-muted/20 p-2">{body}</div>;
}

export function MediaLightbox({ assets, index, onIndexChange, onClose }: { assets: MediaAsset[]; index: number; onIndexChange: (index: number) => void; onClose: () => void }) {
  const asset = assets[index];
  if (!asset) return null;
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="sm:max-w-4xl max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{asset.caption || '解析元素预览'} · {index + 1}/{assets.length}</DialogTitle></DialogHeader><KnowledgeMediaImage asset={asset} large /><KbDocumentElementContent asset={asset} />{asset.ocrText && <p className="whitespace-pre-wrap text-xs text-muted-foreground">OCR：{asset.ocrText}</p>}<div className="flex justify-between"><Button variant="outline" disabled={index === 0} onClick={() => onIndexChange(index - 1)}>上一项</Button><Button variant="outline" disabled={index >= assets.length - 1} onClick={() => onIndexChange(index + 1)}>下一项</Button></div></DialogContent></Dialog>;
}
