import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { KBFile } from '../data/kbMock';
import { mockChunksData } from '../data/kbMock';

interface DocPreviewModalProps {
  open: boolean;
  file: KBFile | null;
  onClose: () => void;
}

export function DocPreviewModal({ open, file, onClose }: DocPreviewModalProps) {
  if (!file) return null;
  const chunks = mockChunksData[file.id] || [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-destructive flex items-center justify-center font-bold text-xs">
              {file.name.endsWith('.pdf') ? 'PDF' : 'DOC'}
            </div>
            <div>
              <DialogTitle className="text-sm">文档在线高保真预览 - {file.name}</DialogTitle>
              <p className="text-2xs text-muted-foreground mt-0.5">上传: {file.uploadDate}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-muted/30 rounded-2xl border border-border p-6">
          <div className="bg-card p-8 shadow-sm rounded-xl border border-border max-w-2xl mx-auto space-y-6">
            <h2 className="text-center font-bold text-lg text-foreground border-b pb-4 border-border">{file.name} 全文内容</h2>
            {chunks.length > 0 ? chunks.map((chunk, idx) => (
              <div key={idx} className="space-y-2">
                <span className="text-2xs font-bold tracking-widest text-muted-foreground block uppercase">【段落片段 #{idx + 1}】</span>
                <p className="text-xs leading-relaxed text-foreground/80 bg-muted/50 p-3 rounded-lg border border-border/50">{chunk.content}</p>
              </div>
            )) : (
              <div className="space-y-4 text-xs text-muted-foreground">
                <p className="font-bold text-primary">《关于该知识文本的大纲概要声明》</p>
                <p>当前为模拟生成的待解析任务，真实的PDF原文尚不包含复杂的文本片段。</p>
                <p>如果是通过"添加文件"刚刚导入的新列表项，解析完成后此全文本页将自动载入。</p>
              </div>
            )}
            <div className="text-center pt-8 text-xs text-muted-foreground border-t border-border font-bold">- THE END OF DOCUMENT -</div>
          </div>
        </div>

        <div className="pt-4 border-t border-border shrink-0 flex justify-between items-center">
          <span className="text-2xs text-muted-foreground">若需本地修改，请通过下载操作拉取后重写上传</span>
          <Button variant="outline" size="sm" onClick={onClose}>关闭预览</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
