import { format } from 'date-fns';
import { DateTimeRangePicker } from '@/components/ui/date-picker';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Eye, FileArchive, Paperclip, Plus, RefreshCw, Search, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { http } from '@/api/client';
import { ListPageContent, ListPageFooter, ListPageHeader, ListPageLayout } from '@/components/layout/ListPageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '@/stores/auth';
import { downloadFile, fileBase, fileBlob, uploadFiles, voucherCode, type ManagedFile, type UploadMode } from './fileApi';

const initial = { pageNum: 1, pageSize: 10, oldFileName: '', srcVoucherId: '', status: 'all', startTime: '', endTime: '' };
const columns = ['文件名', '类型', '大小', '业务标识', '业务单据', '状态', '上传人', '上传时间', '操作'];
const previewable = new Set(['jpg', 'jpeg', 'png', 'bmp', 'svg', 'pdf', 'gif']);
const uploadActions = [
  { mode: 'single', label: '上传', icon: Upload },
  { mode: 'multi', label: '批量上传', icon: Plus },
  { mode: 'zip', label: '上传 ZIP', icon: FileArchive },
] as const;
const dateValue = (value: string) => value ? value.replace('T', ' ') + (value.length === 16 ? ':00' : '') : undefined;
const nameOf = (file: ManagedFile) => file.oldFileName || file.id;
function fileSize(size?: number) {
  if (size == null) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 ** 2).toFixed(2)} MB`;
}

function Preview({ file, close }: { file: ManagedFile; close: () => void }) {
  const type = file.type?.toLowerCase() ?? '';
  const allowed = previewable.has(type);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    let objectUrl = '';
    const params = new URLSearchParams({ id: file.id, scale: '1027:768' });
    void fileBlob(`online?${params}`, { signal: controller.signal }).then(async blob => {
      if (type === 'pdf') {
        if (await blob.slice(0, 5).text() !== '%PDF-') throw new Error('预览服务未返回有效 PDF');
        blob = blob.slice(0, blob.size, 'application/pdf');
      }
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [allowed, file.id, type]);
  return <Dialog open onOpenChange={open => { if (!open) close(); }}>
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader><DialogTitle className="break-all">{nameOf(file)}</DialogTitle><DialogDescription>附件预览</DialogDescription></DialogHeader>
      <div className="flex min-h-60 items-center justify-center">
        {!allowed ? <p>该文件类型不支持在线预览，请下载后查看</p>
          : error ? <p role="alert" className="text-sm text-destructive">{error}</p>
          : !url ? <p className="text-sm text-muted-foreground">正在加载预览…</p>
          : type === 'pdf' ? <iframe src={url} title={nameOf(file)} className="h-[60vh] w-full rounded-lg" />
          : <img src={url} alt={nameOf(file)} className="max-h-[60vh] max-w-full object-contain" onError={() => setError('图片预览失败')} />}
      </div>
    </DialogContent>
  </Dialog>;
}

export function AttachmentManagementPage() {
  const tenant = useAuthStore(state => state.tenantId);
  const inputs = useRef<Partial<Record<UploadMode, HTMLInputElement | null>>>({});
  const [query, setQuery] = useState(initial);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [uploadStatus, setUploadStatus] = useState('1');
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string[]>([]);
  const [preview, setPreview] = useState<ManagedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [upload, setUpload] = useState<{ label: string; percent: number } | null>(null);
  const [uploadError, setUploadError] = useState('');
  const list = useQuery({
    queryKey: ['managed-attachments', tenant, query],
    queryFn: async () => (await http.post<{ records: ManagedFile[]; total: number }>(`${fileBase}/getFiletByParams`, {
      pageNum: query.pageNum, pageSize: query.pageSize, srcVoucherCode: voucherCode,
      oldFileName: query.oldFileName || undefined, srcVoucherId: query.srcVoucherId || undefined,
      status: query.status === 'all' ? [0, 1] : [Number(query.status)],
      startTime: dateValue(query.startTime), endTime: dateValue(query.endTime),
    })).data,
  });
  const rows = list.data?.records ?? [];
  const ids = rows.filter(file => selected.includes(file.id)).map(file => file.id);
  const total = list.data?.total ?? 0;
  function changeQuery(values: Partial<typeof initial>) {
    setSelected([]);
    setQuery(previous => ({ ...previous, ...values }));
  }
  async function refresh() {
    setSelected([]);
    const result = await list.refetch();
    if (!result.data) return;
    const last = Math.max(1, Math.ceil(result.data.total / query.pageSize));
    if (query.pageNum > last) changeQuery({ pageNum: last });
  }
  async function run(task: () => Promise<void>) {
    if (busy || upload) return;
    setBusy(true);
    try { await task(); }
    catch (error) { toast.error(error instanceof Error ? error.message : '操作失败'); }
    finally { setBusy(false); }
  }
  async function changeStatus(status: number, fileId?: string) {
    const endpoint = fileId ? 'updateStatus' : 'batchUpdateStatus';
    const params = new URLSearchParams(fileId ? { id: fileId } : { ids: ids.join(',') });
    params.set('status', String(status));
    const result = await http.get(`${fileBase}/${endpoint}?${params}`);
    if (result.data === false || result.data === 0) throw new Error('状态更新失败');
    await refresh();
  }
  async function startUpload(files: File[], mode: UploadMode, label: string) {
    if (busy || upload || !files.length) return;
    setUploadError('');
    setUpload({ label: `${label} · ${files.length === 1 ? files[0].name : `${files.length} 个文件`}`, percent: 0 });
    try {
      await uploadFiles(files, mode, group.trim() || tenant || 'default', uploadStatus, percent => {
        setUpload(previous => previous && { ...previous, percent });
      });
      toast.success('上传成功');
      await refresh();
    } catch (error) { setUploadError(error instanceof Error ? error.message : '上传失败'); }
    finally { setUpload(null); }
  }

  const locked = busy || !!upload;
  return <ListPageLayout scrollMode="table">
    <ListPageHeader>
      <header className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary-text"><Paperclip size={20} /></span>
        <h1 className="text-base font-semibold">附件管理</h1>
      </header>
      <form className="flex flex-wrap items-center gap-2" onSubmit={event => {
        event.preventDefault();
        if (query.pageNum === 1 && query.oldFileName === search.trim()) void refresh();
        else changeQuery({ oldFileName: search.trim(), pageNum: 1 });
      }}>
        <Input aria-label="搜索文件名" placeholder="搜索文件名" className="w-44" value={search} onChange={event => setSearch(event.target.value)} />
        <Input aria-label="业务单据 ID" placeholder="业务单据 ID" className="w-36" value={query.srcVoucherId} onChange={event => changeQuery({ srcVoucherId: event.target.value, pageNum: 1 })} />
        <Select value={query.status} onValueChange={status => changeQuery({ status, pageNum: 1 })}>
          <SelectTrigger aria-label="附件状态" className="w-auto min-w-36 shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">全部状态</SelectItem><SelectItem value="1">正式</SelectItem><SelectItem value="0">临时</SelectItem></SelectContent>
        </Select>
        <DateTimeRangePicker
          placeholder="上传时间范围"
          className="h-9 w-64 max-w-full"
          value={{
            from: query.startTime ? new Date(query.startTime) : undefined,
            to: query.endTime ? new Date(query.endTime) : undefined,
          }}
          onChange={range => changeQuery({
            startTime: range?.from ? format(range.from, "yyyy-MM-dd'T'HH:mm") : '',
            endTime: range?.to ? format(range.to, "yyyy-MM-dd'T'HH:mm") : '',
            pageNum: 1,
          })}
        />
        <Button type="submit" size="sm" variant="outline" disabled={locked}><Search size={14} />查询</Button>
        <Button type="button" size="sm" variant="outline" disabled={locked} onClick={() => { setSearch(''); changeQuery(initial); }}>重置</Button>
        <Button type="button" size="sm" variant="outline" disabled={locked || list.isFetching} onClick={() => void refresh()}><RefreshCw size={14} />刷新</Button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm">上传分组 ID
          <Input className="w-36" value={group} placeholder={tenant || 'default'} disabled={locked} onChange={event => setGroup(event.target.value)} />
        </label>
        <Select value={uploadStatus} onValueChange={setUploadStatus} disabled={locked}>
          <SelectTrigger aria-label="上传状态" className="w-auto min-w-36 shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="1">正式上传</SelectItem><SelectItem value="0">临时上传</SelectItem></SelectContent>
        </Select>
        {ids.length > 0 && <>
          <Button size="sm" variant="outline" disabled={locked || list.isFetching} onClick={() => void run(() => downloadFile('zip/download?toPdf=0', `attachments-${Date.now()}.zip`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ids),
          }))}><FileArchive size={14} />打包下载</Button>
          <Button size="sm" variant="outline" disabled={locked || list.isFetching} onClick={() => void run(() => changeStatus(1))}>标记正式</Button>
          <Button size="sm" variant="outline" disabled={locked || list.isFetching} onClick={() => void run(() => changeStatus(0))}>标记临时</Button>
          <Button size="sm" variant="outline" tone="danger" disabled={locked || list.isFetching} onClick={() => setDeleting(ids)}><Trash2 size={14} />批量删除</Button>
        </>}
        <div className="ml-auto flex flex-wrap gap-2">
          {uploadActions.map(({ mode, label, icon: Icon }) => <div key={mode}>
            <input type="file" className="hidden" multiple={mode === 'multi'} accept={mode === 'zip' ? '.zip' : undefined}
              ref={element => { inputs.current[mode] = element; }}
              onChange={event => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = '';
                void startUpload(files, mode, label);
              }} />
            <Button size="sm" variant={mode === 'zip' ? 'default' : 'outline'} disabled={locked} onClick={() => inputs.current[mode]?.click()}><Icon size={14} />{label}</Button>
          </div>)}
        </div>
      </div>
      {upload && <div className="space-y-1 text-xs"><p>{upload.label} · {upload.percent === 100 ? '服务端处理中…' : `${upload.percent}%`}</p>
        <progress className="h-2 w-full accent-primary" max={100} value={upload.percent} aria-label="附件上传进度" />
      </div>}
      {(uploadError || list.error) && <p role="alert" className="text-sm text-destructive">{uploadError || list.error?.message}</p>}
    </ListPageHeader>
    <ListPageContent>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <Table scrollable className="min-w-[960px]" aria-label="附件列表">
          <TableHeader><TableRow>
            <TableHead className="w-10"><Checkbox aria-label="选择本页全部附件" disabled={locked || list.isFetching || !rows.length}
              checked={ids.length > 0 && (ids.length === rows.length || 'indeterminate')}
              onCheckedChange={checked => setSelected(checked === true ? rows.map(file => file.id) : [])} /></TableHead>
            {columns.map(column => <TableHead key={column}>{column}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>
            {rows.map(file => {
              const temporary = Number(file.status) === 0;
              return <TableRow key={file.id}>
                <TableCell><Checkbox aria-label={`选择 ${nameOf(file)}`} disabled={locked || list.isFetching} checked={ids.includes(file.id)}
                  onCheckedChange={checked => setSelected(previous => checked === true ? [...previous, file.id] : previous.filter(id => id !== file.id))} /></TableCell>
                <TableCell><button type="button" title={nameOf(file)} className="block max-w-52 truncate text-left font-medium hover:underline" onClick={() => setPreview(file)}>{nameOf(file)}</button></TableCell>
                <TableCell><Badge variant="info">{file.type?.toUpperCase() || '—'}</Badge></TableCell>
                <TableCell>{fileSize(file.size)}</TableCell>
                <TableCell>{file.srcVoucherCode || '—'}</TableCell>
                <TableCell className="font-mono text-xs">{file.srcVoucherId || '—'}</TableCell>
                <TableCell><Badge asChild variant={temporary ? 'warning' : 'success'}>
                  <button type="button" title="点击切换状态" disabled={locked} onClick={() => void run(() => changeStatus(temporary ? 1 : 0, file.id))}>{temporary ? '临时' : '正式'}</button>
                </Badge></TableCell>
                <TableCell>{file.username || file.creator || '—'}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{file.createTime || '—'}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button variant="ghost" tone="brand" size="icon-xs" title="预览" aria-label={`预览 ${nameOf(file)}`} onClick={() => setPreview(file)}><Eye size={14} /></Button>
                  <Button variant="ghost" tone="brand" size="icon-xs" title="下载" aria-label={`下载 ${nameOf(file)}`} disabled={locked}
                    onClick={() => void run(() => downloadFile(`download?id=${encodeURIComponent(file.id)}`, nameOf(file)))}><Download size={14} /></Button>
                  <Button variant="ghost" tone="danger" size="icon-xs" title="删除" aria-label={`删除 ${nameOf(file)}`} disabled={locked}
                    onClick={() => setDeleting([file.id])}><Trash2 size={14} /></Button>
                </div></TableCell>
              </TableRow>;
            })}
            {!rows.length && <TableRow><TableCell colSpan={10} className="h-40 text-center text-muted-foreground">{list.isPending ? '正在加载附件…' : list.isError ? '附件加载失败' : '暂无附件'}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </ListPageContent>
    <ListPageFooter>
      <Pagination page={query.pageNum} pageSize={query.pageSize} pageCount={Math.max(1, Math.ceil(total / query.pageSize))} total={total}
        disabled={locked || list.isFetching} onPageChange={pageNum => changeQuery({ pageNum })}
        onPageSizeChange={pageSize => changeQuery({ pageSize, pageNum: 1 })} />
    </ListPageFooter>
    {preview && <Preview key={preview.id} file={preview} close={() => setPreview(null)} />}
    {!!deleting.length && <Dialog open onOpenChange={open => { if (!open && !busy) setDeleting([]); }}>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader><DialogTitle>确认删除</DialogTitle><DialogDescription>确定删除选中的 {deleting.length} 个附件吗？</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setDeleting([])}>取消</Button>
          <Button variant="destructive" disabled={busy} onClick={() => void run(async () => {
            const params = new URLSearchParams({ type: 'id', id: deleting.join(',') });
            const result = await http.post(`${fileBase}/delete?${params}`);
            if (result.data === false) throw new Error('删除失败');
            setDeleting([]);
            await refresh();
          })}>删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>}
  </ListPageLayout>;
}
