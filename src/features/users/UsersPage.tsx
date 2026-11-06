import { useEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FolderTree, Pencil, Plus, RefreshCw, RotateCcw, Trash2, Unlock, Upload, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { ListPageLayout, ListPageHeader, ListPageContent, ListPageFooter } from '@/components/layout/ListPageLayout';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import * as api from './userApi';
import { UserFormDialog } from './UserFormDialog';

type ActionKind = 'disable' | 'enable' | 'delete' | 'reset' | 'unlock';
type Action = { kind: ActionKind; ids: string[]; name?: string };
const actionLabels = { disable: '禁用', enable: '启用', delete: '删除', reset: '重置密码', unlock: '解锁' };
export function UsersPage() {
  const client = useQueryClient();
  const tenantId = useAuthStore(state => state.tenantId);
  const [query, setQuery] = useState({ pageNum: 1, pageSize: 10, name: '', deptId: '' });
  const [name, setName] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [editor, setEditor] = useState<api.ManagedUser | 'new' | null>(null);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const list = useQuery({ queryKey: ['system-users', tenantId, query], queryFn: () => api.queryUsers(query), placeholderData: keepPreviousData });
  const departments = useQuery({ queryKey: ['system-user-departments', tenantId], queryFn: api.queryDepartments });
  const roles = useQuery({ queryKey: ['system-user-roles', tenantId], queryFn: api.queryRoles });
  const roleOptions = (roles.data ?? []).filter(role => !tenantId || !role.tenantId || role.tenantId === tenantId);
  const records = (list.data?.records ?? []).filter(user => status === 'all' || String(user.enabled ?? 0) === status);
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / query.pageSize));
  useEffect(() => { setSelected([]); }, [query, status, list.data]);
  useEffect(() => {
    if (name.trim() === query.name) return;
    const timer = window.setTimeout(() => setQuery(prev => ({ ...prev, name: name.trim(), pageNum: 1 })), 250);
    return () => window.clearTimeout(timer);
  }, [name, query.name]);
  useEffect(() => { if (list.data && !list.isPlaceholderData && query.pageNum > pages) setQuery(prev => ({ ...prev, pageNum: pages })); }, [list.data, list.isPlaceholderData, query.pageNum, pages]);
  const refresh = () => Promise.all([client.invalidateQueries({ queryKey: ['system-users'] }), client.invalidateQueries({ queryKey: ['system-user-departments'] }), client.invalidateQueries({ queryKey: ['system-user-roles'] })]);
  async function run(task: () => Promise<unknown>, message?: string) {
    if (busy) return;
    setBusy(true);
    try { await task(); if (message) toast.success(message); }
    catch (error) { toast.error(error instanceof Error ? error.message : '操作失败'); }
    finally { setBusy(false); }
  }
  const openEdit = (user: api.ManagedUser) => void run(async () => { setEditor(await api.getUser(user.id) ?? user); });
  const save = (values: api.UserValues) => void run(async () => { await api.saveUser(values, editor && editor !== 'new' ? editor.id : undefined); setEditor(null); await refresh(); }, '用户已保存');
  const confirm = () => void run(async () => {
    if (!action) return;
    if (action.kind === 'delete') await api.deleteUsers(action.ids);
    else if (action.kind === 'reset') await api.resetPassword(action.ids[0]);
    else if (action.kind === 'unlock') await api.unlockUser(action.ids[0]);
    else await api.disableUsers(action.kind === 'disable' ? 1 : 0, action.ids);
    setAction(null); await refresh();
  }, action?.kind === 'reset' ? '密码已重置为系统默认密码' : '操作成功');
  const error = list.error || departments.error || roles.error;
  const requestAction = (kind: ActionKind, user: api.ManagedUser) => setAction({ kind, ids: [user.id], name: user.username });

  return <ListPageLayout scrollMode="table">
    <ListPageHeader>
      <header className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary-text"><Users size={21} /></span><div><h1 className="text-base font-semibold">用户管理</h1><p className="mt-1 text-xs text-muted-foreground">维护用户资料、角色和所属部门</p></div></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={busy || list.isFetching} onClick={() => void run(refresh)}><RefreshCw size={14} />刷新</Button><Button variant="outline" size="sm" disabled={busy} onClick={() => void run(api.downloadTemplate)}><Download size={14} />下载模板</Button><Button variant="outline" size="sm" disabled={busy} onClick={() => fileInput.current?.click()}><Upload size={14} />导入用户</Button><Button size="sm" disabled={busy || departments.isPending || roles.isPending || departments.isError || roles.isError} onClick={() => setEditor('new')}><Plus size={14} />新增用户</Button></div>
      </header>
      <form className="flex flex-wrap items-center gap-3" onSubmit={event => { event.preventDefault(); setQuery(prev => ({ ...prev, name: name.trim(), pageNum: 1 })); }}>
        <Input aria-label="搜索用户名" placeholder="搜索用户名" className="w-full sm:w-64" value={name} onChange={event => setName(event.target.value)} />
        <Select value={status} onValueChange={value => { setStatus(value); setQuery(prev => ({ ...prev, pageNum: 1 })); }}><SelectTrigger aria-label="用户状态筛选" className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部状态</SelectItem><SelectItem value="0">启用</SelectItem><SelectItem value="1">禁用</SelectItem></SelectContent></Select>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setName(''); setStatus('all'); setQuery(prev => ({ ...prev, name: '', deptId: '', pageNum: 1 })); }}>重置条件</Button>
        {selected.length > 0 && <><span className="ml-auto text-xs text-muted-foreground">已选择 {selected.length} 个用户</span>{(['disable', 'enable', 'delete'] as const).map(kind => <Button key={kind} type="button" variant="outline" size="sm" disabled={busy || list.isFetching} onClick={() => setAction({ kind, ids: [...selected] })}>批量{actionLabels[kind]}</Button>)}</>}
      </form>
      {status !== 'all' && <p className="text-xs text-muted-foreground">状态仅筛选当前页；总数为查询结果总数。</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}
    </ListPageHeader>
    <ListPageContent><div className="flex min-h-0 flex-1 gap-4">
      <aside className="flex w-48 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card lg:w-60"><div className="flex shrink-0 items-center justify-between border-b border-border p-3"><span className="flex items-center gap-2 text-sm font-semibold"><FolderTree size={16} />部门树</span><Button variant="ghost" size="icon-xs" aria-label="清空部门筛选" onClick={() => setQuery(prev => ({ ...prev, deptId: '', pageNum: 1 }))}><X size={14} /></Button></div><div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">{api.flattenDepartments(departments.data ?? []).map(dept => <button key={dept.id} type="button" onClick={() => setQuery(prev => ({ ...prev, deptId: dept.id, pageNum: 1 }))} className={cn('block w-full rounded-lg py-2 pr-2 text-left text-sm hover:bg-accent', query.deptId === dept.id && 'bg-primary/10 font-semibold text-primary-text')} style={{ paddingLeft: 8 + dept.level * 16 }}>{dept.name || dept.title || dept.id}</button>)}{!departments.data?.length && <p className="p-3 text-xs text-muted-foreground">{departments.isPending ? '正在加载部门…' : '暂无部门数据'}</p>}</div></aside>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card" aria-label="用户列表" aria-busy={list.isFetching}>
        <Table scrollable className="min-w-[1100px]"><TableHeader><TableRow><TableHead className="w-10"><Checkbox aria-label="选择本页全部用户" checked={records.length > 0 && selected.length === records.length ? true : selected.length ? 'indeterminate' : false} onCheckedChange={checked => setSelected(checked ? records.map(user => user.id) : [])} /></TableHead>{['登录账号', '昵称', '部门', '角色', '手机', '状态', '创建时间', '操作'].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>
          {records.map(user => <TableRow key={user.id}><TableCell><Checkbox aria-label={`选择用户 ${user.username}`} checked={selected.includes(user.id)} onCheckedChange={checked => setSelected(prev => checked ? [...prev, user.id] : prev.filter(id => id !== user.id))} /></TableCell><TableCell className="font-medium">{user.username}</TableCell><TableCell>{user.nickName || user.nickname || '—'}</TableCell><TableCell>{user.agentOpenSysDeparts?.map(dept => dept.name || dept.title).join('、') || '—'}</TableCell><TableCell>{user.sysRoles?.map(role => role.name).join('、') || '—'}</TableCell><TableCell>{user.phone || '—'}</TableCell><TableCell><Badge variant={(user.enabled ?? 0) === 0 ? 'success' : 'muted'}>{(user.enabled ?? 0) === 0 ? '启用' : '禁用'}</Badge></TableCell><TableCell className="text-xs text-muted-foreground">{user.createTime?.replace('T', ' ').slice(0, 19) || '—'}</TableCell><TableCell><div className="flex items-center gap-1"><Button tone="brand" variant="ghost" size="icon-xs" aria-label={`编辑用户 ${user.username}`} disabled={busy || roles.isError || departments.isError} onClick={() => openEdit(user)}><Pencil size={14} /></Button><Button variant="ghost" tone={(user.enabled ?? 0) === 0 ? 'warning' : 'success'} size="xs" disabled={busy} onClick={() => requestAction((user.enabled ?? 0) === 0 ? 'disable' : 'enable', user)}>{(user.enabled ?? 0) === 0 ? '禁用' : '启用'}</Button><Button tone="warning" variant="ghost" size="icon-xs" aria-label={`重置密码 ${user.username}`} disabled={busy} onClick={() => requestAction('reset', user)}><RotateCcw size={14} /></Button><Button tone="brand" variant="ghost" size="icon-xs" aria-label={`解锁用户 ${user.username}`} disabled={busy} onClick={() => requestAction('unlock', user)}><Unlock size={14} /></Button><Button tone="danger" variant="ghost" size="icon-xs" aria-label={`删除用户 ${user.username}`} disabled={busy} onClick={() => requestAction('delete', user)}><Trash2 size={14} /></Button></div></TableCell></TableRow>)}
          {!records.length && <TableRow><TableCell colSpan={9} className="h-40 text-center text-muted-foreground">{list.isPending ? '正在加载用户…' : list.isError ? '用户加载失败，请刷新重试' : '暂无匹配用户'}</TableCell></TableRow>}
        </TableBody></Table>
      </section>
    </div></ListPageContent>
    <ListPageFooter><Pagination page={query.pageNum} pageCount={pages} pageSize={query.pageSize} total={total} onPageChange={pageNum => setQuery(prev => ({ ...prev, pageNum }))} onPageSizeChange={pageSize => setQuery(prev => ({ ...prev, pageSize, pageNum: 1 }))} disabled={busy || list.isFetching} /></ListPageFooter>
    <input ref={fileInput} type="file" accept=".xls,.xlsx" className="hidden" aria-label="用户导入文件" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void run(async () => { await api.importUsers(file); await refresh(); }, '用户导入成功'); }} />
    {editor && <UserFormDialog key={editor === 'new' ? 'new' : editor.id} user={editor === 'new' ? null : editor} roles={roleOptions} departments={departments.data ?? []} busy={busy} onClose={() => setEditor(null)} onSave={save} />}
    <Dialog open={!!action} onOpenChange={open => { if (!open && !busy) setAction(null); }}><DialogContent showCloseButton={!busy}><DialogHeader><DialogTitle>{action && actionLabels[action.kind]}用户</DialogTitle><DialogDescription>{action && `确认${actionLabels[action.kind]}${action.name ? `用户「${action.name}」` : `选中的 ${action.ids.length} 个用户`}吗？`}{action?.kind === 'delete' && '删除后无法恢复。'}{action?.kind === 'reset' && '密码将恢复为系统默认密码。'}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={busy} onClick={() => setAction(null)}>取消</Button><Button variant={action?.kind === 'delete' ? 'destructive' : 'default'} disabled={busy} onClick={confirm}>确认操作</Button></DialogFooter></DialogContent></Dialog>
  </ListPageLayout>;
}
