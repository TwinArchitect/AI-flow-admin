import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Folder, FolderPlus, LayoutGrid, MousePointerClick, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { http } from '@/api/client';
import { ListPageContent, ListPageHeader, ListPageLayout } from '@/components/layout/ListPageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '@/stores/auth';
import type { PermissionMenu } from '@/types/auth';
import { prepareMenus } from './routes';

type Menu = PermissionMenu & { icon?: string; open?: number | string };
type Mode = { kind: 'root' | 'new' } | { kind: 'child' | 'edit'; menu: Menu };
const base = '/gpt/auth/menu';
const nameOf = (menu: Menu) => menu.name || menu.title || menu.path || String(menu.id);
const isButton = (menu: Menu) => Number(menu.type) === 1;
const menuTypes = [
  { value: '0', label: '菜单', description: '路由页面，可包含子菜单或按钮', icon: LayoutGrid },
  { value: '1', label: '按钮', description: '操作权限点，挂载在菜单下', icon: MousePointerClick },
];
function rowsOf(nodes: Menu[], include: (menu: Menu) => boolean, depth = 0): { menu: Menu; depth: number }[] {
  return nodes.flatMap(menu => [{ menu, depth }, ...(include(menu) ? rowsOf(menu.children ?? [], include, depth + 1) : [])]);
}

function MenuEditor({ mode, menus, busy, close, save }: {
  mode: Mode; menus: Menu[]; busy: boolean; close: () => void;
  save: (payload: Record<string, unknown>) => void;
}) {
  const menu = mode.kind === 'edit' ? mode.menu : undefined;
  const presetParent = mode.kind === 'child' ? mode.menu : undefined;
  const [type, setType] = useState(String(menu?.type ?? 0));
  const button = type === '1';
  const root = mode.kind === 'root' || (menu && String(menu.parentId ?? '0') === '0');
  const eligible = (nodes: Menu[]): Menu[] => nodes
    .filter(node => Number(node.type ?? 0) === 0 && node.id != null && (!menu || String(node.id) !== String(menu.id)))
    .map(node => ({ ...node, children: eligible(node.children ?? []) }));
  const parents = eligible(menus);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [parent, setParent] = useState(String(root ? '0' : presetParent?.id ?? menu?.parentId ?? parents[0]?.id ?? ''));
  const [hidden, setHidden] = useState(String(menu?.hidden ?? 0));
  const [open, setOpen] = useState(String(menu?.open ?? 0));
  const title = menu ? (button ? '编辑按钮' : '编辑菜单')
    : mode.kind === 'root' ? '新增根菜单'
    : presetParent ? `新增子项 · ${nameOf(presetParent)}` : '新增菜单';
  const choice = (label: string, value: string, change: (value: string) => void, options: [string, string][]) => (
    <div className="min-w-0 space-y-2"><Label>{label}</Label>
      <Select value={value} onValueChange={change} disabled={busy}><SelectTrigger className="w-full" aria-label={label}><SelectValue placeholder="请选择" /></SelectTrigger>
        <SelectContent>{options.map(([id, text]) => <SelectItem key={id} value={id}>{text}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
  const field = (key: string, label: string, value: string, required = false, placeholder?: string) => (
    <div className="min-w-0 space-y-2"><Label htmlFor={`menu-${key}`}>{label}</Label>
      <Input id={`menu-${key}`} name={key} defaultValue={value} required={required} placeholder={placeholder} type={key === 'sort' ? 'number' : 'text'} min={key === 'sort' ? 1 : undefined} />
    </div>
  );
  return <Dialog open onOpenChange={value => { if (!value && !busy) close(); }}>
    <DialogContent className="sm:max-w-2xl" showCloseButton={!busy}>
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>配置菜单路由或按钮权限</DialogDescription></DialogHeader>
      <form id="menu-editor" onSubmit={event => {
        event.preventDefault();
        if (busy) return;
        const data = new FormData(event.currentTarget);
        const get = (key: string) => String(data.get(key) ?? '').trim();
        if (!get('name') || !parent || (button ? !get('permission') : !get('path'))) {
          toast.error('请填写必填项并确认上级菜单'); return;
        }
        save({ name: get('name'), parentId: parent, path: get('path'), permission: get('permission'),
          icon: get('icon'), sort: get('sort') || '1', type: Number(type), hidden: Number(hidden),
          open: button ? 0 : Number(open), leaf: button ? 1 : 0,
          ...(menu ? { id: menu.id } : { createTime: new Date().toLocaleString('sv-SE') }) });
      }}>
        <fieldset disabled={busy} className="space-y-5">
          {mode.kind === 'root' && <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary-text">正在新增根级菜单（路由页面）</p>}
          {menu && <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">当前类型：{button ? '按钮' : '菜单'}（编辑时不可修改类型）</p>}
          {!menu && !root && (
            <div className="space-y-2">
              <Label id="menu-type-label">新增类型</Label>
              <RadioGroup value={type} onValueChange={setType} aria-labelledby="menu-type-label" className="grid grid-cols-2 gap-3">
                {menuTypes.map(({ value, label, description, icon: Icon }) => (
                  <label key={value} className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-3 hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10">
                    <RadioGroupItem value={value} className="mt-0.5" />
                    <span className="space-y-1">
                      <span className="flex items-center gap-2 text-sm font-medium"><Icon size={16} />{label}</span>
                      <span className="block text-xs text-muted-foreground">{description}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {field('name', button ? '按钮名称' : '菜单名称', menu ? nameOf(menu) : '', true, button ? '请输入按钮名称' : '请输入菜单名称')}
            {field('sort', '排序', String(menu?.sort || 1))}
          </div>
          {mode.kind !== 'root' && (
            <div className="space-y-2">
              {root || presetParent ? (
                <>
                  <Label htmlFor="menu-parent">上级菜单</Label>
                  <Input id="menu-parent" readOnly value={presetParent ? nameOf(presetParent) : '根菜单'} />
                </>
              ) : (
                <>
                  <Label id="menu-parent-label">上级菜单</Label>
                  <RadioGroup value={parent} onValueChange={setParent} aria-labelledby="menu-parent-label" className="max-h-48 gap-0 overflow-y-auto rounded-lg border border-border p-2">
                    {rowsOf(parents, node => !collapsed.includes(String(node.id))).map(({ menu: node, depth }) => {
                      const id = String(node.id);
                      const expanded = !collapsed.includes(id);
                      return (
                        <div key={id} className="flex items-center gap-1 rounded-md hover:bg-accent" style={{ paddingLeft: depth * 16 }}>
                          {node.children?.length ? (
                            <Button type="button" variant="ghost" size="icon-xs" aria-expanded={expanded} aria-label={`${expanded ? '收起' : '展开'} ${nameOf(node)}`}
                              onClick={() => setCollapsed(previous => expanded ? [...previous, id] : previous.filter(item => item !== id))}>
                              <ChevronRight size={14} className={expanded ? 'rotate-90' : ''} />
                            </Button>
                          ) : <span className="size-6 shrink-0" />}
                          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1.5 text-sm">
                            <RadioGroupItem value={id} />
                            <Folder size={14} className="shrink-0 text-muted-foreground" />
                            <span className="truncate">{nameOf(node)}</span>
                          </label>
                        </div>
                      );
                    })}
                    {!parents.length && <p className="p-2 text-sm text-muted-foreground">暂无可选上级菜单</p>}
                  </RadioGroup>
                </>
              )}
              <p className="text-xs text-muted-foreground">{presetParent ? '父级已锁定为当前行菜单' : '仅可选择菜单类型节点作为上级'}</p>
            </div>
          )}
          {!button && field('path', '路由路径', menu?.path ?? '', true, '/system/user')}
          <div className="space-y-2">
            {field('permission', button ? '权限标识' : '权限标识（可选）', menu?.permission ?? '', button, button ? 'system:user:add' : 'system:user:list')}
            {button && <p className="text-xs text-muted-foreground">按钮类型建议填写唯一权限标识</p>}
          </div>
          {!button && (
            <div className="grid gap-4 sm:grid-cols-2">
              {field('icon', '图标', menu?.icon ?? '', false, 'UserCog')}
              {choice('默认展开', open, setOpen, [['0', '否'], ['1', '是']])}
            </div>
          )}
          {choice('显示状态', hidden, setHidden, [['0', '显示'], ['1', '隐藏']])}
        </fieldset>
      </form>
      <DialogFooter><Button variant="outline" disabled={busy} onClick={close}>取消</Button><Button type="submit" form="menu-editor" disabled={busy}>保存</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

export function MenuManagementPage() {
  const admin = useAuthStore(state => state.user?.isPlatformAdmin);
  const list = useQuery({
    queryKey: ['managed-menu-tree', admin],
    queryFn: async () => prepareMenus((await http.get<unknown>(`${base}/query${admin ? '/super' : ''}`)).data),
  });
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [editor, setEditor] = useState<Mode | null>(null);
  const [deleting, setDeleting] = useState<Menu | null>(null);
  const [busy, setBusy] = useState(false);
  const menus = list.data ?? [];
  const search = query.trim().toLowerCase();
  const rows = search
    ? rowsOf(menus, () => true).filter(({ menu }) => [nameOf(menu), menu.path].some(value => value?.toLowerCase().includes(search)))
    : rowsOf(menus, menu => expanded.includes(String(menu.id)));
  async function mutate(endpoint: string, payload: Record<string, unknown> | string[]) {
    setBusy(true);
    try {
      await http.post(`${base}/${endpoint}`, payload);
      setEditor(null);
      setDeleting(null);
      toast.success('操作成功');
      await list.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally { setBusy(false); }
  }
  return <ListPageLayout scrollMode="table">
    <ListPageHeader>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary-text"><LayoutGrid size={20} /></span>
          <div><h1 className="text-base font-semibold">菜单管理</h1><p className="mt-1 text-xs text-muted-foreground">维护系统菜单和按钮权限</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={busy || list.isFetching} onClick={() => void list.refetch()}><RefreshCw size={14} />刷新</Button>
          <Button variant="outline" size="sm" disabled={busy || !menus.some(menu => !isButton(menu))} onClick={() => setEditor({ kind: 'new' })}><FolderPlus size={14} />新增子项</Button>
          <Button size="sm" disabled={busy || list.isPending || list.isError} onClick={() => setEditor({ kind: 'root' })}><Plus size={14} />新增根菜单</Button>
        </div>
      </header>
      <Input className="w-full sm:w-72" aria-label="搜索菜单名称或路径" placeholder="搜索菜单名称或路径" value={query} onChange={event => setQuery(event.target.value)} />
      {list.error && <p role="alert" className="text-sm text-destructive">{list.error.message}</p>}
    </ListPageHeader>
    <ListPageContent>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <Table scrollable className="min-w-[780px]" aria-label="菜单树">
          <TableHeader><TableRow>{['名称', '路径', '权限标识', '类型', '状态', '操作'].map(title => <TableHead key={title}>{title}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {rows.map(({ menu, depth }) => {
              const id = String(menu.id);
              const name = nameOf(menu);
              const opened = expanded.includes(id);
              return <TableRow key={id}>
                <TableCell><div className="flex items-center gap-1" style={{ paddingLeft: search ? 0 : depth * 20 }}>
                  {!search && !!menu.children?.length
                    ? <Button variant="ghost" size="icon-xs" aria-expanded={opened} aria-label={`${opened ? '收起' : '展开'} ${name}`} onClick={() => setExpanded(prev => opened ? prev.filter(value => value !== id) : [...prev, id])}><ChevronRight size={14} className={opened ? 'rotate-90' : ''} /></Button>
                    : <span className="size-6 shrink-0" />}
                  <span className="font-medium">{name}</span>
                </div></TableCell>
                <TableCell className="font-mono text-xs">{menu.path || '—'}</TableCell>
                <TableCell className="font-mono text-xs">{menu.permission || '—'}</TableCell>
                <TableCell>{isButton(menu) ? <Badge variant="outline">按钮</Badge> : <Badge variant="info">菜单</Badge>}</TableCell>
                <TableCell>{Number(menu.hidden) === 1 ? <Badge variant="outline">隐藏</Badge> : <Badge variant="success">显示</Badge>}</TableCell>
                <TableCell><div className="flex items-center gap-1">
                  {!isButton(menu) && <Button variant="ghost" tone="brand" size="icon-xs" title="新增子项" aria-label={`在 ${name} 下新增子项`} disabled={busy} onClick={() => setEditor({ kind: 'child', menu })}><FolderPlus size={14} /></Button>}
                  <Button variant="ghost" tone="brand" size="icon-xs" title="编辑" aria-label={`编辑 ${name}`} disabled={busy} onClick={() => setEditor({ kind: 'edit', menu })}><Pencil size={14} /></Button>
                  <Button variant="ghost" tone="danger" size="icon-xs" title="删除" aria-label={`删除 ${name}`} disabled={busy} onClick={() => setDeleting(menu)}><Trash2 size={14} /></Button>
                </div></TableCell>
              </TableRow>;
            })}
            {!rows.length && <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground">{list.isPending ? '正在加载菜单…' : list.isError ? '菜单加载失败' : '暂无匹配菜单'}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </ListPageContent>
    {editor && <MenuEditor mode={editor} menus={menus} busy={busy} close={() => setEditor(null)} save={payload => void mutate(editor.kind === 'edit' ? 'update' : 'save', payload)} />}
    {deleting && <Dialog open onOpenChange={open => { if (!open && !busy) setDeleting(null); }}>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader><DialogTitle>确认删除</DialogTitle><DialogDescription>确定删除「{nameOf(deleting)}」吗？</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>取消</Button><Button variant="destructive" disabled={busy} onClick={() => void mutate('deleteBatch', [String(deleting.id)])}>删除</Button></DialogFooter>
      </DialogContent>
    </Dialog>}
  </ListPageLayout>;
}
