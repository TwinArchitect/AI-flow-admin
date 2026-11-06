import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ChevronRight, Download, FolderPlus, Pencil, Plus, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { http } from '@/api/client';
import { authFetch } from '@/lib/authSession';
import { useAuthStore } from '@/stores/auth';
import { queryDepartments, type Department } from '@/features/users/userApi';
import { ListPageContent, ListPageHeader, ListPageLayout } from '@/components/layout/ListPageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Dept = Omit<Department, 'children' | 'childList'> & {
  children?: Dept[]; childList?: Dept[]; parentId?: string; sort?: string | number;
  path?: string; creator?: string; createTime?: string;
};
type Mode = { kind: 'company' | 'new' } | { kind: 'child' | 'edit'; node: Dept };
const base = '/gpt/auth/depart';
const label = (node: Dept) => node.name || node.title || String(node.id);
const company = (node: Dept) => String(node.type ?? node.valueType) === '0';
const children = (node: Dept) => (node.children ?? node.childList ?? []).filter(child => String(child.valueType) !== '2');
const columns = ['部门名称', '排序', '类型', '完整路径', '创建人', '创建时间', '操作'];

function visibleRows(nodes: Dept[], collapsed: string[], depth = 0): { node: Dept; depth: number }[] {
  return nodes.flatMap(node => [
    { node, depth },
    ...(!collapsed.includes(String(node.id)) ? visibleRows(children(node), collapsed, depth + 1) : []),
  ]);
}

function ExpandButton({ node, collapsed, toggle }: { node: Dept; collapsed: string[]; toggle: (id: string) => void }) {
  const id = String(node.id);
  const expanded = !collapsed.includes(id);
  return children(node).length ? (
    <Button type="button" variant="ghost" size="icon-xs" aria-expanded={expanded}
      aria-label={`${expanded ? '收起' : '展开'} ${label(node)}`} onClick={() => toggle(id)}>
      <ChevronRight size={14} className={expanded ? 'rotate-90' : ''} />
    </Button>
  ) : <span className="size-6 shrink-0" />;
}

function DepartmentEditor({ mode, tree, busy, close, save }: {
  mode: Mode; tree: Dept[]; busy: boolean; close: () => void;
  save: (payload: Record<string, unknown>) => void;
}) {
  const editing = mode.kind === 'edit' ? mode.node : undefined;
  const preset = mode.kind === 'child' ? mode.node : undefined;
  const root = mode.kind === 'company' || (editing && company(editing));
  const [parent, setParent] = useState(() => {
    if (preset) return String(preset.id);
    if (editing) return String(editing.parentId ?? '');
    return String(tree[0]?.id ?? '');
  });
  const [collapsed, setCollapsed] = useState<string[]>([]);
  function eligible(nodes: Dept[]): Dept[] {
    return nodes.filter(node => String(node.valueType) !== '2' && String(node.id) !== String(editing?.id))
      .map(node => ({ ...node, children: eligible(children(node)) }));
  }
  const parents = eligible(tree);
  const titles = { company: '新增公司', new: '新增部门', child: '新增子部门', edit: '编辑部门' };

  return <Dialog open onOpenChange={open => { if (!open && !busy) close(); }}>
    <DialogContent className="sm:max-w-xl" showCloseButton={!busy}>
      <DialogHeader><DialogTitle>{titles[mode.kind]}</DialogTitle><DialogDescription>填写部门信息并保存</DialogDescription></DialogHeader>
      <form id="department-editor" onSubmit={event => {
        event.preventDefault();
        if (busy) return;
        const data = new FormData(event.currentTarget);
        const name = String(data.get('name') ?? '').trim();
        if (!name) { toast.error('部门名称不能为空'); return; }
        if (!root && !visibleRows(parents, []).some(({ node }) => String(node.id) === parent)) {
          toast.error('请选择上级部门'); return;
        }
        save({
          name, sort: String(data.get('sort') || '1'), type: editing ? String(editing.type ?? (root ? 0 : 1)) : root ? '0' : '1',
          ...(mode.kind === 'company' ? {} : { parentId: root ? '0' : parent }),
          ...(editing ? { id: editing.id } : { createTime: new Date().toLocaleString('sv-SE') }),
        });
      }}>
        <fieldset disabled={busy} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="department-name">部门名称</Label>
            <Input id="department-name" name="name" required defaultValue={editing ? label(editing) : ''} placeholder="请输入部门名称" />
          </div>
          {mode.kind !== 'company' && <div className="space-y-2">
            {preset || root ? <>
              <Label htmlFor="department-parent">上级部门</Label>
              <Input id="department-parent" readOnly value={preset ? label(preset) : '无上级（根公司）'} />
            </> : <>
              <Label id="department-parent-label">上级部门</Label>
              <RadioGroup disabled={busy} aria-labelledby="department-parent-label" value={parent} onValueChange={setParent}
                className="max-h-56 gap-0 overflow-y-auto rounded-lg border border-border p-2">
                {visibleRows(parents, collapsed).map(({ node, depth }) => (
                  <div key={node.id} className="flex items-center gap-1 rounded-md hover:bg-accent" style={{ paddingLeft: depth * 16 }}>
                    <ExpandButton node={node} collapsed={collapsed}
                      toggle={id => setCollapsed(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])} />
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1.5 text-sm">
                      <RadioGroupItem value={String(node.id)} /><span className="truncate">{label(node)}</span>
                    </label>
                  </div>
                ))}
                {!parents.length && <p className="p-2 text-sm text-muted-foreground">暂无部门数据</p>}
              </RadioGroup>
            </>}
            <p className="text-xs text-muted-foreground">{preset ? '父级已锁定为当前行部门' : root ? '根公司不可修改上级' : '树形单选上级部门'}</p>
          </div>}
          <div className="space-y-2"><Label htmlFor="department-sort">排序</Label>
            <Input id="department-sort" name="sort" type="number" min={1} defaultValue={editing?.sort || 1} />
          </div>
          {mode.kind === 'company' && <p className="text-xs text-muted-foreground">新增根公司节点，完整路径由系统根据名称生成。</p>}
        </fieldset>
      </form>
      <DialogFooter><Button variant="outline" disabled={busy} onClick={close}>取消</Button>
        <Button form="department-editor" type="submit" disabled={busy}>保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

export function DepartmentManagementPage() {
  const tenant = useAuthStore(state => state.tenantId);
  const client = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [editor, setEditor] = useState<Mode | null>(null);
  const [deleting, setDeleting] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const list = useQuery({
    queryKey: ['system-departments', tenant, name],
    queryFn: async () => (await http.post<Dept[]>(`${base}/query`, name ? { name } : {})).data ?? [],
  });
  const parentTree = useQuery({ queryKey: ['system-user-departments', tenant], queryFn: queryDepartments });
  const nodes = list.data ?? [];
  const fullTree = parentTree.data ?? [];
  const hasCompany = fullTree.length > 0;
  const parentsWithChildren = new Set(visibleRows(fullTree, [])
    .filter(({ node }) => children(node).length > 0)
    .map(({ node }) => String(node.id)));
  const ready = list.isSuccess && parentTree.isSuccess && !busy;
  const rows = visibleRows(nodes, collapsed);
  const deletableSelection = visibleRows(nodes, [])
    .filter(({ node }) => selected.includes(String(node.id)) && !parentsWithChildren.has(String(node.id)) && !children(node).length)
    .map(({ node }) => String(node.id));
  const error = list.error || parentTree.error;
  async function run(task: () => Promise<unknown>, refresh = true) {
    if (busy) return;
    setBusy(true);
    try {
      await task();
      if (refresh) {
        setEditor(null);
        setDeleting([]);
        setSelected([]);
        await Promise.all([
          client.invalidateQueries({ queryKey: ['system-departments', tenant] }),
          client.invalidateQueries({ queryKey: ['system-user-departments', tenant] }),
        ]);
        toast.success('操作成功');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally { setBusy(false); }
  }
  function search(value: string) {
    setSelected([]);
    setName(value.trim());
  }
  async function exportDepartments() {
    const response = await authFetch(`${base}/exportDepart`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    if (!response.ok || response.headers.get('content-type')?.includes('application/json')) throw new Error('导出失败');
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BMXX.xlsx';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importDepartment(file: File) {
    const data = new FormData();
    data.append('multipartFile', file);
    const response = await authFetch(`${base}/importDepart`, { method: 'POST', body: data });
    const result = await response.json();
    if (!response.ok || ![0, 200].includes(result.code)) throw new Error(result.message || '导入失败');
  }

  return <ListPageLayout scrollMode="table">
    <ListPageHeader>
      <header className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary-text"><Building2 size={20} /></span>
        <div><h1 className="text-base font-semibold">部门管理</h1><p className="mt-1 text-xs text-muted-foreground">维护公司和部门层级</p></div>
      </header>
      <form className="flex flex-wrap items-center gap-2" onSubmit={event => { event.preventDefault(); search(input); }}>
        <Input aria-label="搜索部门名称" placeholder="搜索部门名称" className="w-full sm:w-64" value={input} onChange={event => setInput(event.target.value)} />
        <Button type="submit" size="sm" variant="outline" disabled={busy}><Search size={14} />查询</Button>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => { setInput(''); search(''); }}><RotateCcw size={14} />重置</Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void run(exportDepartments, false)}><Download size={14} />导出</Button>
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => fileInput.current?.click()}><Upload size={14} />导入</Button>
          <input ref={fileInput} type="file" accept=".xlsx,.xls" className="hidden" onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void run(() => importDepartment(file));
          }} />
          {deletableSelection.length > 0 && <Button type="button" size="sm" variant="outline" tone="danger" disabled={!ready || list.isFetching}
            onClick={() => setDeleting(deletableSelection)}><Trash2 size={14} />批量删除 ({deletableSelection.length})</Button>}
          {!hasCompany && <Button type="button" size="sm" disabled={!ready} onClick={() => setEditor({ kind: 'company' })}><Plus size={14} />新增公司</Button>}
          <Button type="button" size="sm" disabled={!ready || !hasCompany} onClick={() => setEditor({ kind: 'new' })}><FolderPlus size={14} />新增部门</Button>
        </div>
      </form>
      {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}
    </ListPageHeader>
    <ListPageContent>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <Table scrollable className="min-w-[900px]" aria-label="部门树">
          <TableHeader><TableRow><TableHead className="w-10"><span className="sr-only">选择</span></TableHead>
            {columns.map(column => <TableHead key={column}>{column}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>
            {rows.map(({ node, depth }) => {
              const id = String(node.id);
              const title = label(node);
              const hasChildren = parentsWithChildren.has(id) || children(node).length > 0;
              return <TableRow key={id}>
                <TableCell><Checkbox aria-label={`选择 ${title}`} disabled={!ready || hasChildren} checked={selected.includes(id)}
                  onCheckedChange={checked => setSelected(prev => checked ? [...prev, id] : prev.filter(item => item !== id))} /></TableCell>
                <TableCell><div className="flex items-center gap-1" style={{ paddingLeft: depth * 20 }}>
                  <ExpandButton node={node} collapsed={collapsed} toggle={id => setCollapsed(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])} />
                  <span className="font-medium">{title}</span>
                </div></TableCell>
                <TableCell>{node.sort ?? '—'}</TableCell>
                <TableCell><Badge variant={company(node) ? 'info' : 'success'}>{company(node) ? '公司' : '部门'}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{node.path || '—'}</TableCell>
                <TableCell>{node.creator || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{node.createTime || '—'}</TableCell>
                <TableCell><div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" tone="brand" size="icon-xs" title="新增子部门" aria-label={`在 ${title} 下新增子部门`} disabled={!ready}
                    onClick={() => setEditor({ kind: 'child', node })}><FolderPlus size={14} /></Button>
                  <Button type="button" variant="ghost" tone="brand" size="icon-xs" title="编辑" aria-label={`编辑 ${title}`} disabled={!ready}
                    onClick={() => setEditor({ kind: 'edit', node })}><Pencil size={14} /></Button>
                  <Button type="button" variant="ghost" tone="danger" size="icon-xs" title={hasChildren ? '存在子部门，不可删除' : '删除'}
                    aria-label={`删除 ${title}`} disabled={!ready || hasChildren} onClick={() => setDeleting([id])}><Trash2 size={14} /></Button>
                </div></TableCell>
              </TableRow>;
            })}
            {!rows.length && <TableRow><TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
              {list.isPending ? '正在加载部门…' : list.isError ? '部门加载失败' : '暂无部门数据'}
            </TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </ListPageContent>
    {editor && <DepartmentEditor mode={editor} tree={parentTree.data ?? []} busy={busy} close={() => setEditor(null)}
      save={payload => void run(() => http.post(`${base}/${editor.kind === 'edit' ? 'update' : 'save'}`, payload))} />}
    {deleting.length > 0 && <Dialog open onOpenChange={open => { if (!open && !busy) setDeleting([]); }}>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader><DialogTitle>确认删除</DialogTitle>
          <DialogDescription>确定删除选中的 {deleting.length} 个部门吗？将同时解除相关部门的用户绑定。</DialogDescription>
        </DialogHeader>
        <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setDeleting([])}>取消</Button>
          <Button variant="destructive" disabled={busy} onClick={() => void run(() => http.post(`${base}/deleteBatch`, deleting))}>删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>}
  </ListPageLayout>;
}
