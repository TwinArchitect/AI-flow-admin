import { useEffect, useState } from 'react';
import { Info, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getDocument } from '../api';
import type { KBFile } from '../data/kbMock';
import type { DocumentDetail } from '../types';

interface DocumentMetadataModalProps {
  open: boolean;
  file: KBFile | null;
  onClose: () => void;
}

function formatFileSize(size?: number) {
  if (!size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return `${(size / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function valueOf(value: unknown) {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function rowsOf(detail: DocumentDetail) {
  const rows: Array<[string, unknown]> = [
    ['文档 ID', detail.id], ['文件名', detail.fileName], ['文件类型', detail.fileType],
    ['文件大小', formatFileSize(detail.fileSize)], ['MD5', detail.fileMd5], ['存储路径', detail.filePath],
    ['知识库 ID', detail.datasetId], ['状态', detail.status], ['版本', detail.currentVersion],
    ['分块数', detail.chunkCount], ['检索开关', detail.searchEnabled === false ? '关闭' : '开启'],
    ['解析进度', detail.progressPercent != null ? `${detail.progressPercent}%${detail.progressMessage ? ` · ${detail.progressMessage}` : ''}` : detail.progressMessage],
    ['任务状态', detail.taskStatus], ['重试次数', detail.retryCount],
    ['错误信息', detail.errorMessage || detail.taskError], ['创建人', detail.creator],
    ['创建时间', detail.createTime],
  ];
  Object.entries(detail.metadata ?? {}).forEach(([key, value]) => rows.push([`metadata.${key}`, value]));
  return rows;
}

export function DocumentMetadataModal({ open, file, onClose }: DocumentMetadataModalProps) {
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open || !file) return;
    let cancelled = false;
    setLoading(true); setError(''); setDetail(null);
    void getDocument(file.id)
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : '加载元数据失败'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [file, open]);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="flex max-h-[82vh] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader className="border-b pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <Info size={16} className="shrink-0 text-primary" />
            <div className="min-w-0"><DialogTitle className="text-sm">元数据</DialogTitle><p className="mt-0.5 truncate text-2xs text-muted-foreground">{detail?.fileName || file?.name}</p></div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4">
          {loading ? <div className="py-16 text-center text-xs text-muted-foreground"><Loader2 size={14} className="mr-1.5 inline animate-spin" />加载元数据...</div>
            : error ? <p className="py-12 text-center text-sm text-destructive">{error}</p>
              : detail && <dl className="divide-y overflow-hidden rounded-xl border">{rowsOf(detail).map(([label, value]) => <div key={String(label)} className="grid grid-cols-[108px_1fr] gap-3 px-3.5 py-2.5 hover:bg-muted/40"><dt className="text-2xs font-bold text-muted-foreground">{label}</dt><dd className="break-all whitespace-pre-wrap text-xs leading-relaxed text-foreground">{valueOf(value)}</dd></div>)}</dl>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
