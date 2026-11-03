import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listDocumentElements, updateKbMediaTags } from '../api';
import { normalizeMediaTags, formatMediaConfidence } from '../kbContracts';
import { KnowledgeMediaImage, MediaLightbox } from './KnowledgeMediaImage';
import { KbDocumentElementContent, MEDIA_ASSET_TYPE_OPTIONS, mediaAssetTypeLabel } from './KbDocumentElementContent';
import type { MediaAsset } from '../types';

export function DocumentElementsPane({ documentId, selectedAssetIds = [], onPage }: { documentId: string; selectedAssetIds?: string[]; onPage: (page: number) => void }) {
  const client = useQueryClient();
  const key = ['knowledge-base', 'elements', documentId];
  const query = useQuery({ queryKey: key, queryFn: () => listDocumentElements(documentId), retry: false });
  const [type, setType] = useState('ALL');
  const [tag, setTag] = useState('');
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState<number | null>(null);
  const assets = query.data?.records ?? [];
  const visible = assets.filter((asset) => (type === 'ALL' || asset.assetType === type) && (!tag || asset.tags?.includes(tag)));
  const tags = [...new Set(assets.flatMap((asset) => asset.tags ?? []))];
  useEffect(() => { if (tag && !tags.includes(tag)) setTag(''); }, [tag, tags.join('\u0000')]);
  const save = async () => {
    if (!editing) return;
    setSaving(true); setError('');
    try {
      await updateKbMediaTags(editing.assetId, normalizeMediaTags(draft.split(/[、,，;；\n]/)));
      await client.invalidateQueries({ queryKey: key });
      await client.invalidateQueries({ queryKey: ['knowledge-base', 'chunks'] });
      setEditing(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : '标签保存失败'); }
    finally { setSaving(false); }
  };
  return <div className="h-full overflow-y-auto p-4 space-y-4">
    <div className="flex flex-wrap gap-2"><Select value={type} onValueChange={setType}><SelectTrigger aria-label="解析元素类型" className="w-36"><SelectValue /></SelectTrigger><SelectContent>{MEDIA_ASSET_TYPE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select><Select value={tag || '__all__'} onValueChange={(value) => setTag(value === '__all__' ? '' : value)}><SelectTrigger aria-label="元素标签筛选" className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__all__">全部元素标签</SelectItem>{tags.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select><span className="self-center text-xs text-muted-foreground">{visible.length}/{query.data?.total ?? 0} 项</span></div>
    {query.isLoading && <p>加载解析元素…</p>}{query.isError && <div role="alert" className="space-y-2 text-sm text-destructive"><p>{query.error.message}</p><Button variant="outline" onClick={() => void query.refetch()}>重试</Button></div>}
    {!query.isLoading && !query.isError && !visible.length && <p className="py-12 text-center text-sm text-muted-foreground">未找到可展示元素；图片、表格、公式、印章和签字将在解析完成后显示。</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="grid gap-4 xl:grid-cols-2">{visible.map((asset, index) => <section key={asset.assetId || index} className={`rounded-xl border bg-card p-4 space-y-3 ${selectedAssetIds.includes(asset.assetId) ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}>
      <div className="flex items-center justify-between gap-2"><Badge variant="secondary">{mediaAssetTypeLabel(asset)}</Badge>{asset.pageNum != null && <Button variant="ghost" size="xs" onClick={() => onPage(asset.pageNum!)}>第 {asset.pageNum} 页</Button>}</div>
      <KnowledgeMediaImage asset={asset} onClick={() => setLightbox(index)} />
      {asset.caption && <p className="text-sm font-medium">{asset.caption}</p>}<KbDocumentElementContent asset={asset} />{asset.ocrText && <p className="text-xs whitespace-pre-wrap text-muted-foreground">{asset.ocrText}</p>}
      <p className="text-2xs text-muted-foreground">{[asset.width != null && asset.height != null ? `${asset.width} × ${asset.height}` : null, asset.source ? `来源 ${asset.source}` : null, formatMediaConfidence(asset.confidence) ? `置信度 ${formatMediaConfidence(asset.confidence)}` : null].filter(Boolean).join(' · ')}</p>{asset.bbox != null && <details className="text-xs text-muted-foreground"><summary>位置信息</summary><pre className="whitespace-pre-wrap break-all">{JSON.stringify(asset.bbox, null, 2)}</pre></details>}
      <div className="flex flex-wrap gap-1">{asset.tags?.map((value) => <Button key={value} size="xs" variant={tag === value ? 'secondary' : 'outline'} aria-pressed={tag === value} title={`筛选标签 ${value}`} onClick={() => setTag((current) => current === value ? '' : value)}>{value}</Button>)}</div>
      {editing?.assetId === asset.assetId ? <div className="space-y-2"><Input aria-label="元素标签" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="最多 10 个标签，每项最多 20 字，用逗号分隔" /><p className="text-2xs text-muted-foreground">元素标签最多 10 个，超出时保留前 10 个有效标签。</p><div className="flex gap-2"><Button size="xs" disabled={saving} onClick={() => void save()}>保存标签</Button><Button variant="outline" size="xs" disabled={saving} onClick={() => setEditing(null)}>取消</Button></div></div> : <Button variant="outline" size="xs" disabled={saving || !asset.assetId} onClick={() => { setEditing(asset); setDraft(normalizeMediaTags(asset.tags ?? []).join('，')); }}>编辑元素标签</Button>}
    </section>)}</div>
    {lightbox != null && <MediaLightbox assets={visible} index={lightbox} onIndexChange={setLightbox} onClose={() => setLightbox(null)} />}
  </div>;
}
