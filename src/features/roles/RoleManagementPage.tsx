import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KeyRound, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ListPageContent, ListPageFooter, ListPageHeader, ListPageLayout } from '@/components/layout/ListPageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { queryDepartments, type Department } from '@/features/users/userApi';
import { useAuthStore } from '@/stores/auth';
import { menuNodes, ScopeTree, type TreeNode } from '@/features/permissions/ScopeTree';
import * as api from './roleApi';

const scopes = [
  { label: '全部', description: '可见本租户所有用户创建的数据' },
  { label: '自定义', description: '仅可见指定部门下用户的数据' },
  { label: '本级及子级', description: '本部门及下级部门用户数据' },
  { label: '本级', description: '仅本部门用户数据' },
  { label: '本人', description: '仅自己创建的数据' },
];
const roleTypes = ['普通角色', '租户系统管理员', '平台租户管理员'];
const columns = ['角色名称', '编码', '角色类型', '数据权限', '创建时间', '操作'];
const scopeIds = (scope?: string) => (scope ?? '').split(',').map(id => id.trim()).filter(Boolean);

function departmentNodes(nodes: Department[]): TreeNode[] {
  return nodes.filter(node => String(node.valueType) !== '2').map(node => ({
    id: String(node.id), name: node.title || node.name || String(node.id),
    children: departmentNodes(node.children ?? node.childList ?? []),
  }));
}
function RoleEditor({ role, departments, busy, close, save }: {
  role: api.Role | null; departments: Department[]; busy: boolean;
  close: () => void; save: (values: api.RoleValues) => void;
}) {
  const [scope, setScope] = useState(String(role?.dsType ?? 0));
  const [selected, setSelected] = useState(() => scopeIds(role?.dsScope));
  return <Dialog open onOpenChange={open => { if (!open && !busy) close(); }}>
    <DialogContent className="sm:max-w-2xl" showCloseButton={!busy}>
      <DialogHeader><DialogTitle>{role ? '编辑角色' : '新增角色'}</DialogTitle><DialogDescription>配置角色信息与数据权限</DialogDescription></DialogHeader>
      <form id="role-form" onSubmit={event => {
        event.preventDefault();
        if (busy) return;
        const data = new FormData(event.currentTarget);
        save({ name: String(data.get('name') ?? ''), code: String(data.get('code') ?? ''), dsType: Number(scope), dsScope: scope === '1' ? selected.join(',') : '' });
      }}>
        <fieldset disabled={busy} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="role-name">角色名称</Label><Input id="role-name" name="name" required defaultValue={role?.name} placeholder="请输入角色名称" /></div>
            <div className="space-y-2"><Label htmlFor="role-code">角色编码</Label><Input id="role-code" name="code" required readOnly={!!role} defaultValue={role?.code} placeholder="请输入唯一编码" /></div>
          </div>
          <div className="space-y-2">
            <Label id="role-scope-label">数据权限范围</Label>
            <Select value={scope} onValueChange={setScope} disabled={busy}>
              <SelectTrigger aria-labelledby="role-scope-label" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{scopes.map((option, index) => <SelectItem key={option.label} value={String(index)}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{scopes[Number(scope)]?.description}</p>
          </div>
          {scope === '1' && <div className="space-y-2">
            <Label>自定义部门</Label>
            <ScopeTree nodes={departmentNodes(departments)} selected={selected} onChange={setSelected} busy={busy} label="自定义部门" empty="暂无部门数据" />
            <p className="text-xs text-muted-foreground">可选择多个部门作为数据权限范围</p>
          </div>}
        </fieldset>
      </form>
      <DialogFooter><Button variant="outline" disabled={busy} onClick={close}>取消</Button><Button type="submit" form="role-form" disabled={busy}>保存</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

function AssignMenus({ role, admin, tenant, busy, close, save }: {
  role: api.Role; admin: boolean; tenant: string | null; busy: boolean;
  close: () => void; save: (ids: string[]) => void;
}) {
  const query = useQuery({
    queryKey: ['role-menu-assignment', admin, tenant, role.tenantId, role.id],
    queryFn: () => api.loadRoleMenus(role, admin, tenant ?? undefined),
    gcTime: 0,
  });
  const [draft, setDraft] = useState<string[]>();
  const selected = draft ?? query.data?.selected ?? [];
  const nodes = menuNodes(query.data?.menus ?? []);
  return <Dialog open onOpenChange={open => { if (!open && !busy) close(); }}>
    <DialogContent className="sm:max-w-2xl" showCloseButton={!busy}>
      <DialogHeader><DialogTitle>分配菜单权限：{role.name}</DialogTitle><DialogDescription>树形多选菜单权限，勾选父项会联动下级菜单和按钮。</DialogDescription></DialogHeader>
      {query.isFetching ? <p className="py-12 text-center text-sm text-muted-foreground">加载菜单权限中…</p>
        : query.isError ? <p role="alert" className="text-sm text-destructive">{query.error.message}</p>
        : <ScopeTree nodes={nodes} selected={selected} onChange={setDraft} cascade busy={busy} label="菜单权限"
          empty="暂无可分配菜单。租户管理员请确认当前租户已开通菜单，平台管理员请检查菜单管理数据。" />}
      <DialogFooter><Button variant="outline" disabled={busy} onClick={close}>取消</Button><Button disabled={busy || query.isFetching || query.isError || !nodes.length} onClick={() => save(selected)}>保存</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

export function RoleManagementPage() {
  const tenant = useAuthStore(state => state.tenantId);
  const admin = useAuthStore(state => Boolean(state.user?.isPlatformAdmin));
  const [query, setQuery] = useState({ pageNum: 1, pageSize: 10, name: '' });
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<api.Role | 'new' | null>(null);
  const [assigning, setAssigning] = useState<api.Role | null>(null);
  const [deleting, setDeleting] = useState<api.Role | null>(null);
  const [busy, setBusy] = useState(false);
  const list = useQuery({ queryKey: ['system-roles', tenant, query], queryFn: () => api.queryRoles(query) });
  const departments = useQuery({ queryKey: ['system-user-departments', tenant], queryFn: queryDepartments });
  const records = list.data?.records ?? [];
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / query.pageSize));
  useEffect(() => {
    if (search.trim() === query.name) return;
    const timer = window.setTimeout(() => setQuery(previous => ({ ...previous, name: search.trim(), pageNum: 1 })), 250);
    return () => window.clearTimeout(timer);
  }, [search, query.name]);
  useEffect(() => {
    if (list.data && query.pageNum > pages) setQuery(previous => ({ ...previous, pageNum: pages }));
  }, [list.data, pages, query.pageNum]);

  async function mutate(task: () => Promise<unknown>, close: () => void) {
    if (busy) return;
    setBusy(true);
    try {
      await task();
      close();
      toast.success('操作成功');
      await list.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setBusy(false);
    }
  }

  const error = list.error || departments.error;
  return <ListPageLayout scrollMode="table">
    <ListPageHeader>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary-text"><KeyRound size={20} /></span>
          <div><h1 className="text-base font-semibold">角色管理</h1><p className="mt-1 text-xs text-muted-foreground">维护角色、数据权限和菜单权限</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={busy || list.isFetching} onClick={() => void Promise.all([list.refetch(), departments.refetch()])}><RefreshCw size={14} />刷新</Button>
          <Button size="sm" disabled={busy || departments.isPending || departments.isError} onClick={() => setEditor('new')}><Plus size={14} />新增角色</Button>
        </div>
      </header>
      <Input aria-label="搜索角色名称或编码" placeholder="搜索角色名称或编码" className="w-full sm:w-72" value={search} onChange={event => setSearch(event.target.value)} />
      {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}
    </ListPageHeader>
    <ListPageContent>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <Table scrollable className="min-w-[760px]" aria-label="角色列表">
          <TableHeader><TableRow>{columns.map(column => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {records.map(role => {
              const count = scopeIds(role.dsScope).length;
              const protectedRole = Number(role.isSystem) === 1 || ['Super', 'Tenant'].includes(role.code);
              return <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell className="font-mono text-xs">{role.code}</TableCell>
                <TableCell><Badge variant={role.isSystem ? 'warning' : 'info'}>{roleTypes[role.roleType ?? 0] ?? '普通角色'}</Badge></TableCell>
                <TableCell>{scopes[role.dsType ?? 0]?.label ?? '全部'}{Number(role.dsType) === 1 && count > 0 ? ` (${count})` : ''}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{role.createTime || '—'}</TableCell>
                <TableCell><div className="flex items-center gap-1">
                  <Button variant="ghost" tone="brand" size="icon-xs" title="编辑" aria-label={`编辑 ${role.name}`} disabled={busy || departments.isPending || departments.isError} onClick={() => setEditor(role)}><Pencil size={14} /></Button>
                  <Button variant="ghost" size="icon-xs" title="分配菜单" aria-label={`分配菜单 ${role.name}`} disabled={busy} onClick={() => setAssigning(role)}><KeyRound size={14} /></Button>
                  <Button variant="ghost" tone="danger" size="icon-xs" title="删除" aria-label={`删除 ${role.name}`} disabled={busy || protectedRole} onClick={() => setDeleting(role)}><Trash2 size={14} /></Button>
                </div></TableCell>
              </TableRow>;
            })}
            {!records.length && <TableRow><TableCell colSpan={columns.length} className="h-40 text-center text-muted-foreground">{list.isPending ? '正在加载角色…' : list.isError ? '角色加载失败' : '暂无角色数据'}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </ListPageContent>
    <ListPageFooter>
      <Pagination page={query.pageNum} pageCount={pages} pageSize={query.pageSize} total={total} disabled={busy || list.isFetching}
        onPageChange={pageNum => setQuery(previous => ({ ...previous, pageNum }))}
        onPageSizeChange={pageSize => setQuery(previous => ({ ...previous, pageSize, pageNum: 1 }))} />
    </ListPageFooter>
    {editor && <RoleEditor role={editor === 'new' ? null : editor} departments={departments.data ?? []} busy={busy} close={() => setEditor(null)}
      save={values => void mutate(() => api.saveRole(values, editor === 'new' ? undefined : editor), () => setEditor(null))} />}
    {assigning && <AssignMenus role={assigning} admin={admin} tenant={tenant} busy={busy} close={() => setAssigning(null)}
      save={ids => void mutate(() => api.applyRoleMenus(assigning.id, ids), () => setAssigning(null))} />}
    {deleting && <Dialog open onOpenChange={open => { if (!open && !busy) setDeleting(null); }}>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader><DialogTitle>确认删除</DialogTitle><DialogDescription>确定删除角色「{deleting.name}」吗？</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>取消</Button><Button variant="destructive" disabled={busy}
          onClick={() => void mutate(() => api.deleteRole(deleting.id), () => setDeleting(null))}>删除</Button></DialogFooter>
      </DialogContent>
    </Dialog>}
  </ListPageLayout>;
}
