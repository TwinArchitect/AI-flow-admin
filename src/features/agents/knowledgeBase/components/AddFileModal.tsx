import { useState } from 'react';
import { Database, FileDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface AddFileModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string, parser: string, metaCount: number) => void;
}

export function AddFileModal({ open, onClose, onConfirm }: AddFileModalProps) {
  const [name, setName] = useState('');
  const [parser, setParser] = useState('General');
  const [metaCount, setMetaCount] = useState(0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Database size={18} className="text-primary" />
            <DialogTitle>上传物理文档到当前资源索引集群</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border border-dashed border-border rounded-2xl p-6 bg-muted/30 text-center flex flex-col items-center gap-2">
            <FileDown size={32} className="text-primary animate-bounce" />
            <p className="text-xs font-bold text-foreground/70">拖拽源文件到此处，或点击浏览</p>
            <p className="text-2xs text-muted-foreground">支持 PDF, DOCX, XLSX 最大 150MB</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block ml-1">
              拟定索引文件名
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: 汽轮机标准.pdf"
              className="h-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block ml-1">
                解析器
              </Label>
              <Select value={parser} onValueChange={setParser}>
                <SelectTrigger className="w-full h-10 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General (内置通用排版)</SelectItem>
                  <SelectItem value="DeepDOC">DeepDOC (精准图片版面识别)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block ml-1">
                元数据标签(个)
              </Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={metaCount}
                onChange={(e) => setMetaCount(+e.target.value)}
                className="h-10"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              取消
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (name.trim()) {
                  onConfirm(name.trim(), parser, metaCount);
                  onClose();
                } else toast.error('请输入文件名');
              }}
            >
              开始同步建档
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
