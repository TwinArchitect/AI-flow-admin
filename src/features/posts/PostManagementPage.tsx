import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { http } from '@/api/client';
import { ListPageContent, ListPageFooter, ListPageHeader, ListPageLayout } from '@/components/layout/ListPageLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/auth';

type Post = { id: string; name: string; code: string; sort?: number; description?: string; createTime?: string };
const base = '/gpt/auth/post';
const columns = ['岗位名称', '岗位编码', '排序', '描述', '创建时间', '操作'];

function PostEditor({ post, busy, close, save }: {
  post: Post | null; busy: boolean; close: () => void; save: (values: Omit<Post, 'id'>) => void;
}) {
  return <Dialog open onOpenChange={open => { if (!open && !busy) close(); }}>
    <DialogContent className="sm:max-w-xl" showCloseButton={!busy}>
      <DialogHeader><DialogTitle>{post ? '编辑岗位' : '新增岗位'}</DialogTitle><DialogDescription>填写岗位信息并保存</DialogDescription></DialogHeader>
      <form id="post-editor" onSubmit={event => {
        event.preventDefault();
        if (busy) return;
        const data = new FormData(event.currentTarget);
        const read = (key: string) => String(data.get(key) ?? '').trim();
        const name = read('name');
        const code = read('code');
        if (!name || !code) { toast.error('请输入岗位名称和编码'); return; }
        save({ name, code, sort: Number(read('sort') || 1), description: read('description') });
      }}>
        <fieldset disabled={busy} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="post-name">岗位名称</Label>
            <Input id="post-name" name="name" required maxLength={128} defaultValue={post?.name} placeholder="如 研发工程师" />
          </div>
          <div className="space-y-2"><Label htmlFor="post-code">岗位编码</Label>
            <Input id="post-code" name="code" required maxLength={64} defaultValue={post?.code} placeholder="如 dev_engineer" />
          </div>
          <div className="space-y-2"><Label htmlFor="post-sort">排序</Label>
            <Input id="post-sort" name="sort" type="number" min={1} defaultValue={post?.sort ?? 1} />
          </div>
          <div className="space-y-2"><Label htmlFor="post-description">描述</Label>
            <Textarea id="post-description" name="description" rows={4} maxLength={512} defaultValue={post?.description}
              placeholder="岗位描述（可选）" className="resize-none" />
          </div>
        </fieldset>
      </form>
      <DialogFooter><Button variant="outline" disabled={busy} onClick={close}>取消</Button>
        <Button type="submit" form="post-editor" disabled={busy}>保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

export function PostManagementPage() {
  const tenant = useAuthStore(state => state.tenantId);
  const [query, setQuery] = useState({ pageNum: 1, pageSize: 10, keyword: '' });
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [editor, setEditor] = useState<Post | 'new' | null>(null);
  const [deleting, setDeleting] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const list = useQuery({
    queryKey: ['system-posts', tenant, query],
    queryFn: async () => (await http.post<{ records: Post[]; total: number }>(`${base}/query`, {
      ...query, keyword: query.keyword || undefined,
    })).data,
  });
  const records = list.data?.records ?? [];
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / query.pageSize));
  const checked = records.filter(post => selected.includes(post.id)).map(post => post.id);
  function changeQuery(values: Partial<typeof query>) {
    setSelected([]);
    setQuery(previous => ({ ...previous, ...values }));
  }
  async function run(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try { await task(); }
    catch (error) { toast.error(error instanceof Error ? error.message : '操作失败'); }
    finally { setBusy(false); }
  }
  async function refresh() {
    setSelected([]);
    const result = await list.refetch();
    if (result.data) {
      const lastPage = Math.max(1, Math.ceil(result.data.total / query.pageSize));
      if (query.pageNum > lastPage) changeQuery({ pageNum: lastPage });
    }
  }

  return <ListPageLayout scrollMode="table">
    <ListPageHeader>
      <header className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary-text"><Briefcase size={20} /></span>
        <h1 className="text-base font-semibold">岗位管理</h1>
      </header>
      <form className="flex flex-wrap items-center gap-2" onSubmit={event => {
        event.preventDefault();
        const keyword = input.trim();
        if (query.pageNum === 1 && query.keyword === keyword) void refresh();
        else changeQuery({ keyword, pageNum: 1 });
      }}>
        <Input aria-label="搜索岗位名称或编码" placeholder="搜索岗位名称或编码" className="w-full sm:w-72" value={input} onChange={event => setInput(event.target.value)} />
        <Button type="submit" variant="outline" size="sm" disabled={busy}><Search size={14} />查询</Button>
        <Button type="button" variant="outline" size="sm" disabled={busy || list.isFetching} onClick={() => void refresh()}><RefreshCw size={14} />刷新</Button>
        <div className="ml-auto flex gap-2">
          {checked.length > 0 && <Button type="button" variant="outline" tone="danger" size="sm" disabled={busy || list.isFetching}
            onClick={() => setDeleting(checked)}><Trash2 size={14} />批量删除 ({checked.length})</Button>}
          <Button type="button" size="sm" disabled={busy} onClick={() => setEditor('new')}><Plus size={14} />新增岗位</Button>
        </div>
      </form>
      {list.error && <p role="alert" className="text-sm text-destructive">{list.error.message}</p>}
    </ListPageHeader>
    <ListPageContent>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <Table scrollable className="min-w-[760px]" aria-label="岗位列表">
          <TableHeader><TableRow>
            <TableHead className="w-10"><Checkbox aria-label="选择本页全部岗位" disabled={busy || list.isFetching || !records.length}
              checked={checked.length > 0 && (checked.length === records.length ? true : 'indeterminate')}
              onCheckedChange={value => setSelected(value === true ? records.map(post => post.id) : [])} /></TableHead>
            {columns.map(column => <TableHead key={column}>{column}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>
            {records.map(post => <TableRow key={post.id}>
              <TableCell><Checkbox aria-label={`选择 ${post.name}`} disabled={busy || list.isFetching} checked={checked.includes(post.id)}
                onCheckedChange={value => setSelected(previous => value === true ? [...previous, post.id] : previous.filter(id => id !== post.id))} /></TableCell>
              <TableCell className="font-medium">{post.name}</TableCell>
              <TableCell className="font-mono text-xs">{post.code}</TableCell>
              <TableCell>{post.sort ?? '—'}</TableCell>
              <TableCell className="max-w-52 truncate" title={post.description}>{post.description || '—'}</TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{post.createTime || '—'}</TableCell>
              <TableCell><div className="flex gap-1">
                <Button variant="ghost" tone="brand" size="icon-xs" aria-label={`编辑 ${post.name}`} title="编辑" disabled={busy} onClick={() => void run(async () => {
                  const detail = await http.get<Post>(`${base}/get/${encodeURIComponent(post.id)}`).then(result => result.data).catch(() => null);
                  setEditor(detail ?? post);
                })}><Pencil size={14} /></Button>
                <Button variant="ghost" tone="danger" size="icon-xs" aria-label={`删除 ${post.name}`} title="删除" disabled={busy}
                  onClick={() => setDeleting([post.id])}><Trash2 size={14} /></Button>
              </div></TableCell>
            </TableRow>)}
            {!records.length && <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
              {list.isPending ? '正在加载岗位…' : list.isError ? '岗位加载失败' : '暂无岗位数据'}
            </TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </ListPageContent>
    <ListPageFooter>
      <Pagination page={query.pageNum} pageCount={pages} pageSize={query.pageSize} total={total} disabled={busy || list.isFetching}
        onPageChange={pageNum => changeQuery({ pageNum })} onPageSizeChange={pageSize => changeQuery({ pageSize, pageNum: 1 })} />
    </ListPageFooter>
    {editor && <PostEditor post={editor === 'new' ? null : editor} busy={busy} close={() => setEditor(null)} save={values => void run(async () => {
      const payload = editor === 'new' ? { ...values, createTime: new Date().toLocaleString('sv-SE') } : { ...values, id: editor.id };
      const result = await http.post<number>(`${base}/${editor === 'new' ? 'save' : 'update'}`, payload);
      if (result.data === 0) throw new Error('保存失败，未写入岗位数据');
      setEditor(null);
      toast.success('岗位已保存');
      await refresh();
    })} />}
    {deleting.length > 0 && <Dialog open onOpenChange={open => { if (!open && !busy) setDeleting([]); }}>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader><DialogTitle>确认删除</DialogTitle><DialogDescription>确定删除选中的 {deleting.length} 个岗位吗？</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setDeleting([])}>取消</Button>
          <Button variant="destructive" disabled={busy} onClick={() => void run(async () => {
            const result = await http.post<boolean>(`${base}/deleteBatch`, deleting);
            if (result.data === false) throw new Error('删除失败，未删除岗位数据');
            setDeleting([]);
            toast.success('岗位已删除');
            await refresh();
          })}>删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>}
  </ListPageLayout>;
}
