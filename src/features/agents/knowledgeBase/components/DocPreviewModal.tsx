import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Printer,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { downloadDocument, fetchDocumentBlob } from '../api';

export interface DocPreviewFile {
  id: string;
  name: string;
  parser: string;
  initialPage?: number;
}

interface DocPreviewModalProps {
  open: boolean;
  file: DocPreviewFile | null;
  datasetId?: string;
  onClose: () => void;
}

type PreviewMode = 'pdf' | 'docx' | 'excel' | 'markdown' | 'text' | 'image' | 'unsupported';
const imageExtensions = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'svg',
  'tif',
  'tiff',
  'avif',
]);

function extension(file: DocPreviewFile) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && fromName !== file.name.toLowerCase()) return fromName;
  return file.parser.toLowerCase().replace(/^[.]/, '');
}

function previewMode(file: DocPreviewFile): PreviewMode {
  const ext = extension(file);
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
  if (['md', 'markdown'].includes(ext)) return 'markdown';
  if (['txt', 'log', 'json', 'xml', 'yaml', 'yml'].includes(ext)) return 'text';
  if (imageExtensions.has(ext)) return 'image';
  return 'unsupported';
}

function DocxPreview({ blob }: { blob: Blob }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    ref.current.innerHTML = '';
    void renderAsync(blob, ref.current, undefined, { inWrapper: true, breakPages: true }).catch(
      (reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Word 预览失败');
      }
    );
    return () => {
      cancelled = true;
    };
  }, [blob]);
  return error ? (
    <PreviewError message={error} />
  ) : (
    <div
      ref={ref}
      className="h-full overflow-auto bg-muted/30 p-4 [&_.docx-wrapper]:bg-transparent [&_section.docx]:shadow-sm"
    />
  );
}

function ExcelPreview({ blob }: { blob: Blob }) {
  const [sheets, setSheets] = useState<Record<string, string[][]>>({});
  const [active, setActive] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    void blob
      .arrayBuffer()
      .then((buffer) => {
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        const parsed = Object.fromEntries(
          workbook.SheetNames.map((name) => [
            name,
            XLSX.utils
              .sheet_to_json<unknown[]>(workbook.Sheets[name], {
                header: 1,
                raw: false,
                defval: '',
              })
              .slice(0, 2000)
              .map((row) => row.slice(0, 80).map(String)),
          ])
        );
        if (!cancelled) {
          setSheets(parsed);
          setActive(workbook.SheetNames[0] ?? '');
        }
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Excel 预览失败');
      });
    return () => {
      cancelled = true;
    };
  }, [blob]);
  if (error) return <PreviewError message={error} />;
  const rows = sheets[active] ?? [];
  const columns = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex gap-2 p-2 border-b overflow-x-auto">
        {Object.keys(sheets).map((name) => (
          <Button
            key={name}
            size="xs"
            variant={active === name ? 'default' : 'ghost'}
            onClick={() => setActive(name)}
          >
            {name}
          </Button>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        <table className="min-w-full text-xs border-collapse">
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }, (_, columnIndex) => (
                  <td
                    key={columnIndex}
                    className="border border-border px-2 py-1 whitespace-pre-wrap max-w-72"
                  >
                    {row[columnIndex] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TextPreview({ blob, markdown }: { blob: Blob; markdown: boolean }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    void blob
      .text()
      .then((value) => {
        if (!cancelled) setContent(value);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : '文本读取失败');
      });
    return () => {
      cancelled = true;
    };
  }, [blob]);
  if (error) return <PreviewError message={error} />;
  return markdown ? (
    <div className="h-full overflow-auto p-6 prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  ) : (
    <pre className="h-full overflow-auto p-6 text-xs whitespace-pre-wrap font-mono">{content}</pre>
  );
}

function BlobUrlPreview({
  blob,
  mode,
  name,
  page,
  onPageChange,
}: {
  blob: Blob;
  mode: 'pdf' | 'image';
  name: string;
  page?: number;
  onPageChange?: (page: number) => void;
}) {
  const previewBlob = useMemo(
    () => mode === 'pdf' && blob.type !== 'application/pdf'
      ? new Blob([blob], { type: 'application/pdf' })
      : blob,
    [blob, mode],
  );
  const url = useMemo(() => URL.createObjectURL(previewBlob), [previewBlob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  if (mode === 'image')
    return (
      <div className="h-full overflow-auto flex items-center justify-center bg-muted/30 p-4">
        <img src={url} alt={name} className="max-w-full max-h-full object-contain" />
      </div>
    );
  const currentPage = Math.max(1, page ?? 1);
  const src = `${url}#page=${currentPage}`;
  const print = () => {
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    frame.src = url;
    frame.onload = () => {
      frame.contentWindow?.print();
      window.setTimeout(() => frame.remove(), 1000);
    };
    document.body.appendChild(frame);
  };
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            title="上一页"
            disabled={currentPage <= 1}
            onClick={() => onPageChange?.(currentPage - 1)}
          >
            <ChevronLeft size={14} />
          </Button>
          <span className="text-2xs text-muted-foreground">第</span>
          <input
            className="h-7 w-14 rounded border bg-background px-2 text-center text-xs"
            type="number"
            min={1}
            value={currentPage}
            onChange={(event) => onPageChange?.(Math.max(1, Number(event.target.value) || 1))}
          />
          <span className="text-2xs text-muted-foreground">页</span>
          <Button
            variant="ghost"
            size="icon-xs"
            title="下一页"
            onClick={() => onPageChange?.(currentPage + 1)}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => window.open(src, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink size={13} />
            新窗口
          </Button>
          <Button variant="ghost" size="xs" onClick={print}>
            <Printer size={13} />
            打印
          </Button>
        </div>
      </div>
      <embed
        key={currentPage}
        title={name}
        src={src}
        type="application/pdf"
        className="min-h-0 flex-1 w-full border-0 bg-white"
      />
    </div>
  );
}

function PreviewError({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-destructive">
      <AlertCircle size={18} className="mr-2" />
      {message}
    </div>
  );
}

export function DocPreviewModal({ open, file, onClose }: DocPreviewModalProps) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfPage, setPdfPage] = useState(1);
  const mode = file ? previewMode(file) : 'unsupported';

  useEffect(() => {
    if (!open || !file || mode === 'unsupported') return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setBlob(null);
    setPdfPage(Math.max(1, file.initialPage ?? 1));
    void fetchDocumentBlob(file.id)
      .then((value) => {
        if (!cancelled) setBlob(value);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : '预览加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file, mode, open]);

  if (!file) return null;

  const body = loading ? (
    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
      <Loader2 className="animate-spin mr-2" size={18} />
      加载预览...
    </div>
  ) : error ? (
    <PreviewError message={error} />
  ) : mode === 'unsupported' ? (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <AlertCircle size={28} />
      该文件类型暂不支持在线预览，请下载后查看
    </div>
  ) : !blob ? null : mode === 'docx' ? (
    <DocxPreview blob={blob} />
  ) : mode === 'excel' ? (
    <ExcelPreview blob={blob} />
  ) : mode === 'markdown' || mode === 'text' ? (
    <TextPreview blob={blob} markdown={mode === 'markdown'} />
  ) : (
    <BlobUrlPreview
      blob={blob}
      mode={mode}
      name={file.name}
      page={pdfPage}
      onPageChange={setPdfPage}
    />
  );

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-[92vw] h-[88vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 border-b pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm">{file.name}</DialogTitle>
              <p className="mt-1 text-2xs text-muted-foreground">原文预览</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void downloadDocument(file.id, file.name)}
            >
              <Download size={14} />
              下载
            </Button>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border">{body}</div>
      </DialogContent>
    </Dialog>
  );
}
