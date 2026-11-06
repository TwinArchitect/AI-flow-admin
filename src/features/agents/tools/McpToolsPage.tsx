import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Search, Terminal, Pencil, Trash2, Play, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { ListPageLayout, ListPageHeader, ListPageContent, ListPageFooter } from '@/components/layout/ListPageLayout';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { HttpChoice } from './components/HttpToolEditor';
import { McpToolEditor, McpToolList } from './components/McpToolEditor';
import { mcpFromVo, mcpPayload, mcpToolsPayload, newMcpForm, type McpForm } from './mcpContracts';
import type { McpServerVO, McpToolVO, McpInvokeResult } from './mcpTypes';
import * as api from './mcpApi';
const KEY = ['mcp-servers'];

export function McpToolsPage() {
  const client = useQueryClient();
  const [name, setName] = useState('');
  const [filters, setFilters] = useState({ name: '', status: 'all', transport: 'all', current: 1, size: 12 });
  const [editor, setEditor] = useState<McpForm | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string[] | null>(null);
  const [manager, setManager] = useState<McpServerVO | null>(null);
  const [tools, setTools] = useState<McpToolVO[]>([]);
  const [hint, setHint] = useState('');
  const [toolName, setToolName] = useState('');
  const [args, setArgs] = useState('{}');
  const [result, setResult] = useState<McpInvokeResult | null>(null);
  const list = useQuery({ queryKey: [...KEY, filters], queryFn: () => api.queryMcpServers({ ...filters, status: filters.status === 'all' ? undefined : Number(filters.status) as 0 | 1, transport: filters.transport === 'all' ? undefined : filters.transport }) });
  const records = list.data?.records ?? [];
  const total = Number(list.data?.total ?? 0);
  const pages = Math.max(1, Math.ceil(total / filters.size));
  useEffect(() => { setSelected([]); }, [filters, list.data]);
  useEffect(() => { if (list.data && !list.isFetching && filters.current > pages) setFilters((prev) => ({ ...prev, current: pages })); }, [list.data, list.isFetching, filters.current, pages]);
  const refresh = () => client.invalidateQueries({ queryKey: KEY });
  const save = useMutation({ mutationFn: async (form: McpForm) => {
    const saved = await api.saveMcpServer(mcpPayload(form));
    // 白名单更新失败时保留已创建 ID，重试不会重复创建。
    setEditor((current) => current ? { ...current, id: saved.id } : current);
    if (form.tools.length) {
      if (!form.id && form.transport !== 'stdio') {
        const synced = await api.syncMcpTools(saved.id);
        if (!synced.success) throw new Error(synced.message || synced.lastError || '工具同步失败，请保存后重试同步');
      }
      await api.enableMcpTools(mcpToolsPayload(saved.id, form.tools));
    }
  }, onSuccess: async () => { setEditor(null); await refresh(); toast.success('MCP 服务已保存'); }, onError: (error) => toast.error(error.message) });
  const detail = useMutation({ mutationFn: ({ id, action }: { id: string; action: 'edit' | 'manage' }) => api.getMcpServer(id).then((server) => ({ server, action })), onSuccess: ({ server, action }) => {
    if (action === 'edit') setEditor(mcpFromVo(server));
    else { setManager(server); setTools(server.tools ?? []); setHint(''); setResult(null); setToolName(server.tools?.find((tool) => tool.enabled !== false)?.toolName || ''); setArgs('{}'); }
  }, onError: (error) => toast.error(error.message) });
  const toggle = useMutation({ mutationFn: async (id: string) => { const server = await api.getMcpServer(id); return api.saveMcpServer({ ...mcpPayload(mcpFromVo(server)), status: Number(server.status) === 1 ? 0 : 1 }); }, onSuccess: refresh, onError: (error) => toast.error(error.message) });
  const remove = useMutation({ mutationFn: () => { if (!deleting?.length) throw new Error('请选择服务'); return deleting.length === 1 ? api.deleteMcpServer(deleting[0]) : api.deleteMcpServersBatch(deleting); }, onSuccess: async () => { setDeleting(null); await refresh(); toast.success('MCP 服务已删除'); }, onError: (error) => toast.error(error.message) });
  const connect = useMutation({ mutationFn: async (sync: boolean) => { if (!manager) throw new Error('请选择服务'); if (manager.transport === 'stdio') throw new Error('stdio 仅支持保存'); return sync ? api.syncMcpTools(manager.id) : api.testMcpConnect({ id: manager.id }); }, onSuccess: async (value) => {
    setHint(value.success ? `连接成功（${value.durationMs ?? 0}ms），发现 ${value.tools?.length ?? 0} 个工具` : value.message || value.lastError || '连接失败');
    if (value.success && manager) { const server = await api.getMcpServer(manager.id); setManager(server); setTools(server.tools ?? value.tools ?? []); setToolName((prev) => server.tools?.some((tool) => tool.toolName === prev && tool.enabled !== false) ? prev : server.tools?.find((tool) => tool.enabled !== false)?.toolName || ''); }
    await refresh();
  }, onError: (error) => { setHint(error.message); toast.error(error.message); } });
  const whitelist = useMutation({ mutationFn: () => { if (!manager) throw new Error('请选择服务'); return api.enableMcpTools(mcpToolsPayload(manager.id, tools)); }, onSuccess: async () => { setHint('工具启用与别名已保存'); setResult(null); await refresh(); toast.success('工具配置已保存'); }, onError: (error) => toast.error(error.message) });
  const invoke = useMutation({ mutationFn: () => {
    if (!manager || manager.transport === 'stdio' || Number(manager.status) === 1) throw new Error('请使用已启用的远程 MCP 服务');
    if (!toolName) throw new Error('请选择工具');
    const parsed: unknown = JSON.parse(args.trim() || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('调用参数必须为 JSON 对象');
    setResult(null); return api.invokeMcpTool({ serverId: manager.id, toolName, arguments: parsed as Record<string, unknown> });
  }, onSuccess: (value) => { setResult(value); if (!value.success) toast.error(value.message || '调用失败'); void refresh(); }, onError: (error) => toast.error(error.message) });
  const managerBusy = connect.isPending || whitelist.isPending || invoke.isPending;

  return <ListPageLayout>
    <ListPageHeader><header className="flex flex-wrap items-center gap-4 border-b border-border pb-4"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Terminal size={20} /></div><div><h1 className="text-base font-semibold">MCP 工具</h1><p className="mt-1 text-xs text-muted-foreground">管理 MCP 服务连接、工具发现与调用配置</p></div></div><div className="ml-auto flex gap-2"><Button variant="outline" size="sm" disabled={list.isFetching} onClick={() => void refresh()}><RefreshCw size={14} />刷新</Button><Button size="sm" onClick={() => setEditor(newMcpForm())}><Plus size={14} />注册 MCP 服务</Button></div></header>
      <form className="flex flex-wrap items-center gap-3" onSubmit={(event) => { event.preventDefault(); setFilters((prev) => ({ ...prev, name: name.trim(), current: 1 })); }}><Input aria-label="搜索 MCP 服务" placeholder="搜索服务名称" className="w-full sm:w-64" value={name} onChange={(event) => setName(event.target.value)} /><div className="w-36"><HttpChoice label="MCP 状态筛选" value={filters.status} values={[{ value: 'all', label: '全部状态' }, { value: '0', label: '已启用' }, { value: '1', label: '已停用' }]} onChange={(status) => setFilters((prev) => ({ ...prev, status, current: 1 }))} /></div><div className="w-44"><HttpChoice label="MCP 协议筛选" value={filters.transport} values={[{ value: 'all', label: '全部协议' }, { value: 'streamable_http', label: 'Streamable HTTP' }, { value: 'sse', label: 'SSE' }, { value: 'stdio', label: 'stdio' }]} onChange={(transport) => setFilters((prev) => ({ ...prev, transport, current: 1 }))} /></div><Button type="submit" size="sm" variant="outline"><Search size={14} />查询</Button><span className="mr-auto text-xs text-muted-foreground">共 {total} 个服务</span><Button type="button" size="sm" variant="outline" disabled={!selected.length || remove.isPending} onClick={() => setDeleting([...selected])}><Trash2 size={14} />删除所选（{selected.length}）</Button></form>
      {list.isError && <p role="alert" className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive">{list.error.message}</p>}
    </ListPageHeader>
    <ListPageContent>{list.isLoading ? <p className="py-20 text-center text-sm text-muted-foreground">正在加载服务…</p> : !records.length ? <div className="rounded-xl border border-dashed border-border py-20 text-center text-sm text-muted-foreground">{list.isError ? '加载失败，请刷新重试' : '暂无匹配的 MCP 服务'}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{records.map((server) => <article key={server.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-5"><div className="mb-4 flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">{/^https?:\/\//i.test(server.avatar || server.iconUrl || '') ? <img src={server.avatar || server.iconUrl || ''} alt="" className="size-full object-cover" /> : <Terminal size={19} />}</div><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold" title={server.name}>{server.name}</h2><p className="mt-1 truncate text-xs text-muted-foreground">{server.serverKey}</p></div><Checkbox aria-label={`选择 MCP ${server.name}`} checked={selected.includes(server.id)} onCheckedChange={(value) => setSelected((prev) => value ? [...prev, server.id] : prev.filter((id) => id !== server.id))} /></div><p className="mb-4 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{server.description || '暂无描述'}</p><div className="flex items-center gap-2"><Badge variant="secondary">{server.transport}</Badge><span className="truncate text-xs text-muted-foreground">{server.transport === 'stdio' ? server.command : server.url}</span></div><div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Badge variant="outline">{server.category || '实用工具'}</Badge><span className="ml-auto">调用 {server.usageCount ?? 0} 次</span></div>{server.lastError && <p className="mt-3 line-clamp-2 text-xs text-destructive">{server.lastError}</p>}<div className="mt-4 flex items-center gap-1 border-t border-border pt-3"><Switch aria-label={`启用 MCP ${server.name}`} checked={Number(server.status) !== 1} disabled={toggle.isPending} onCheckedChange={() => toggle.mutate(server.id)} /><span className="mr-auto ml-1 text-xs text-muted-foreground">{Number(server.status) === 1 ? '已停用' : '已启用'}</span><Button tone="brand" variant="ghost" size="icon-sm" disabled={detail.isPending} aria-label={`编辑 MCP ${server.name}`} onClick={() => detail.mutate({ id: server.id, action: 'edit' })}><Pencil size={14} /></Button><Button variant="ghost" size="icon-sm" disabled={detail.isPending} aria-label={`管理工具 ${server.name}`} onClick={() => detail.mutate({ id: server.id, action: 'manage' })}><Settings2 size={14} /></Button><Button tone="success" variant="ghost" size="icon-sm" disabled={detail.isPending || server.transport === 'stdio'} aria-label={`调试 MCP ${server.name}`} onClick={() => detail.mutate({ id: server.id, action: 'manage' })}><Play size={14} /></Button><Button tone="danger" variant="ghost" size="icon-sm" disabled={remove.isPending} aria-label={`删除 MCP ${server.name}`} onClick={() => setDeleting([server.id])}><Trash2 size={14} /></Button></div></article>)}</div>}</ListPageContent>
    <ListPageFooter><Pagination page={filters.current} pageCount={pages} pageSize={filters.size} total={total} disabled={list.isFetching} onPageChange={(current) => setFilters((prev) => ({ ...prev, current }))} onPageSizeChange={(size) => setFilters((prev) => ({ ...prev, size, current: 1 }))} /></ListPageFooter>
    {editor && <McpToolEditor initial={editor} busy={save.isPending} onClose={() => setEditor(null)} onSave={(form) => save.mutate(form)} />}
    <Dialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !remove.isPending) setDeleting(null); }}><DialogContent><DialogHeader><DialogTitle>删除 MCP 服务</DialogTitle><DialogDescription>确认删除选中的 {deleting?.length ?? 0} 个服务及其工具配置？删除后无法恢复。</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={remove.isPending} onClick={() => setDeleting(null)}>取消</Button><Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate()}>{remove.isPending ? '删除中…' : '确认删除'}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(manager)} onOpenChange={(open) => { if (!open && !managerBusy) setManager(null); }}><DialogContent className="sm:max-w-4xl max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>MCP 工具管理 · {manager?.name}</DialogTitle><DialogDescription>发现和同步工具，维护启用状态与调用别名，并执行调用测试。</DialogDescription></DialogHeader><div className="space-y-5"><p className="break-all text-xs text-muted-foreground">{manager?.transport} · {manager?.url || manager?.command}</p><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={managerBusy || manager?.transport === 'stdio'} onClick={() => connect.mutate(false)}>测试连接</Button><Button variant="outline" size="sm" disabled={managerBusy || manager?.transport === 'stdio'} onClick={() => connect.mutate(true)}><RefreshCw size={14} />同步工具</Button><Button size="sm" disabled={managerBusy} onClick={() => whitelist.mutate()}>保存工具配置</Button></div>{hint && <p role="status" className="rounded-lg border border-border bg-muted/20 p-3 text-xs">{hint}</p>}<McpToolList tools={tools} onChange={setTools} disabled={managerBusy} /><section className="space-y-3 border-t border-border pt-4"><h3 className="text-sm font-semibold">工具试运行</h3><HttpChoice label="调用工具" value={toolName || '__none__'} disabled={managerBusy} values={[{ value: '__none__', label: '选择已启用工具' }, ...tools.filter((tool) => tool.enabled !== false).map((tool) => ({ value: tool.toolName, label: tool.nameAlias || tool.toolName }))]} onChange={(value) => { setToolName(value === '__none__' ? '' : value); setResult(null); }} /><Textarea aria-label="MCP 调用参数" rows={5} className="font-mono text-xs" disabled={managerBusy} value={args} onChange={(event) => setArgs(event.target.value)} /><div className="flex gap-2"><Button disabled={managerBusy || !toolName || manager?.transport === 'stdio' || Number(manager?.status) === 1} onClick={() => invoke.mutate()}>{invoke.isPending ? '调用中…' : '试运行'}</Button><Button variant="ghost" disabled={managerBusy} onClick={() => setResult(null)}>清除结果</Button></div>{manager?.transport === 'stdio' && <p className="text-xs text-muted-foreground">stdio 仅支持保存，不可试运行。</p>}{result && <section aria-label="MCP 调用结果" className="space-y-3 rounded-xl border border-border bg-muted/20 p-4"><div className="flex items-center gap-3"><Badge variant={result.success ? 'success' : 'danger'}>{result.success ? '调用成功' : '调用失败'}</Badge><span className="text-xs text-muted-foreground">{result.durationMs ?? 0} ms</span></div>{result.message && <p className="text-xs text-muted-foreground">{result.message}</p>}<pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs">{result.content ?? JSON.stringify(result.result ?? result, null, 2)}</pre></section>}</section></div></DialogContent></Dialog>
  </ListPageLayout>;
}
