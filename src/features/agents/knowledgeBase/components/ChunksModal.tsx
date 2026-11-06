import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Key, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { addChunk, deleteChunks, queryChunks, queryDocumentChunks, listChunkTagsByDocument, setChunkAvailability, updateChunk } from '../api';
import { normalizeChunkTags } from '../kbContracts';
import { knowledgeBaseKeys } from '../hooks/queryKeys';
import type { KBFile } from '../data/kbMock';
import type { KnowledgeChunk } from '../types';
import { ChunkMediaPreview } from './ChunkMediaPreview';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChunksModalProps {
  open: boolean;
  file: KBFile | null;
  datasetId?: string;
  onClose: () => void;
  embedded?: boolean;
  onSelect?: (chunk: KnowledgeChunk) => void;
}

export function ChunksModal({ open, file, datasetId, onClose, embedded = false, onSelect }: ChunksModalProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<KnowledgeChunk | null>(null);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedChunk, setExpandedChunk] = useState<KnowledgeChunk | null>(null);
  const [markdown, setMarkdown] = useState(false);

  useEffect(() => {
    setAdding(false);
    setEditing(null);
    setContent('');
    setPage(1);
    setExpandedId(null);
    setExpandedChunk(null); setMarkdown(false);
    setTags([]); setTagInput(''); setTagFilter('');
  }, [open, file?.id]);

  const tagsQuery = useQuery({ queryKey: ['knowledge-base', 'chunks', 'tags', file?.id], queryFn: () => listChunkTagsByDocument(file!.id), enabled: open && Boolean(file), retry: false });

  const chunksQuery = useQuery({
    queryKey: file
      ? [...knowledgeBaseKeys.chunks({ datasetId: datasetId ?? '', documentId: file.id, tag: tagFilter, page, size: 20 }), embedded ? 'continuous' : 'paged']
      : ['knowledge-base', 'chunks', 'closed'],
    queryFn: async () => {
      const load = (nextPage: number) => tagFilter ? queryChunks({ datasetId: datasetId ?? '', documentId: file!.id, tag: tagFilter, page: nextPage, size: 20 }) : queryDocumentChunks(file!.id, nextPage, 20);
      const first = await load(embedded ? 1 : page);
      if (!embedded) return first;
      const records = [...first.records];
      for (let next = 2; records.length < first.total; next++) {
        const result = await load(next);
        if (!result.records.length) break;
        records.push(...result.records);
      }
      return { ...first, records };
    },
    enabled: open && Boolean(file),
  });
  useEffect(() => {
    if (!open || embedded || !chunksQuery.data || chunksQuery.isFetching) return;
    const maxPage = Math.max(1, Math.ceil(chunksQuery.data.total / 20));
    if (page > maxPage) setPage(maxPage);
  }, [open, embedded, chunksQuery.data, chunksQuery.isFetching, page]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['knowledge-base', 'chunks'] }),
      datasetId ? queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.documents(datasetId) }) : Promise.resolve(),
      datasetId ? queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.datasetStats(datasetId) }) : Promise.resolve(),
    ]);
  };
  const saveMutation = useMutation({
    mutationFn: async () => {
      const value = content.trim();
      if (!value || !file) throw new Error('分块内容不能为空');
      if (editing) return updateChunk(editing.id, { content: value, tags: normalizeChunkTags(tags) });
      if (!datasetId) throw new Error('缺少知识库 ID');
      const all = tagFilter ? await queryDocumentChunks(file.id, 1, 1) : chunksQuery.data;
      return addChunk({ datasetId, documentId: file.id, content: value, chunkIndex: all?.total ?? 0, available: true, tags: normalizeChunkTags(tags) });
    },
    onSuccess: async () => {
      await refresh();
      setAdding(false);
      setEditing(null);
      setContent('');
      setTags([]); setTagInput('');
      toast.success('分块已保存');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '分块保存失败'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteChunks([id]),
    onSuccess: async () => {
      await refresh();
      toast.success('分块已删除');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '分块删除失败'),
  });
  const availabilityMutation = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) => setChunkAvailability([id], available),
    onSuccess: refresh,
    onError: (error) => toast.error(error instanceof Error ? error.message : '分块检索状态更新失败'),
  });

  if (!file) return null;
  const chunks = chunksQuery.data?.records ?? [];
  const total = chunksQuery.data?.total ?? 0;

  const body = <>
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Key size={16} /></div>
              <div className="min-w-0">
                {embedded ? <h3 className="text-sm font-semibold truncate">分块内容</h3> : <DialogTitle className="text-sm truncate">文本分块管理 - {file.name}</DialogTitle>}
                <p className="text-2xs text-muted-foreground mt-0.5">共 {total} 个分块</p>
              </div>
            </div>
            <Button size="xs" onClick={() => { setAdding(true); setEditing(null); setContent(''); setTags([]); setTagInput(''); }}><Plus size={14} />新增分块</Button>
          </div>
        </DialogHeader>
        <Select value={tagFilter || '__all__'} onValueChange={(value) => { setTagFilter(value === '__all__' ? '' : value); setPage(1); }}><SelectTrigger aria-label="分块标签筛选"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__all__">全部分块标签</SelectItem>{normalizeChunkTags([...(tagsQuery.data ?? []), ...chunks.flatMap((chunk) => chunk.tags ?? []), ...(tagFilter ? [tagFilter] : [])]).map((tag) => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}</SelectContent></Select>
        {tagsQuery.isError && <p className="text-xs text-muted-foreground">全部标签加载失败，仍显示当前页标签选项。</p>}
        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {(adding || editing) && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <Textarea rows={5} value={content} onChange={(event) => setContent(event.target.value)} placeholder="输入分块文本内容" />
              <div className="flex flex-wrap gap-2">{tags.map((tag) => <Button key={tag} variant="secondary" size="xs" aria-label={`移除分块标签 ${tag}`} onClick={() => setTags((current) => current.filter((value) => value !== tag))}>{tag} ×</Button>)}</div>
              <div className="flex gap-2"><Input aria-label="分块标签" placeholder="每个标签最多 20 字" value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); setTags(normalizeChunkTags([...tags, ...tagInput.split(/[、,，;；\n]/)])); setTagInput(''); } }} /><Button variant="outline" size="sm" disabled={!tagInput.trim()} onClick={() => { setTags(normalizeChunkTags([...tags, ...tagInput.split(/[、,，;；\n]/)])); setTagInput(''); }}>添加标签</Button></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="xs" onClick={() => { setAdding(false); setEditing(null); setContent(''); }}>取消</Button>
                <Button size="xs" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>{saveMutation.isPending ? '保存中...' : '保存'}</Button>
              </div>
            </div>
          )}
          {chunksQuery.isLoading && <p className="py-12 text-center text-xs text-muted-foreground">正在加载分块...</p>}
          {chunksQuery.isError && <p className="py-12 text-center text-xs text-destructive">分块加载失败</p>}
          {!chunksQuery.isLoading && !chunksQuery.isError && chunks.length === 0 && <p className="py-12 text-center text-xs text-muted-foreground">暂无分块数据</p>}
          {chunks.map((chunk, index) => {
            const displayIndex = chunk.chunkIndex != null ? chunk.chunkIndex + 1 : (page - 1) * 20 + index + 1;
            const expanded = expandedId === chunk.id;
            return (
            <div key={chunk.id} className="p-4 rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-primary/30">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-border/60 pb-2">
                <span className="text-2xs font-bold text-primary">
                  分块 #{displayIndex} · {chunk.chunkType ?? 'text'}{chunk.pageStart != null ? ` · 第 ${chunk.pageStart} 页` : ''}
                </span>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={chunk.available !== false}
                    disabled={!file.enabled || availabilityMutation.isPending}
                    title={!file.enabled ? '文档检索已关闭，请先开启文档检索' : chunk.available !== false ? '分块检索已开启' : '分块检索已关闭'}
                    onCheckedChange={(available) => availabilityMutation.mutate({ id: chunk.id, available })}
                    className="scale-75 data-[state=checked]:bg-success"
                  />
                  <Button variant="ghost" size="xs" onClick={() => { setExpandedChunk(chunk); setMarkdown(false); }}>放大</Button>
                  <Button variant="ghost" size="xs" onClick={() => { setExpandedChunk(chunk); setMarkdown(true); }}>Markdown</Button>
                  <Button variant="ghost" size="icon-xs" aria-label={`编辑分块 ${displayIndex}`} onClick={() => { setEditing(chunk); setAdding(false); setContent(chunk.content); setTags(normalizeChunkTags(chunk.tags ?? [])); setTagInput(''); }}><Edit2 size={12} /></Button>
                  <Button variant="ghost" size="icon-xs" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(chunk.id)}><Trash2 size={12} /></Button>
                </div>
              </div>
              <button type="button" className="block w-full text-left" onClick={() => { setExpandedId(expanded ? null : chunk.id); onSelect?.(chunk); }}>
                <p className={`text-xs leading-6 whitespace-pre-wrap break-words ${expanded ? '' : 'line-clamp-6'}`}>{chunk.content}</p>
                <p className="mt-2 text-2xs text-muted-foreground">{chunk.content.length} 字符{!expanded && chunk.content.length > 400 ? ' · 点击展开查看全部' : ''}</p>
              </button>
              <div className="mt-3 flex flex-wrap gap-1">{normalizeChunkTags(chunk.tags ?? []).map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div>
              {Boolean(chunk.hasImage || chunk.mediaAssets?.length) && <ChunkMediaPreview assets={chunk.mediaAssets} />}
            </div>
          );})}
        </div>
        {!embedded && <div className="pt-4 border-t border-border flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="xs" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>上一页</Button>
            <Button variant="outline" size="xs" disabled={page * 20 >= total} onClick={() => setPage((value) => value + 1)}>下一页</Button>
          </div>
          {!embedded && <Button variant="outline" size="sm" onClick={onClose}>关闭窗口</Button>}
        </div>}
      {expandedChunk && <Dialog open onOpenChange={(value) => !value && setExpandedChunk(null)}><DialogContent className="sm:max-w-3xl max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>分块内容</DialogTitle></DialogHeader><div className="flex gap-2"><Button variant={markdown ? 'outline' : 'secondary'} size="sm" onClick={() => setMarkdown(false)}>纯文本</Button><Button variant={markdown ? 'secondary' : 'outline'} size="sm" onClick={() => setMarkdown(true)}>Markdown</Button></div>{markdown ? <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{expandedChunk.content}</ReactMarkdown></div> : <pre className="whitespace-pre-wrap break-words text-sm leading-6">{expandedChunk.content}</pre>}<ChunkMediaPreview assets={expandedChunk.mediaAssets} /></DialogContent></Dialog>}
    </>;
  return embedded ? <aside aria-label="预览分块列表" className="flex h-full min-h-0 flex-col gap-3 bg-muted/20 p-4">{body}</aside> : <Dialog open={open} onOpenChange={(value) => !value && onClose()}><DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">{body}</DialogContent></Dialog>;
}
