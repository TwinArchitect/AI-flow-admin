import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ChevronRight, Folder, Network, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { http } from '@/api/client';
import { ListPageContent, ListPageHeader, ListPageLayout } from '@/components/layout/ListPageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/auth';

type Category = { id: string; name: string; code: string; description?: string };
type Node = { id: string; nodeName: string; parentId?: string; sortNo?: number; icon?: string; childList?: Node[] };
type Editor = { kind: 'category'; item?: Category } | { kind: 'node'; treeId: string; item?: Node; parent?: Node; sort: number };
type Deletion = { kind: 'category' | 'node'; id: string; name: string };
const base = '/gpt/auth/tree';
const parentId = (node: Node) => node.parentId || '0';
const flatten = (nodes: Node[]): Node[] => nodes.flatMap(node => [node, ...flatten(node.childList ?? [])]);
const sorted = (nodes: Node[]) => [...nodes].sort((a, b) => (a.sortNo ?? 0) - (b.sortNo ?? 0));
function filterNodes(nodes: Node[], term: string): Node[] {
  return nodes.flatMap(node => {
    const childList = filterNodes(node.childList ?? [], term);
    return node.nodeName.toLowerCase().includes(term) || childList.length ? [{ ...node, childList }] : [];
  });
}

async function write(kind: Editor['kind'], action: string, payload: Record<string, unknown> | string[]) {
  const { data } = await http.post(`${base}/${kind}/${action}`, payload);
  if (data === false || data === 0) throw new Error('操作未写入数据');
}

function TreeEditor({ editor, busy, close, save }: {
  editor: Editor; busy: boolean; close: () => void; save: (payload: Record<string, unknown>) => void;
}) {
  const title = editor.kind === 'category'
    ? editor.item ? '修改树分类' : '注册新树分类'
    : editor.item ? '编辑树节点' : '新增树节点';
  return <Dialog open onOpenChange={open => { if (!open && !busy) close(); }}>
    <DialogContent showCloseButton={!busy}>
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>填写信息并保存</DialogDescription></DialogHeader>
      <form id="organization-tree-editor" onSubmit={event => {
        event.preventDefault();
        if (busy) return;
        const form = new FormData(event.currentTarget);
        const read = (name: string) => String(form.get(name) ?? '').trim();
        const name = read('name');
        const code = read('code').toUpperCase();
        if (!name || (editor.kind === 'category' && !code)) {
          toast.error(editor.kind === 'category' ? '请填写分类名称和编码' : '请输入节点名称');
          return;
        }
        const identity = editor.item ? { id: editor.item.id } : {};
        save(editor.kind === 'category'
          ? { ...identity, name, code, description: read('description') }
          : { ...identity, treeId: editor.treeId, parentId: editor.item ? parentId(editor.item) : editor.parent?.id ?? '0',
              nodeName: name, sortNo: Number(read('sort')), icon: read('icon') });
      }}>
        <fieldset disabled={busy} className="space-y-4">
          {editor.kind === 'node' && editor.parent && !editor.item && (
            <div className="rounded-lg border border-border bg-muted p-3 text-sm"><span className="text-muted-foreground">父级节点</span> <strong>{editor.parent.nodeName}</strong></div>
          )}
          <div className="space-y-2"><Label htmlFor="org-tree-name">{editor.kind === 'category' ? '分类名称' : '节点名称'}</Label>
            <Input id="org-tree-name" name="name" required defaultValue={editor.kind === 'category' ? editor.item?.name : editor.item?.nodeName} />
          </div>
          {editor.kind === 'category' ? <>
            <div className="space-y-2"><Label htmlFor="org-tree-code">分类编码</Label>
              <Input id="org-tree-code" name="code" required defaultValue={editor.item?.code}
                onChange={event => { event.currentTarget.value = event.currentTarget.value.toUpperCase(); }} />
            </div>
            <div className="space-y-2"><Label htmlFor="org-tree-description">描述</Label>
              <Textarea id="org-tree-description" name="description" rows={3} defaultValue={editor.item?.description} />
            </div>
          </> : <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="org-tree-sort">排序</Label>
              <Input id="org-tree-sort" name="sort" type="number" defaultValue={editor.sort} />
            </div>
            <div className="space-y-2"><Label htmlFor="org-tree-icon">图标</Label>
              <Input id="org-tree-icon" name="icon" placeholder="可选，如图标名" defaultValue={editor.item?.icon} />
            </div>
          </div>}
        </fieldset>
      </form>
      <DialogFooter><Button variant="outline" disabled={busy} onClick={close}>取消</Button>
        <Button form="organization-tree-editor" type="submit" disabled={busy}>
          {editor.kind === 'node' ? '确定保存' : editor.item ? '保存修改' : '立即注册'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

export function OrganizationTreePage() {
  const tenant = useAuthStore(state => state.tenantId);
  const client = useQueryClient();
  const [categoryId, setCategoryId] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [nodeSearch, setNodeSearch] = useState('');
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<Deletion | null>(null);
  const [busy, setBusy] = useState(false);
  const categories = useQuery({
    queryKey: ['organization-tree-categories', tenant],
    queryFn: async () => (await http.post<Category[]>(`${base}/category/query/list`, {})).data ?? [],
  });
  const list = categories.data ?? [];
  const active = list.find(category => category.id === categoryId) ?? list[0];
  const nodes = useQuery({
    queryKey: ['organization-tree-nodes', tenant, active?.id],
    enabled: !!active,
    queryFn: async () => (await http.post<Node[]>(`${base}/node/query`, { treeId: active?.id })).data ?? [],
  });
  const allNodes = nodes.data ?? [];
  const flat = flatten(allNodes);
  const byId = new Map(flat.map(node => [node.id, node]));
  const term = nodeSearch.trim().toLowerCase();
  const visibleNodes = term ? filterNodes(allNodes, term) : allNodes;
  const categoryTerm = categorySearch.trim().toLowerCase();
  const visibleCategories = list.filter(category => [category.name, category.code, category.description].some(value => value?.toLowerCase().includes(categoryTerm)));
  const ready = !!active && nodes.isSuccess && !nodes.isFetching && !busy;

  async function run(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try { await task(); }
    catch (error) { toast.error(error instanceof Error ? error.message : '操作失败'); }
    finally { setBusy(false); }
  }
  function addNode(parent?: Node) {
    if (!active || !ready) return;
    const siblings = flat.filter(node => parentId(node) === (parent?.id ?? '0'));
    setEditor({ kind: 'node', treeId: active.id, parent, sort: (siblings.length + 1) * 10 });
  }
  function editNode(node: Node) {
    if (active && ready) setEditor({ kind: 'node', treeId: active.id, item: node, sort: node.sortNo ?? 0 });
  }
  async function moveNode(node: Node, target: Node) {
    if (!active || !ready) return;
    const update = (item: Node, sortNo: number) => write('node', 'update', {
      id: item.id, treeId: active.id, parentId: parentId(item), nodeName: item.nodeName, icon: item.icon, sortNo,
    });
    try {
      await update(node, target.sortNo ?? 0);
      try {
        await update(target, node.sortNo ?? 0);
      } catch (error) {
        await update(node, node.sortNo ?? 0).catch(() => {
          throw new Error('排序只完成了一部分，请刷新后检查节点顺序');
        });
        throw error;
      }
    } finally {
      await nodes.refetch();
    }
  }

  function renderNodes(items: Node[], depth = 0) {
    return sorted(items).map(visible => {
      const node = byId.get(visible.id) ?? visible;
      const siblings = sorted(flat.filter(item => parentId(item) === parentId(node)));
      const index = siblings.findIndex(item => item.id === node.id);
      const expanded = !collapsed.includes(node.id);
      const branch = visible.childList ?? [];
      const hasChildren = !!node.childList?.length;
      return <div key={node.id}>
        <div className="group flex min-w-0 items-center gap-1 rounded-lg p-1 hover:bg-accent data-[selected=true]:bg-primary/10" style={{ paddingInlineStart: depth * 16 }}
        data-selected={editor?.kind === 'node' && editor.item?.id === node.id}
      >
          {branch.length > 0 ? <Button variant="ghost" size="icon-xs" aria-expanded={expanded} aria-label={`${expanded ? '收起' : '展开'} ${node.nodeName}`}
            onClick={() => setCollapsed(previous => expanded ? [...previous, node.id] : previous.filter(id => id !== node.id))}>
            <ChevronRight size={14} className={expanded ? 'rotate-90' : ''} />
          </Button> : <span className="size-6 shrink-0" />}
          <button type="button" disabled={!ready} onClick={() => editNode(node)} className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1 text-left text-sm">
            <Folder size={15} className="shrink-0 text-primary-text" /><span className="truncate">{node.nodeName}</span>
          </button>
          <Button variant="ghost" tone="brand" size="icon-xs" title="添加子节点" aria-label={`添加子节点 ${node.nodeName}`} disabled={!ready} onClick={() => addNode(node)}><Plus size={14} /></Button>
          <Button variant="ghost" tone="brand" size="icon-xs" title="编辑节点" aria-label={`编辑节点 ${node.nodeName}`} disabled={!ready} onClick={() => editNode(node)}><Pencil size={14} /></Button>
          <Button variant="ghost" size="icon-xs" title="上移" aria-label={`上移 ${node.nodeName}`} disabled={!ready || index < 1} onClick={() => void run(() => moveNode(node, siblings[index - 1]))}><ArrowUp size={14} /></Button>
          <Button variant="ghost" size="icon-xs" title="下移" aria-label={`下移 ${node.nodeName}`} disabled={!ready || index < 0 || index >= siblings.length - 1} onClick={() => void run(() => moveNode(node, siblings[index + 1]))}><ArrowDown size={14} /></Button>
          <Button variant="ghost" tone="danger" size="icon-xs" title={hasChildren ? '请先删除子节点' : '删除节点'} aria-label={`删除节点 ${node.nodeName}`} disabled={!ready || hasChildren} onClick={() => setDeleting({ kind: 'node', id: node.id, name: node.nodeName })}><Trash2 size={14} /></Button>
        </div>
        {expanded && renderNodes(branch, depth + 1)}
      </div>;
    });
  }

  return <ListPageLayout scrollMode="table">
    <ListPageHeader>
      <header className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary-text"><Network size={20} /></span>
        <div><h1 className="text-base font-semibold">组织树管理</h1><p className="mt-1 text-xs text-muted-foreground">左侧维护树分类，右侧维护对应分类的多级节点</p></div>
      </header>
      {(categories.error || nodes.error) && <p role="alert" className="text-sm text-destructive">{(categories.error || nodes.error)?.message}</p>}
    </ListPageHeader>
    <ListPageContent>
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,2fr)] gap-4 lg:grid-cols-[minmax(250px,1fr)_minmax(0,3fr)] lg:grid-rows-1">
        <section aria-label="树分类目录" className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <header className="shrink-0 space-y-3 border-b border-border p-3">
            <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">树分类目录</h2>
              <Button size="sm" disabled={busy} onClick={() => setEditor({ kind: 'category' })}><Plus size={14} />注册</Button>
            </div>
            <Input aria-label="搜索树分类" placeholder="搜索树分类..." value={categorySearch} onChange={event => setCategorySearch(event.target.value)} />
          </header>
          <div className="min-h-0 flex-1 space-y-1 overflow-auto p-2">
            {visibleCategories.map(category => {
              const cached = category.id === active?.id ? nodes.data : client.getQueryData<Node[]>(['organization-tree-nodes', tenant, category.id]);
              return <div key={category.id} className={`flex items-center gap-1 rounded-lg p-1 ${active?.id === category.id ? 'bg-primary/10' : 'hover:bg-accent'}`}>
              <button type="button" aria-pressed={active?.id === category.id} disabled={busy} className="min-w-0 flex-1 px-2 py-1 text-left"
                onClick={() => setCategoryId(category.id)}>
                <span className="block truncate text-sm font-medium">{category.name}</span>
                <span className="block truncate font-mono text-xs text-muted-foreground">{category.code}</span>
              </button>
              {cached && <Badge variant="secondary" size="compact">{flatten(cached).length} 节点</Badge>}
              <Button variant="ghost" tone="brand" size="icon-xs" title="修改树分类" aria-label={`修改树分类 ${category.name}`} disabled={busy} onClick={() => setEditor({ kind: 'category', item: category })}><Pencil size={14} /></Button>
              <Button variant="ghost" tone="danger" size="icon-xs" title="删除树分类" aria-label={`删除树分类 ${category.name}`} disabled={busy} onClick={() => setDeleting({ kind: 'category', id: category.id, name: category.name })}><Trash2 size={14} /></Button>
            </div>;
            })}
            {!visibleCategories.length && <p className="p-4 text-center text-sm text-muted-foreground">
              {categories.isPending ? '正在加载树分类…' : categories.isError ? '树分类加载失败' : list.length ? '暂无匹配树分类' : '暂无树分类，请先注册'}
            </p>}
          </div>
        </section>
        <section aria-label="树节点" className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <header className="shrink-0 space-y-3 border-b border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><h2 className="text-sm font-semibold">{active ? `${active.name} 树形结构` : '请选择树分类'}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{active?.description || '统一维护组织树、分类树等多层级节点数据'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled={!active || busy || nodes.isFetching} onClick={() => void nodes.refetch()}><RefreshCw size={14} />刷新</Button>
                <Button variant="outline" size="sm" disabled={!active} onClick={() => setCollapsed([])}>全部展开</Button>
                <Button variant="outline" size="sm" disabled={!active} onClick={() => setCollapsed(flat.filter(node => node.childList?.length).map(node => node.id))}>全部折叠</Button>
                <Button size="sm" disabled={!ready} onClick={() => addNode()}><Plus size={14} />新增根节点</Button>
              </div>
            </div>
            <div className="flex max-w-sm gap-1">
              <Input aria-label="搜索节点名称" placeholder="搜索节点名称..." value={nodeSearch} onChange={event => { setNodeSearch(event.target.value); setCollapsed([]); }} />
              {nodeSearch && <Button variant="ghost" size="icon-sm" aria-label="清空节点搜索" onClick={() => setNodeSearch('')}><X size={14} /></Button>}
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            {!active ? <p className="py-10 text-center text-sm text-muted-foreground">请先在左侧选择树分类</p>
              : nodes.isPending ? <p className="py-10 text-center text-sm text-muted-foreground">加载中…</p>
              : nodes.isError ? <p className="py-10 text-center text-sm text-muted-foreground">树节点加载失败</p>
              : visibleNodes.length ? renderNodes(visibleNodes)
              : <div className="space-y-2 py-10 text-center text-sm text-muted-foreground">
                <p>{term ? '暂无匹配节点' : '暂无树节点数据'}</p>
                {!term && <Button variant="ghost" tone="brand" size="sm" disabled={!ready} onClick={() => addNode()}>立即创建第一个根节点</Button>}
              </div>}
          </div>
        </section>
      </div>
    </ListPageContent>
    {editor && <TreeEditor editor={editor} busy={busy} close={() => setEditor(null)} save={payload => void run(async () => {
      await write(editor.kind, editor.item ? 'update' : 'save', payload);
      setEditor(null);
      if (editor.kind === 'category') await categories.refetch();
      else await nodes.refetch();
      toast.success('保存成功');
    })} />}
    {deleting && <Dialog open onOpenChange={open => { if (!open && !busy) setDeleting(null); }}>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader><DialogTitle>确认删除</DialogTitle>
          <DialogDescription>{deleting.kind === 'category'
            ? `确定删除树分类「${deleting.name}」吗？此操作也会删除该分类下的所有节点。`
            : `确定删除节点「${deleting.name}」吗？`}</DialogDescription>
        </DialogHeader>
        <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>取消</Button>
          <Button variant="destructive" disabled={busy} onClick={() => void run(async () => {
            await write(deleting.kind, 'deleteBatch', [deleting.id]);
            setDeleting(null);
            if (deleting.kind === 'category') await categories.refetch();
            else await nodes.refetch();
            toast.success('删除成功');
          })}>删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>}
  </ListPageLayout>;
}
