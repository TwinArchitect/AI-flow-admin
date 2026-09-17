import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Key, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { addChunk, deleteChunks, queryDocumentChunks, setChunkAvailability, updateChunk } from '../api';
import { knowledgeBaseKeys } from '../hooks/queryKeys';
import type { KBFile } from '../data/kbMock';
import type { KnowledgeChunk } from '../types';
import { ChunkMediaPreview } from './ChunkMediaPreview';

interface ChunksModalProps {
  open: boolean;
  file: KBFile | null;
  datasetId?: string;
  onClose: () => void;
}

export function ChunksModal({ open, file, datasetId, onClose }: ChunksModalProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<KnowledgeChunk | null>(null);
  const [content, setContent] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setAdding(false);
      setEditing(null);
      setContent('');
      setPage(1);
      setExpandedId(null);
    }
  }, [open]);

  const chunksQuery = useQuery({
    queryKey: file
      ? knowledgeBaseKeys.chunks({ datasetId: datasetId ?? '', documentId: file.id, page, size: 20 })
      : ['knowledge-base', 'chunks', 'closed'],
    queryFn: () => queryDocumentChunks(file!.id, page, 20),
    enabled: open && Boolean(file),
  });
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
      if (editing) return updateChunk(editing.id, { content: value });
      if (!datasetId) throw new Error('缺少知识库 ID');
      return addChunk({ datasetId, documentId: file.id, content: value, chunkIndex: total });
    },
    onSuccess: async () => {
      await refresh();
      setAdding(false);
      setEditing(null);
      setContent('');
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

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Key size={16} /></div>
              <div className="min-w-0">
                <DialogTitle className="text-sm truncate">文本分块管理 - {file.name}</DialogTitle>
                <p className="text-2xs text-muted-foreground mt-0.5">共 {total} 个分块</p>
              </div>
            </div>
            <Button size="xs" onClick={() => { setAdding(true); setEditing(null); setContent(''); }}><Plus size={14} />新增分块</Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {(adding || editing) && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <Textarea rows={5} value={content} onChange={(event) => setContent(event.target.value)} placeholder="输入分块文本内容" />
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
            <div key={chunk.id} className="p-4 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
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
                  <Button variant="ghost" size="icon-xs" onClick={() => { setEditing(chunk); setAdding(false); setContent(chunk.content); }}><Edit2 size={12} /></Button>
                  <Button variant="ghost" size="icon-xs" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(chunk.id)}><Trash2 size={12} /></Button>
                </div>
              </div>
              <button type="button" className="block w-full text-left" onClick={() => setExpandedId(expanded ? null : chunk.id)}>
                <p className={`text-xs leading-relaxed whitespace-pre-wrap break-words ${expanded ? '' : 'line-clamp-10'}`}>{chunk.content}</p>
                <p className="mt-2 text-2xs text-muted-foreground">{chunk.content.length} 字符{!expanded && chunk.content.length > 400 ? ' · 点击展开查看全部' : ''}</p>
              </button>
              {(chunk.hasImage || chunk.mediaAssets?.length) && <ChunkMediaPreview assets={chunk.mediaAssets} />}
            </div>
          );})}
        </div>
        <div className="pt-4 border-t border-border flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="xs" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>上一页</Button>
            <Button variant="outline" size="xs" disabled={page * 20 >= total} onClick={() => setPage((value) => value + 1)}>下一页</Button>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>关闭窗口</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
