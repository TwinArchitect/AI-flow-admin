import { useState } from 'react';
import { Key, Plus, Edit2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { KBFile } from '../data/kbMock';
import { mockChunksData } from '../data/kbMock';

interface ChunksModalProps {
  open: boolean;
  file: KBFile | null;
  onClose: () => void;
}

export function ChunksModal({ open, file, onClose }: ChunksModalProps) {
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [chunks, setChunks] = useState<Record<string, { title: string; content: string; charCount: number }[]>>(mockChunksData);

  if (!file) return null;
  const fileChunks = chunks[file.id] || [];

  const handleAdd = () => {
    if (!newTitle.trim() || !newContent.trim()) { toast.error('标题与内容不能为空'); return; }
    setChunks((prev) => ({
      ...prev,
      [file.id]: [{ title: newTitle.trim(), content: newContent.trim(), charCount: newContent.trim().length }, ...(prev[file.id] || [])],
    }));
    setAdding(false); setNewTitle(''); setNewContent('');
    toast.success('成功添加新的人工指定索引分块');
  };

  const handleEdit = (idx: number) => {
    if (!editTitle.trim() || !editContent.trim()) { toast.error('修改内容不能为空'); return; }
    setChunks((prev) => {
      const list = [...(prev[file.id] || [])];
      list[idx] = { title: editTitle.trim(), content: editContent.trim(), charCount: editContent.trim().length };
      return { ...prev, [file.id]: list };
    });
    setEditIdx(null); toast.success('已更新该分块内容');
  };

  const handleDelete = (idx: number) => {
    setChunks((prev) => ({ ...prev, [file.id]: (prev[file.id] || []).filter((_, i) => i !== idx) }));
    toast.success('已成功移除该分块');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Key size={16} /></div>
              <div>
                <DialogTitle className="text-sm">已解析文本分块管理 - {file.name}</DialogTitle>
                <p className="text-2xs text-muted-foreground mt-0.5">解析器: {file.parser} · 分块数量: {fileChunks.length} 块</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={adding ? 'outline' : 'default'} size="xs" onClick={() => { setAdding(!adding); setEditIdx(null); }}>
                <Plus size={14} className={cn('transition-transform', adding && 'rotate-45')} />
                {adding ? '取消新增' : '新增分块'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {adding && (
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-3">
              <p className="text-xs font-bold text-primary">手动注入自定义的分词文本块索引</p>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="分块标题" className="h-9 text-xs" />
              <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={3} placeholder="核心段落文本内容" className="text-xs" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="xs" onClick={() => setAdding(false)}>取消</Button>
                <Button size="xs" onClick={handleAdd}>提交极速索引</Button>
              </div>
            </div>
          )}

          {fileChunks.length > 0 ? fileChunks.map((chunk, idx) => {
            if (editIdx === idx) {
              return (
                <div key={idx} className="p-4 bg-amber-50/40 dark:bg-amber-950/10 rounded-2xl border border-amber-200/50 space-y-3">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">修订文本分块数据 (区块 {idx + 1})</p>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-9 text-xs" />
                  <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} className="text-xs" />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="xs" onClick={() => setEditIdx(null)}>取消</Button>
                    <Button size="xs" onClick={() => handleEdit(idx)} className="bg-amber-600 hover:bg-amber-700">保存修改</Button>
                  </div>
                </div>
              );
            }
            return (
              <div key={idx} className="p-4 bg-muted/30 rounded-2xl border border-border hover:border-primary/20 transition-all group relative">
                <div className="flex items-center justify-between text-2xs font-bold text-muted-foreground mb-2">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{chunk.title}</span>
                  <div className="flex items-center gap-2">
                    <span>{chunk.charCount} 字符</span>
                    <div className="hidden group-hover:flex items-center gap-1 ml-2">
                      <button type="button" onClick={() => { setEditIdx(idx); setEditTitle(chunk.title); setEditContent(chunk.content); }}
                        className="p-1 hover:bg-accent hover:text-amber-600 rounded transition-colors"><Edit2 size={12} /></button>
                      <button type="button" onClick={() => handleDelete(idx)}
                        className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{chunk.content}</p>
              </div>
            );
          }) : (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-xs font-bold">该文件未加载分块数据</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border shrink-0 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>关闭窗口</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
