import { useEffect, useRef, useState } from 'react';
import { Database, FileDown, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AddFileModalProps {
  open: boolean;
  onClose: () => void;
  submitting?: boolean;
  progress?: { done: number; total: number; fileName: string } | null;
  onConfirm: (files: File[]) => void;
}

function shortenFileName(name: string, maxLength = 34) {
  if (name.length <= maxLength) return name;
  const dotIndex = name.lastIndexOf('.');
  const extension = dotIndex > 0 ? name.slice(dotIndex) : '';
  const prefixLength = Math.max(12, maxLength - extension.length - 1);
  return `${name.slice(0, prefixLength)}…${extension}`;
}

const supportedExtensions = ['pdf', 'doc', 'docx', 'wps', 'xlsx', 'xls', 'txt', 'md', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tif', 'tiff', 'ico', 'heic', 'heif', 'avif'];
const maxFileSize = 1024 ** 3;

function getFileExtension(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 ** 2).toFixed(1)} MB`;
}

export function AddFileModal({ open, onClose, onConfirm, submitting = false, progress }: AddFileModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open || submitting) return;
    setFiles([]);
    if (inputRef.current) inputRef.current.value = '';
  }, [open, submitting]);
  const appendFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const accepted: File[] = [];
    const unsupported: string[] = [];
    const oversized: string[] = [];
    Array.from(incoming).forEach((file) => {
      if (!supportedExtensions.includes(getFileExtension(file.name))) unsupported.push(file.name);
      else if (file.size > maxFileSize) oversized.push(file.name);
      else accepted.push(file);
    });
    if (unsupported.length) toast.warning(`不支持的文件类型：${unsupported.join('、')}`);
    if (oversized.length) toast.warning(`以下文件超过 1GB：${oversized.join('、')}`);
    if (!accepted.length) return;
    setFiles((current) => {
      const next = [...current];
      accepted.forEach((file) => {
        if (!next.some((item) => item.name === file.name && item.size === file.size)) next.push(file);
      });
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Database size={18} className="text-primary" />
            <DialogTitle>批量上传文档到知识库</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <input ref={inputRef} type="file" multiple accept={supportedExtensions.map((extension) => `.${extension}`).join(',')} className="hidden" onChange={(event) => appendFiles(event.target.files)} />
          <div
            className="border border-dashed border-border rounded-2xl p-6 bg-muted/30 text-center flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => !submitting && inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); if (!submitting) appendFiles(event.dataTransfer.files); }}
          >
            <FileDown size={32} className="text-primary animate-bounce" />
            <p className="text-xs font-bold text-foreground/70">{files.length ? `已选择 ${files.length} 个文件，可继续添加` : '点击选择或拖拽多个文件到此处'}</p>
            <p className="text-2xs text-muted-foreground">支持 {supportedExtensions.join(', ')}，单文件最大 1GB</p>
          </div>
          {files.map((file, index) => (
            <div key={`${file.name}-${file.size}`} className="flex w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-lg border px-3 py-2 text-xs">
              <span className="min-w-0 flex-1 truncate" title={file.name}>{shortenFileName(file.name)}</span>
              <span className="shrink-0 text-2xs text-muted-foreground">{formatFileSize(file.size)}</span>
              <Button className="shrink-0" variant="ghost" size="icon-xs" disabled={submitting} onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}><X size={13} /></Button>
            </div>
          ))}
          {submitting && progress && <p className="w-full truncate text-xs text-muted-foreground" title={progress.fileName}>上传中 {Math.min(progress.done + 1, progress.total)}/{progress.total}{progress.fileName ? ` · ${shortenFileName(progress.fileName)}` : ''}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" disabled={submitting} onClick={onClose}>
              取消
            </Button>
            <Button
              className="flex-1"
              disabled={submitting || files.length === 0}
              onClick={() => files.length ? onConfirm(files) : toast.error('请选择文件')}
            >
              {submitting ? '上传中...' : `开始上传${files.length ? ` (${files.length})` : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
