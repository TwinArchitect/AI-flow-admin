import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { KBFile } from '../data/kbMock';

interface EditFileModalProps {
  open: boolean;
  file: KBFile | null;
  onClose: () => void;
  onConfirm: (file: KBFile) => void;
}

export function EditFileModal({ open, file, onClose, onConfirm }: EditFileModalProps) {
  const [name, setName] = useState(file?.name ?? '');
  const [parser, setParser] = useState(file?.parser ?? 'General');
  const [metaCount, setMetaCount] = useState(file?.metadataFields ?? 0);

  return (
    <Dialog open={open && Boolean(file)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Settings2 size={18} className="text-primary" />
            <DialogTitle>修改单体文档的解析与元属性</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block ml-1">
              文档名称
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block ml-1">
                解析器
              </label>
              <Select value={parser} onValueChange={setParser}>
                <SelectTrigger className="w-full h-10 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="DeepDOC">DeepDOC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block ml-1">
                元数据(个)
              </label>
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
                if (name.trim() && file) {
                  onConfirm({ ...file, name: name.trim(), parser, metadataFields: metaCount });
                  onClose();
                  toast.success('文件配置更新成功');
                }
              }}
            >
              保存修改
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
