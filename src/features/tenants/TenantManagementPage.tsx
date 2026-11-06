import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { http } from '@/api/client';
import { ListPageContent, ListPageFooter, ListPageHeader, ListPageLayout } from '@/components/layout/ListPageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { prepareMenus } from '@/features/permissions/routes';
import { menuNodes, ScopeTree, type TreeNode } from '@/features/permissions/ScopeTree';
import { useAuthStore } from '@/stores/auth';

type MenuId = string | number | { id?: string | number; children?: MenuId[]; childList?: MenuId[] };
type Tenant = {
  id: string; name: string; username?: string; ownerId?: string; phone?: string;
  startTime?: string; endTime?: string; status?: number; type?: number;
  menuIds?: MenuId[]; menuIdList?: MenuId[];
};
const base = '/gpt/auth/sys/tenant';
const columns = ['租户名称', '负责人账号', '有效期', '状态', '类型', '操作'];
function collectIds(items: MenuId[]): string[] {
  return items.flatMap(item => typeof item === 'object'
    ? [...(item.id == null ? [] : [String(item.id)]), ...collectIds(item.children ?? item.childList ?? [])]
    : [String(item)]);
}
const localValue = (value: string) => value.replace(' ', 'T').slice(0, 19);
const dateValue = (value: string) => value.replace('T', ' ') + (value.length === 16 ? ':00' : '');
function TenantEditor({ tenant, menus, busy, close, save }: {
  tenant: Tenant | null; menus: TreeNode[]; busy: boolean; close: () => void; save: (payload: Record<string, unknown>) => void;
}) {
  const [selected, setSelected] = useState(() => [...new Set(collectIds(tenant?.menuIds?.length ? tenant.menuIds : tenant?.menuIdList ?? []))]);
  const [status, setStatus] = useState(String(tenant?.status ?? 0));
  const field = (key: string, label: string, value?: string, placeholder?: string, date = false) => (
    <div className="space-y-2"><Label htmlFor={`tenant-${key}`}>{label}</Label>
      <Input id={`tenant-${key}`} name={key} defaultValue={value} placeholder={placeholder} required
        type={date ? 'datetime-local' : 'text'} step={date ? 1 : undefined} />
    </div>
  );
  return <Dialog open onOpenChange={open => { if (!open && !busy) close(); }}>
    <DialogContent className="sm:max-w-3xl" showCloseButton={!busy}>
      <DialogHeader><DialogTitle>{tenant ? '编辑租户' : '新增租户'}</DialogTitle><DialogDescription>配置租户有效期和开通菜单</DialogDescription></DialogHeader>
      <form id="tenant-editor" onSubmit={event => {
        event.preventDefault();
        if (busy) return;
        const form = new FormData(event.currentTarget);
        const read = (key: string) => String(form.get(key) ?? '').trim();
        const name = read('name');
        const username = read('username');
        const startTime = dateValue(read('startTime'));
        const endTime = dateValue(read('endTime'));
        if (!name || !username) { toast.error('请填写租户名称和负责人账号'); return; }
        if (!selected.length) { toast.error('请选择租户菜单'); return; }
        if (startTime > endTime) { toast.error('结束时间不能早于开始时间'); return; }
        save({
          name, username, startTime, endTime, status: Number(status), menuIds: selected.map(id => ({ id })),
          ...(tenant ? { id: tenant.id, ownerId: tenant.ownerId, phone: tenant.phone } : { createTime: new Date().toLocaleString('sv-SE') }),
        });
      }}>
        <fieldset disabled={busy} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {field('name', '租户名称', tenant?.name, '请输入租户名称')}
            {field('username', '负责人账号', tenant?.username, '全局唯一账号')}
            {field('startTime', '开始时间', localValue(tenant?.startTime || `${new Date().toLocaleDateString('sv-SE')} 00:00:00`), undefined, true)}
            {field('endTime', '结束时间', localValue(tenant?.endTime || '2099-12-31 23:59:59'), undefined, true)}
            <div className="space-y-2"><Label id="tenant-status-label">状态</Label>
              <Select value={status} onValueChange={setStatus} disabled={busy}>
                <SelectTrigger aria-labelledby="tenant-status-label" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="0">正常</SelectItem><SelectItem value="1">停用</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>租户菜单</Label>
            <ScopeTree nodes={menus} selected={selected} onChange={setSelected} cascade busy={busy}
              label="租户菜单" empty="暂无菜单数据" className="max-h-72" />
            <p className="text-xs text-muted-foreground">树形多选租户开通的菜单权限</p>
          </div>
        </fieldset>
      </form>
      <DialogFooter><Button variant="outline" disabled={busy} onClick={close}>取消</Button>
        <Button form="tenant-editor" type="submit" disabled={busy || !menus.length}>保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

export function TenantManagementPage() {
  const account = useAuthStore(state => state.user?.id);
  const [query, setQuery] = useState({ pageNum: 1, pageSize: 10, name: '' });
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<Tenant | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Tenant | null>(null);
  const [busy, setBusy] = useState(false);
  const list = useQuery({
    queryKey: ['managed-tenants', account, query],
    queryFn: async () => (await http.post<{ records: Tenant[]; total: number }>(`${base}/query`, { ...query, name: query.name || undefined })).data,
  });
  const menus = useQuery({
    queryKey: ['tenant-assignable-menus', account],
    queryFn: async () => menuNodes(prepareMenus((await http.get<unknown>('/gpt/auth/menu/query/super')).data)),
  });
  const records = list.data?.records ?? [];
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / query.pageSize));
  useEffect(() => {
    if (search.trim() === query.name) return;
    const timer = window.setTimeout(() => setQuery(previous => ({ ...previous, pageNum: 1, name: search.trim() })), 250);
    return () => window.clearTimeout(timer);
  }, [search, query.name]);
  useEffect(() => {
    if (list.data && query.pageNum > pages) setQuery(previous => ({ ...previous, pageNum: pages }));
  }, [list.data, query.pageNum, pages]);
  async function run(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try { await task(); }
    catch (error) { toast.error(error instanceof Error ? error.message : '操作失败'); }
    finally { setBusy(false); }
  }
  const error = list.error || menus.error;
  return <ListPageLayout scrollMode="table">
    <ListPageHeader>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary-text"><Building2 size={20} /></span>
          <h1 className="text-base font-semibold">租户管理</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={busy || list.isFetching || menus.isFetching} onClick={() => void Promise.all([list.refetch(), menus.refetch()])}><RefreshCw size={14} />刷新</Button>
          <Button size="sm" disabled={busy || !menus.isSuccess} onClick={() => setEditor('new')}><Plus size={14} />新增租户</Button>
        </div>
      </header>
      <Input aria-label="搜索租户名称" placeholder="搜索租户名称" className="w-full sm:w-72" value={search} onChange={event => setSearch(event.target.value)} />
      {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}
    </ListPageHeader>
    <ListPageContent>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <Table scrollable className="min-w-[820px]" aria-label="租户列表">
          <TableHeader><TableRow>{columns.map(column => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {records.map(tenant => {
              const system = Number(tenant.type ?? 1) === 0;
              const normal = Number(tenant.status ?? 0) === 0;
              return <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>{tenant.username || tenant.ownerId || '—'}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{tenant.startTime || '—'} 至 {tenant.endTime || '—'}</TableCell>
                <TableCell><Badge variant={normal ? 'success' : 'muted'}>{normal ? '正常' : '停用'}</Badge></TableCell>
                <TableCell><Badge variant={system ? 'warning' : 'info'}>{system ? '系统租户' : '普通租户'}</Badge></TableCell>
                <TableCell><div className="flex gap-1">
                  <Button variant="ghost" tone="brand" size="icon-xs" title="编辑" aria-label={`编辑 ${tenant.name}`} disabled={busy || !menus.isSuccess}
                    onClick={() => void run(async () => {
                      const result = await http.get<Tenant>(`${base}/get/${encodeURIComponent(tenant.id)}`);
                      if (!result.data?.ownerId) throw new Error('无法读取租户负责人信息');
                      setEditor({ ...tenant, ...result.data });
                    })}><Pencil size={14} /></Button>
                  <Button variant="ghost" tone="danger" size="icon-xs" title={system ? '系统租户不可删除' : '删除'} aria-label={`删除 ${tenant.name}`}
                    disabled={busy || system} onClick={() => setDeleting(tenant)}><Trash2 size={14} /></Button>
                </div></TableCell>
              </TableRow>;
            })}
            {!records.length && <TableRow><TableCell colSpan={columns.length} className="h-40 text-center text-muted-foreground">
              {list.isPending ? '正在加载租户…' : list.isError ? '租户加载失败' : '暂无租户数据'}
            </TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </ListPageContent>
    <ListPageFooter>
      <Pagination page={query.pageNum} pageCount={pages} pageSize={query.pageSize} total={total} disabled={busy || list.isFetching}
        onPageChange={pageNum => setQuery(previous => ({ ...previous, pageNum }))}
        onPageSizeChange={pageSize => setQuery(previous => ({ ...previous, pageSize, pageNum: 1 }))} />
    </ListPageFooter>
    {editor && <TenantEditor tenant={editor === 'new' ? null : editor} menus={menus.data ?? []} busy={busy} close={() => setEditor(null)}
      save={payload => void run(async () => {
        const result = await http.post(`${base}/${editor === 'new' ? 'save' : 'update'}`, payload);
        if (result.data === false || result.data === 0) throw new Error('租户保存失败');
        setEditor(null);
        toast.success('租户已保存');
        await list.refetch();
      })} />}
    {deleting && <Dialog open onOpenChange={open => { if (!open && !busy) setDeleting(null); }}>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader><DialogTitle>确认删除</DialogTitle><DialogDescription>确定删除租户「{deleting.name}」吗？</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>取消</Button>
          <Button variant="destructive" disabled={busy} onClick={() => void run(async () => {
            const result = await http.post(`${base}/delete/${encodeURIComponent(deleting.id)}`, {});
            if (result.data === false || result.data === 0) throw new Error('租户删除失败');
            setDeleting(null);
            toast.success('租户已删除');
            await list.refetch();
          })}>删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>}
  </ListPageLayout>;
}
