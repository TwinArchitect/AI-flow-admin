import { useEffect, useRef, useState } from 'react';
import { Pencil, Plus, RefreshCw, RotateCcw, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getDocumentEnrichment, regenerateDocumentEnrichment, restoreDocumentEnrichmentAi, updateDocumentEnrichment } from '../api/documentApi';
import type { DocumentEnrichment } from '../types';

export function normalizeEnrichmentTags(tags: string[]) {
  const seen = new Set<string>();
  return tags.map((tag) => tag.trim().replace(/^[#、,，;；]+|[#、,，;；]+$/g, '').slice(0, 20)).filter((tag) => {
    const key = tag.toLocaleLowerCase();
    if (!tag || seen.has(key)) return false;
    seen.add(key); return true;
  });
}
const includes = (tags: string[], tag: string) => tags.some((value) => value.toLocaleLowerCase() === tag.toLocaleLowerCase());
const without = (tags: string[], tag: string) => tags.filter((value) => value.toLocaleLowerCase() !== tag.toLocaleLowerCase());
const awaiting = (value?: string | null) => ['PENDING', 'GENERATING'].includes(String(value ?? '').toUpperCase());
const statusLabels: Record<string, string> = { READY: '已生成', GENERATING: '生成中', PENDING: '待生成', FAILED: '生成失败', STALE: '待更新', SKIPPED: '无可富化内容' };

interface Props { documentId: string; fileName: string; onClose: () => void; onChanged: () => void }

// 父级按文档 ID 挂载，关闭即卸载；sequence 同时隔离旧读取、轮询与写入响应。
export function DocumentEnrichmentDialog({ documentId, fileName, onClose, onChanged }: Props) {
  const [data, setData] = useState<DocumentEnrichment | null>(null);
  const [manualTags, setManualTags] = useState<string[]>([]);
  const [suppressed, setSuppressed] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [summaryEditing, setSummaryEditing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [exhausted, setExhausted] = useState(false);
  const sequence = useRef(0);
  const attempts = useRef(0);
  const changed = useRef(onChanged);
  changed.current = onChanged;

  const hydrate = (value: DocumentEnrichment) => {
    setData(value); setManualTags(normalizeEnrichmentTags(value.manualAddedTags ?? []));
    setSuppressed(normalizeEnrichmentTags(value.suppressedAiTags ?? []));
    setSummary(value.manualSummary ?? value.effectiveSummary ?? value.aiSummary ?? '');
    setSummaryEditing(Boolean(value.manualSummary)); setDirty(false); setTagInput(''); setEditingTag(null);
  };
  useEffect(() => {
    const request = ++sequence.current;
    getDocumentEnrichment(documentId).then((value) => { if (request === sequence.current) hydrate(value ?? { documentId, status: 'PENDING' }); })
      .catch((cause) => { if (request === sequence.current) { setData({ documentId, status: 'PENDING' }); setError(cause instanceof Error ? cause.message : '加载失败'); } })
      .finally(() => { if (request === sequence.current) setLoading(false); });
    return () => { sequence.current += 1; };
  }, [documentId]);

  useEffect(() => {
    if (loading || busy || dirty || exhausted || !awaiting(data?.status)) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (++attempts.current > 24) { setExhausted(true); return; }
      const request = ++sequence.current;
      try {
        const value = await getDocumentEnrichment(documentId);
        if (!cancelled && request === sequence.current && value) {
          hydrate(value);
          if (!awaiting(value.status)) changed.current();
        }
      } catch { if (!cancelled) setData((previous) => previous ? { ...previous } : previous); }
    }, 2500);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [data, documentId, loading, busy, dirty, exhausted]);

  const aiTags = normalizeEnrichmentTags(data?.aiTags?.length ? data.aiTags : data?.effectiveTags ?? []);
  const effectiveTags = normalizeEnrichmentTags([...aiTags.filter((tag) => !includes(suppressed, tag)), ...manualTags]);
  const mutate = async (kind: 'save' | 'generate' | 'restore' | 'reload') => {
    const request = ++sequence.current;
    setBusy(true); setError('');
    if (kind === 'generate' || kind === 'reload') { attempts.current = 0; setExhausted(false); }
    try {
      const result = kind === 'save'
        ? await updateDocumentEnrichment(documentId, { manualAddedTags: manualTags, suppressedAiTags: suppressed, ...(summaryEditing ? { manualSummary: summary.trim() } : {}) })
        : kind === 'generate' ? await regenerateDocumentEnrichment(documentId)
          : kind === 'restore' ? await restoreDocumentEnrichmentAi(documentId) : await getDocumentEnrichment(documentId);
      const next = result ?? (kind === 'generate' ? { ...data, documentId, status: 'GENERATING' } : await getDocumentEnrichment(documentId));
      if (request === sequence.current) { hydrate(next ?? { documentId }); changed.current(); }
    } catch (cause) { if (request === sequence.current) setError(cause instanceof Error ? cause.message : '操作失败'); }
    finally { if (request === sequence.current) setBusy(false); }
  };
  const remove = (tag: string) => {
    ++sequence.current; setDirty(true);
    if (includes(manualTags, tag)) setManualTags(without(manualTags, tag));
    else setSuppressed(normalizeEnrichmentTags([...suppressed, tag]));
  };
  const commitTag = () => {
    const tag = normalizeEnrichmentTags(tagInput.split(/[、,，;；\n]/))[0];
    if (!tag) return;
    ++sequence.current; setDirty(true);
    let nextManual = manualTags;
    let nextSuppressed = suppressed;
    if (editingTag) {
      if (includes(aiTags, editingTag) && !includes(manualTags, editingTag)) nextSuppressed = normalizeEnrichmentTags([...nextSuppressed, editingTag]);
      else nextManual = without(nextManual, editingTag);
    }
    if (includes(aiTags, tag)) nextSuppressed = without(nextSuppressed, tag);
    else nextManual = normalizeEnrichmentTags([...nextManual, tag]);
    setManualTags(nextManual); setSuppressed(nextSuppressed); setEditingTag(null); setTagInput('');
  };

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="sm:max-w-2xl max-h-[85dvh] overflow-y-auto">
    <DialogHeader><DialogTitle>文档知识标签与摘要</DialogTitle><DialogDescription>{fileName} · 与分块检索状态独立</DialogDescription></DialogHeader>
    <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{statusLabels[String(data?.status ?? '').toUpperCase()] ?? '待生成'}</Badge><span className="text-xs text-muted-foreground">{data?.generatedAt ?? '尚未生成'}{data?.modelId ? ` · 模型 ${data.modelId}` : ''}{data?.contentVersion != null ? ` · 版本 ${data.contentVersion}` : ''}</span></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{data?.errorMessage && <p className="text-xs text-destructive">{data.errorMessage}</p>}
    {loading ? <p>加载中…</p> : <fieldset disabled={busy} className="space-y-5 min-w-0">
      <section className="rounded-xl border border-border p-4 space-y-3"><Label>文档知识标签</Label><div className="flex flex-wrap gap-2">{effectiveTags.map((tag) => <div key={tag.toLocaleLowerCase()} className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs"><span>{tag}</span><span className="text-muted-foreground">{includes(manualTags, tag) ? '人工' : 'AI'}</span><Button variant="ghost" size="icon-xs" aria-label={`编辑标签 ${tag}`} onClick={() => { ++sequence.current; setDirty(true); setEditingTag(tag); setTagInput(tag); }}><Pencil size={12} /></Button><Button variant="ghost" size="icon-xs" aria-label={`删除标签 ${tag}`} onClick={() => remove(tag)}><X size={12} /></Button></div>)}{!effectiveTags.length && <p className="text-xs text-muted-foreground">暂无知识标签</p>}</div>
        <div className="flex gap-2"><Input aria-label="知识标签" placeholder="每个标签最多 20 字" value={tagInput} onChange={(event) => { ++sequence.current; setDirty(true); setTagInput(event.target.value); }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); commitTag(); } }} /><Button variant="outline" disabled={!tagInput.trim()} onClick={commitTag}><Plus size={14} />{editingTag ? '确认修改' : '添加标签'}</Button>{editingTag && <Button variant="ghost" onClick={() => { setEditingTag(null); setTagInput(''); }}>取消</Button>}</div>
      </section>
      <section className="space-y-3"><div className="flex justify-between"><Label htmlFor="document-summary">文档内容摘要</Label><Button variant="ghost" size="sm" onClick={() => { ++sequence.current; setDirty(true); setSummaryEditing(true); }}>编辑摘要</Button></div>{summaryEditing ? <Textarea id="document-summary" className="min-h-36" value={summary} onChange={(event) => { ++sequence.current; setSummary(event.target.value); setDirty(true); }} /> : <p className="rounded-xl bg-muted p-4 text-sm whitespace-pre-wrap leading-6">{data?.effectiveSummary ?? data?.manualSummary ?? data?.aiSummary ?? '暂无内容摘要'}</p>}<p className="text-xs text-muted-foreground">人工修改独立保存；清空人工摘要后保存可回退 AI 摘要。</p></section>
    </fieldset>}
    {exhausted && <p role="status" className="text-xs text-muted-foreground">暂未完成，已停止自动刷新，可稍后手动刷新。</p>}
    <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-4"><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy || loading} onClick={() => void mutate('generate')}><RefreshCw size={14} />重新生成</Button><Button variant="outline" disabled={busy || loading} onClick={() => void mutate('restore')}><RotateCcw size={14} />恢复 AI 内容</Button><Button variant="ghost" disabled={busy || loading} onClick={() => void mutate('reload')}>刷新</Button></div><Button disabled={busy || loading} onClick={() => void mutate('save')}>{busy ? '处理中…' : '保存修改'}</Button></div>
  </DialogContent></Dialog>;
}
