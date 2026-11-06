import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { http } from '@/api/client';
import { ListPageHeader, ListPageContent, ListPageLayout } from '@/components/layout/ListPageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/auth';

type Dict = { id: string; dictCode: string; dictName: string; dictRemark?: string; sort?: number };
type Detail = { id: string; name: string; value: string; remark?: string; sort?: number; hidden?: number };
type Editor = { kind: 'dict'; item?: Dict } | { kind: 'detail'; dictId: string; item?: Detail };
type Deletion = { kind: 'dict'; item: Dict } | { kind: 'detail'; ids: string[] };
type Page<T> = { records: T[]; total: number };
const base = '/gpt/auth/dict';
const initialPage = { pageNum: 1, pageSize: 10 };

function DictionaryEditor({ editor, busy, close, save }: {
  editor: Editor; busy: boolean; close: () => void; save: (values: Record<string, unknown>) => void;
}) {
  const dict = editor.kind === 'dict' ? editor.item : undefined;
  const detail = editor.kind === 'detail' ? editor.item : undefined;
  const isDetail = editor.kind === 'detail';
  const [hidden, setHidden] = useState(String(detail?.hidden ?? 0));
  const fields = isDetail
    ? [['name', '显示名称', detail?.name, '下拉展示文案，如 客服'], ['value', '数据值', detail?.value, '实际存储值，如 customer_service']]
    : [['dictCode', '字典编码', dict?.dictCode, '如 demo_agent_tag'], ['dictName', '字典名称', dict?.dictName, '如 智能体标签']];
  return <Dialog open onOpenChange={open => { if (!open && !busy) close(); }}>
    <DialogContent className="sm:max-w-xl" showCloseButton={!busy}>
      <DialogHeader>
        <DialogTitle>{editor.item ? '编辑' : '新增'}{isDetail ? '字典项' : '字典'}</DialogTitle>
        <DialogDescription>填写{isDetail ? '字典项' : '字典'}信息并保存</DialogDescription>
      </DialogHeader>
      <form id="dictionary-editor" onSubmit={event => {
        event.preventDefault();
        if (busy) return;
        const data = new FormData(event.currentTarget);
        const get = (key: string) => String(data.get(key) ?? '').trim();
        const required = fields.map(([key]) => key!);
        if (required.some(key => !get(key))) { toast.error('请填写必填项'); return; }
        save({
          ...Object.fromEntries(required.map(key => [key, get(key)])),
          sort: Number(get('sort') || (isDetail ? 0 : 1)),
          ...(editor.kind === 'detail' ? { dictId: editor.dictId, remark: get('remark'), hidden: Number(hidden) } : { dictRemark: get('remark') }),
          ...(editor.item ? { id: editor.item.id } : { createTime: new Date().toLocaleString('sv-SE') }),
        });
      }}>
        <fieldset disabled={busy} className="space-y-4">
          {fields.map(([key, label, value, placeholder]) => <div key={key} className="space-y-2">
            <Label htmlFor={`dict-${key}`}>{label}</Label>
            <Input id={`dict-${key}`} name={key} defaultValue={value} placeholder={placeholder} required />
          </div>)}
          <div className={isDetail ? 'grid grid-cols-2 gap-4' : ''}>
            <div className="space-y-2"><Label htmlFor="dict-sort">排序</Label>
              <Input id="dict-sort" name="sort" type="number" min={0} defaultValue={editor.item?.sort ?? (isDetail ? 0 : 1)} />
            </div>
            {isDetail && <div className="space-y-2"><Label id="dict-hidden-label">是否隐藏</Label>
              <Select value={hidden} onValueChange={setHidden} disabled={busy}>
                <SelectTrigger aria-labelledby="dict-hidden-label" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="0">显示</SelectItem><SelectItem value="1">隐藏</SelectItem></SelectContent>
              </Select>
            </div>}
          </div>
          <div className="space-y-2"><Label htmlFor="dict-remark">备注</Label>
            <Textarea id="dict-remark" name="remark" rows={3} className="resize-none" placeholder="可选备注" defaultValue={detail?.remark ?? dict?.dictRemark} />
          </div>
        </fieldset>
      </form>
      <DialogFooter><Button variant="outline" disabled={busy} onClick={close}>取消</Button>
        <Button type="submit" form="dictionary-editor" disabled={busy}>保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

export function DictManagementPage() {
  const tenant = useAuthStore(state => state.tenantId);
  const client = useQueryClient();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState({ ...initialPage, dictName: '' });
  const [detailPage, setDetailPage] = useState({ ...initialPage, dictId: '' });
  const [selectedId, setSelectedId] = useState('');
  const [checked, setChecked] = useState<string[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<Deletion | null>(null);
  const [busy, setBusy] = useState(false);
  const dictionaries = useQuery({
    queryKey: ['system-dictionaries', tenant, query],
    queryFn: async () => (await http.post<Page<Dict>>(`${base}/query`, { ...query, dictName: query.dictName || undefined })).data,
  });
  const records = dictionaries.data?.records ?? [];
  const selected = records.find(dict => dict.id === selectedId) ?? records[0];
  const detailQuery = {
    pageNum: detailPage.dictId === selected?.id ? detailPage.pageNum : 1,
    pageSize: detailPage.pageSize,
  };
  const details = useQuery({
    queryKey: ['system-dictionary-details', tenant, selected?.id, detailQuery],
    enabled: !!selected,
    queryFn: async () => (await http.post<Page<Detail>>(`${base}/detail/query`, { ...detailQuery, dictId: selected?.id })).data,
  });
  const items = details.data?.records ?? [];
  const selectedItems = items.filter(item => checked.includes(item.id)).map(item => item.id);
  const error = dictionaries.error || details.error;

  function changeDictQuery(next: Partial<typeof query>) {
    setQuery(previous => ({ ...previous, ...next }));
    setDetailPage(previous => ({ ...previous, pageNum: 1 }));
    setChecked([]);
  }
  function changeDetailQuery(next: Partial<typeof detailQuery>, dictId = selected?.id ?? '') {
    setDetailPage({ ...detailQuery, ...next, dictId });
    setChecked([]);
  }
  async function mutate(kind: Editor['kind'], action: string, payload: Record<string, unknown> | string[]) {
    if (busy) return;
    setBusy(true);
    try {
      const response = await http.post(`${base}${kind === 'detail' ? '/detail' : ''}/${action}`, payload);
      if (response.data === false || response.data === 0) throw new Error('操作未写入数据');
      setEditor(null);
      setDeleting(null);
      setChecked([]);
      if (kind === 'dict') {
        const result = await dictionaries.refetch();
        if (action === 'deleteBatch' && Array.isArray(payload)) {
          for (const id of payload) {
            client.removeQueries({ queryKey: ['system-dictionary-details', tenant, id] });
          }
        }
        const last = Math.max(1, Math.ceil((result.data?.total ?? 0) / query.pageSize));
        if (result.data && query.pageNum > last) changeDictQuery({ pageNum: last });
        else if (action === 'deleteBatch') changeDetailQuery({ pageNum: 1 });
      } else {
        const result = await details.refetch();
        const last = Math.max(1, Math.ceil((result.data?.total ?? 0) / detailQuery.pageSize));
        if (result.data && detailQuery.pageNum > last) changeDetailQuery({ pageNum: last });
      }
      toast.success('操作成功');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally { setBusy(false); }
  }

  return <ListPageLayout scrollMode="table">
    <ListPageHeader>
      <header className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary-text"><BookOpen size={20} /></span>
        <h1 className="text-base font-semibold">字典管理</h1>
      </header>
      {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}
    </ListPageHeader>
    <ListPageContent>
      <div className="grid min-h-0 flex-1 grid-rows-2 gap-4 lg:grid-cols-[minmax(320px,1fr)_minmax(0,2fr)] lg:grid-rows-1">
        <section aria-label="字典" className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <form className="shrink-0 space-y-2 border-b border-border p-3" onSubmit={event => {
            event.preventDefault();
            const dictName = input.trim();
            if (dictName === query.dictName && query.pageNum === 1) void dictionaries.refetch();
            else changeDictQuery({ dictName, pageNum: 1 });
          }}>
            <Input aria-label="搜索名称或编码" placeholder="搜索名称或编码" value={input} onChange={event => setInput(event.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" type="submit" disabled={busy}><Search size={14} />查询</Button>
              <Button size="sm" variant="outline" type="button" disabled={busy || dictionaries.isFetching} onClick={() => void dictionaries.refetch()}><RefreshCw size={14} />刷新</Button>
              <Button size="sm" type="button" disabled={busy} onClick={() => setEditor({ kind: 'dict' })}><Plus size={14} />新增</Button>
            </div>
          </form>
          <Table scrollable aria-label="字典列表">
            <TableHeader><TableRow>{['编码', '名称', '操作'].map(column => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {records.map(dict => <TableRow key={dict.id} data-state={selected?.id === dict.id ? 'selected' : undefined}
                className="cursor-pointer" onClick={() => { setSelectedId(dict.id); changeDetailQuery({ pageNum: 1 }, dict.id); }}>
                <TableCell className="font-mono text-xs">{dict.dictCode}</TableCell>
                <TableCell><button type="button" aria-pressed={selected?.id === dict.id} className="text-left font-medium">{dict.dictName}</button></TableCell>
                <TableCell onClick={event => event.stopPropagation()}><div className="flex gap-1">
                  <Button variant="ghost" tone="brand" size="icon-xs" aria-label={`编辑字典 ${dict.dictName}`} disabled={busy} onClick={() => setEditor({ kind: 'dict', item: dict })}><Pencil size={14} /></Button>
                  <Button variant="ghost" tone="danger" size="icon-xs" aria-label={`删除字典 ${dict.dictName}`} disabled={busy} onClick={() => setDeleting({ kind: 'dict', item: dict })}><Trash2 size={14} /></Button>
                </div></TableCell>
              </TableRow>)}
              {!records.length && <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">{dictionaries.isPending ? '正在加载字典…' : dictionaries.isError ? '字典加载失败' : '暂无字典数据'}</TableCell></TableRow>}
            </TableBody>
          </Table>
          <div className="shrink-0 border-t border-border p-2">
            <Pagination page={query.pageNum} pageSize={query.pageSize} pageCount={Math.max(1, Math.ceil((dictionaries.data?.total ?? 0) / query.pageSize))}
              total={dictionaries.data?.total ?? 0} disabled={busy || dictionaries.isFetching}
              onPageChange={pageNum => changeDictQuery({ pageNum })} onPageSizeChange={pageSize => changeDictQuery({ pageSize, pageNum: 1 })} />
          </div>
        </section>
        <section aria-label="字典项" className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border p-3">
            <div><h2 className="text-sm font-semibold">{selected ? `字典项 · ${selected.dictName}` : '字典项'}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{selected ? `编码 ${selected.dictCode}，下拉展示 name，提交 value` : '请先在左侧选择字典'}</p>
            </div>
            <div className="flex gap-2">
              {selectedItems.length > 0 && <Button size="sm" variant="outline" tone="danger" disabled={busy || details.isFetching}
                onClick={() => setDeleting({ kind: 'detail', ids: selectedItems })}><Trash2 size={14} />批量删除</Button>}
              <Button size="sm" disabled={!selected || busy} onClick={() => selected && setEditor({ kind: 'detail', dictId: selected.id })}><Plus size={14} />新增子项</Button>
            </div>
          </header>
          {selected ? <>
            <Table scrollable className="min-w-[550px]" aria-label="字典项列表">
              <TableHeader><TableRow><TableHead className="w-10" />
                {['名称', '数据值', '排序', '备注', '隐藏', '操作'].map(column => <TableHead key={column}>{column}</TableHead>)}
              </TableRow></TableHeader>
              <TableBody>
                {items.map(item => <TableRow key={item.id}>
                  <TableCell><Checkbox aria-label={`选择 ${item.name}`} disabled={busy || details.isFetching} checked={selectedItems.includes(item.id)}
                    onCheckedChange={value => setChecked(previous => value === true ? [...previous, item.id] : previous.filter(id => id !== item.id))} /></TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="font-mono text-xs">{item.value}</TableCell>
                  <TableCell>{item.sort ?? '—'}</TableCell>
                  <TableCell className="max-w-32 truncate" title={item.remark}>{item.remark || '—'}</TableCell>
                  <TableCell><Badge variant={Number(item.hidden ?? 0) === 0 ? 'success' : 'muted'}>{Number(item.hidden ?? 0) === 0 ? '显示' : '隐藏'}</Badge></TableCell>
                  <TableCell><div className="flex gap-1">
                    <Button variant="ghost" tone="brand" size="icon-xs" aria-label={`编辑字典项 ${item.name}`} disabled={busy} onClick={() => setEditor({ kind: 'detail', dictId: selected.id, item })}><Pencil size={14} /></Button>
                    <Button variant="ghost" tone="danger" size="icon-xs" aria-label={`删除字典项 ${item.name}`} disabled={busy} onClick={() => setDeleting({ kind: 'detail', ids: [item.id] })}><Trash2 size={14} /></Button>
                  </div></TableCell>
                </TableRow>)}
                {!items.length && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">{details.isPending ? '正在加载字典项…' : details.isError ? '字典项加载失败' : '暂无字典项'}</TableCell></TableRow>}
              </TableBody>
            </Table>
            <div className="shrink-0 border-t border-border p-2">
              <Pagination page={detailQuery.pageNum} pageSize={detailQuery.pageSize} pageCount={Math.max(1, Math.ceil((details.data?.total ?? 0) / detailQuery.pageSize))}
                total={details.data?.total ?? 0} disabled={busy || details.isFetching}
                onPageChange={pageNum => changeDetailQuery({ pageNum })} onPageSizeChange={pageSize => changeDetailQuery({ pageSize, pageNum: 1 })} />
            </div>
          </> : <p className="py-10 text-center text-sm text-muted-foreground">请先选择左侧字典</p>}
        </section>
      </div>
    </ListPageContent>
    {editor && <DictionaryEditor editor={editor} busy={busy} close={() => setEditor(null)}
      save={values => void mutate(editor.kind, editor.item ? 'update' : 'save', values)} />}
    {deleting && <Dialog open onOpenChange={open => { if (!open && !busy) setDeleting(null); }}>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader><DialogTitle>确认删除</DialogTitle>
          <DialogDescription>{deleting.kind === 'dict'
            ? `确定删除字典「${deleting.item.dictName}」吗？此操作也会删除该字典下的所有子项。`
            : `确定删除选中的 ${deleting.ids.length} 个字典项吗？`}</DialogDescription>
        </DialogHeader>
        <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>取消</Button>
          <Button variant="destructive" disabled={busy} onClick={() => void mutate(deleting.kind, 'deleteBatch', deleting.kind === 'dict' ? [deleting.item.id] : deleting.ids)}>删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>}
  </ListPageLayout>;
}
