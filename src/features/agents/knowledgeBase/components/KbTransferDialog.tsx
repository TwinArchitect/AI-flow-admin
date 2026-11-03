import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { exportDatasetArchive, previewDatasetImport, importDatasetArchive, type ArchivePreview, type ArchiveImportResult } from '../api/datasetApi';

interface Props { datasetId: string; datasetName: string; mode: 'import' | 'export'; onClose: () => void; onImported: (result: ArchiveImportResult) => void }

export function KbTransferDialog({ datasetId, datasetName, mode, onClose, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ArchivePreview | null>(null);
  const [includeOriginals, setIncludeOriginals] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inspect = async () => {
    if (!file || busy) return;
    setBusy(true); setError(''); setPreview(null);
    try { setPreview(await previewDatasetImport(datasetId, file)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '预览失败'); }
    finally { setBusy(false); }
  };
  const submit = async () => {
    if (busy || (mode === 'import' && (!file || !preview))) return;
    setBusy(true); setError('');
    try {
      if (mode === 'export') await exportDatasetArchive(datasetId, datasetName, includeOriginals);
      else if (file && preview) onImported(await importDatasetArchive(datasetId, file, preview));
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '操作失败');
      if (mode === 'import') setPreview(null);
    } finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="sm:max-w-xl max-h-[85dvh] overflow-y-auto">
    <DialogHeader><DialogTitle className="flex items-center gap-2">{mode === 'import' ? <Upload size={18} /> : <Download size={18} />}{mode === 'import' ? '导入知识库内容' : '导出知识库内容'}</DialogTitle><DialogDescription>{mode === 'import' ? '目标知识库' : '来源知识库'}：{datasetName}</DialogDescription></DialogHeader>
    {mode === 'export' ? <div className="space-y-4 text-sm leading-6"><p>导出分块全文、标签、关键词、预设问题、位置、文档元数据和关联图片，不包含向量或模型密钥。</p><div className="flex items-start gap-3 rounded-xl border border-border p-4"><Checkbox id="kb-export-originals" checked={includeOriginals} disabled={busy} onCheckedChange={(value) => setIncludeOriginals(value === true)} /><Label htmlFor="kb-export-originals" className="leading-5">包含原始文件，便于导入后下载与预览</Label></div><p className="text-xs text-muted-foreground">请先完成文档解析。单包最多 1000 个文档、100000 个分块，解压内容最多 200 MB。</p></div> : <div className="space-y-4 text-sm leading-6"><p>追加新文档并保留已有分块，使用目标知识库的 Embedding 模型重新生成向量。重复导入会产生副本。</p><div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 space-y-3"><Label htmlFor="kb-archive-file">选择知识库导出包</Label><Input id="kb-archive-file" type="file" accept=".zip,application/zip" disabled={busy} onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(null); setError(''); }} />{file && <p className="break-all text-xs text-muted-foreground">{file.name} · {(file.size / 1024).toFixed(1)} KB</p>}</div>{preview && <section aria-label="内容包校验结果" className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-xs"><p>来源：{preview.sourceName} · {preview.sourceModel || '未记录模型'} · {preview.sourceDimension ?? '未记录'} 维</p><p className="font-semibold">目标：{preview.targetModel} · {preview.targetDimension} 维（已探测）</p><p>{preview.documentCount} 个文档 / {preview.chunkCount} 个分块 / {preview.originalFileCount} 份原始文件</p>{preview.warnings?.map((warning, index) => <p key={index} className="text-muted-foreground">{warning}</p>)}<ul className="list-disc pl-4">{preview.documentNames?.map((name, index) => <li key={index}>{name}</li>)}</ul></section>}</div>}
    {error && <p role="alert" className="text-sm text-destructive break-words">{error}</p>}{busy && <p role="status" className="text-xs text-muted-foreground">{mode === 'export' ? '正在打包下载…' : preview ? '正在提交导入…' : '正在校验内容包及目标模型…'}</p>}
    <DialogFooter><Button variant="outline" disabled={busy} onClick={onClose}>取消</Button>{mode === 'import' && !preview ? <Button disabled={!file || busy} onClick={() => void inspect()}>预览并校验</Button> : <Button disabled={busy} onClick={() => void submit()}>{mode === 'export' ? '下载导出包' : '确认导入并生成向量'}</Button>}</DialogFooter>
  </DialogContent></Dialog>;
}
