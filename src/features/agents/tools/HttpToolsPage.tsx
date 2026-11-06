import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link2, Plus, RefreshCw, Play, Pencil, Trash2, Search, Globe, Code2, Server } from 'lucide-react';
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
import { HttpChoice, HttpToolEditor } from './components/HttpToolEditor';
import { makeDebugInputs, sampleDebugInputs, newHttpTool } from './httpContracts';
import type { HttpToolVO, HttpToolSavePayload, HttpDebugResult } from './httpTypes';
import * as api from './httpToolApi';
const KEY = ['http-tools'];

export function HttpToolsPage() {
  const client = useQueryClient();
  const [name, setName] = useState('');
  const [filters, setFilters] = useState({ name: '', status: 'all', current: 1, size: 12 });
  const [editor, setEditor] = useState<HttpToolSavePayload | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string[] | null>(null);
  const [debugTool, setDebugTool] = useState<HttpToolVO | null>(null);
  const [inputs, setInputs] = useState('{}');
  const [result, setResult] = useState<HttpDebugResult | null>(null);
  const [mode, setMode] = useState('');
  const list = useQuery({ queryKey: [...KEY, filters], queryFn: () => api.queryHttpTools({ ...filters, status: filters.status === 'all' ? undefined : Number(filters.status) as 0 | 1 }) });
  const records = list.data?.records ?? [];
  const total = Number(list.data?.total ?? 0);
  const pages = Math.max(1, Math.ceil(total / filters.size));
  useEffect(() => { setSelected([]); }, [filters, list.data]);
  useEffect(() => { if (list.data && !list.isFetching && filters.current > pages) setFilters((prev) => ({ ...prev, current: pages })); }, [list.data, list.isFetching, filters.current, pages]);
  const refresh = () => client.invalidateQueries({ queryKey: KEY });
  const save = useMutation({ mutationFn: api.saveHttpTool, onSuccess: async () => { setEditor(null); await refresh(); toast.success('工具已保存'); }, onError: (error) => toast.error(error.message) });
  const detail = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'edit' | 'debug' }) => api.getHttpTool(id).then((tool) => ({ tool, action })),
    onSuccess: ({ tool, action }) => {
      if (action === 'edit') setEditor({ ...newHttpTool(), ...tool, toolName: tool.toolName || '', avatar: tool.avatar || tool.iconUrl || 'plugin-avatar:link', description: tool.description || '', category: tool.category || '实用工具', timeoutMs: tool.timeoutMs ?? 30000, bodyType: tool.bodyType || 'none', bodyContent: tool.bodyContent || '', status: Number(tool.status) === 1 ? 1 : 0, inputParams: tool.inputParams ?? [], requestParams: tool.requestParams ?? [], requestHeaders: tool.requestHeaders ?? [], authorType: tool.authorType || 'custom' });
      else {
        setDebugTool(tool); setResult(null); setMode('');
        setInputs(sampleDebugInputs(tool.inputParams ?? []));
      }
    }, onError: (error) => toast.error(error.message),
  });
  const toggle = useMutation({ mutationFn: async (id: string) => {
    const tool = await api.getHttpTool(id);
    return api.saveHttpTool({ ...tool, toolName: tool.toolName ?? '', description: tool.description ?? '', category: tool.category ?? '', avatar: tool.avatar || tool.iconUrl || 'plugin-avatar:link', status: Number(tool.status) === 1 ? 0 : 1, timeoutMs: tool.timeoutMs ?? 30000, bodyType: tool.bodyType || 'none', bodyContent: tool.bodyContent || '', authorType: tool.authorType || 'custom', inputParams: tool.inputParams ?? [], requestParams: tool.requestParams ?? [], requestHeaders: tool.requestHeaders ?? [] });
  }, onSuccess: refresh, onError: (error) => toast.error(error.message) });
  const remove = useMutation({ mutationFn: () => { if (!deleting?.length) throw new Error('请选择工具'); return deleting.length === 1 ? api.deleteHttpTool(deleting[0]) : api.deleteHttpToolsBatch(deleting); }, onSuccess: async () => { setDeleting(null); await refresh(); toast.success('工具已删除'); }, onError: (error) => toast.error(error.message) });
  const debug = useMutation({ mutationFn: (invoke: boolean) => {
    if (!debugTool) throw new Error('请选择工具');
    if (invoke && Number(debugTool.status) === 1) throw new Error('请先启用工具后再试运行');
    setMode(invoke ? '试运行' : '调试'); setResult(null);
    return api.debugHttpTool({ id: debugTool.id, inputs: makeDebugInputs(inputs) }, invoke);
  }, onSuccess: (value) => { setResult(value); if (!value.success) toast.error(value.message || '请求执行失败'); void refresh(); }, onError: (error) => toast.error(error.message) });

  return <ListPageLayout>
    <ListPageHeader>
    <header className="flex shrink-0 flex-wrap items-center gap-4 border-b border-border pb-4"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Link2 size={20} /></div><div><h1 className="text-base font-semibold">HTTP 工具</h1><p className="mt-1 text-xs text-muted-foreground">连接业务接口，为智能体提供可调用的执行能力</p></div></div><div className="ml-auto flex gap-2"><Button variant="outline" size="sm" disabled={list.isFetching} onClick={() => void refresh()}><RefreshCw size={14} />刷新</Button><Button size="sm" onClick={() => setEditor(newHttpTool())}><Plus size={14} />注册 HTTP 工具</Button></div></header>
    <form className="flex flex-wrap items-center gap-3" onSubmit={(event) => { event.preventDefault(); setFilters((prev) => ({ ...prev, name: name.trim(), current: 1 })); }}><Input aria-label="搜索 HTTP 工具" placeholder="搜索工具名称" className="w-full sm:w-64" value={name} onChange={(event) => setName(event.target.value)} /><div className="w-36"><HttpChoice label="工具状态筛选" value={filters.status} values={[{ value: 'all', label: '全部状态' }, { value: '0', label: '已启用' }, { value: '1', label: '已停用' }]} onChange={(status) => setFilters((prev) => ({ ...prev, status, current: 1 }))} /></div><Button type="submit" variant="outline" size="sm"><Search size={14} />查询</Button><span className="mr-auto text-xs text-muted-foreground">共 {total} 个工具</span><Button type="button" variant="outline" size="sm" disabled={!selected.length || remove.isPending} onClick={() => setDeleting([...selected])}><Trash2 size={14} />删除所选（{selected.length}）</Button></form>
      {list.isError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{list.error.message}</p>}
    </ListPageHeader>
    <ListPageContent>
      {list.isLoading ? <p className="py-20 text-center text-sm text-muted-foreground">正在加载工具…</p> : records.length === 0 ? <div className="rounded-xl border border-dashed border-border py-20 text-center text-sm text-muted-foreground">{list.isError ? '加载失败，请刷新重试' : '暂无匹配的 HTTP 工具'}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{records.map((tool) => {
        const avatar = tool.avatar || tool.iconUrl || ''; const remoteAvatar = /^https?:\/\//i.test(avatar); const Icon = avatar.includes('globe') ? Globe : avatar.includes('code') ? Code2 : avatar.includes('server') ? Server : Link2;
        return <article key={tool.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-5"><div className="mb-4 flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">{remoteAvatar ? <img src={avatar} alt="" className="size-full object-cover" /> : <Icon size={19} />}</div><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold" title={tool.name}>{tool.name}</h2><p className="mt-1 truncate text-xs text-muted-foreground">{tool.toolName || '未设置调用名称'}</p></div><Checkbox aria-label={`选择工具 ${tool.name}`} checked={selected.includes(tool.id)} onCheckedChange={(checked) => setSelected((prev) => checked ? [...prev, tool.id] : prev.filter((id) => id !== tool.id))} /></div><p className="mb-4 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{tool.description || '暂无描述'}</p><div className="flex items-center gap-2"><Badge variant="secondary">{tool.method}</Badge><span className="truncate text-xs text-muted-foreground" title={tool.baseUrl}>{tool.baseUrl}</span></div><div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><Badge variant="outline">{tool.category || '实用工具'}</Badge><span>{tool.authorType === 'official' ? '官方插件' : tool.authorType === 'third_party' ? '第三方接入' : '用户自定义'}</span><span className="ml-auto">调用 {tool.usageCount ?? 0} 次</span></div><div className="mt-4 flex items-center gap-1 border-t border-border pt-3"><Switch aria-label={`启用工具 ${tool.name}`} checked={Number(tool.status) !== 1} disabled={toggle.isPending} onCheckedChange={() => toggle.mutate(tool.id)} /><span className="mr-auto ml-1 text-xs text-muted-foreground">{Number(tool.status) === 1 ? '已停用' : '已启用'}</span><Button tone="brand" variant="ghost" size="icon-sm" aria-label={`编辑工具 ${tool.name}`} disabled={detail.isPending} onClick={() => detail.mutate({ id: tool.id, action: 'edit' })}><Pencil size={14} /></Button><Button tone="success" variant="ghost" size="icon-sm" aria-label={`调试工具 ${tool.name}`} disabled={detail.isPending} onClick={() => detail.mutate({ id: tool.id, action: 'debug' })}><Play size={14} /></Button><Button tone="danger" variant="ghost" size="icon-sm" aria-label={`删除工具 ${tool.name}`} disabled={remove.isPending} onClick={() => setDeleting([tool.id])}><Trash2 size={14} /></Button></div></article>;
      })}</div>}
    </ListPageContent>
    <ListPageFooter>
      <Pagination page={filters.current} pageCount={pages} pageSize={filters.size} total={total} onPageChange={(current) => setFilters((prev) => ({ ...prev, current }))} onPageSizeChange={(size) => setFilters((prev) => ({ ...prev, size, current: 1 }))} disabled={list.isFetching} />
    </ListPageFooter>
    {editor && <HttpToolEditor initial={editor} busy={save.isPending} onClose={() => setEditor(null)} onSave={(value) => save.mutate(value)} />}
    <Dialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !remove.isPending) setDeleting(null); }}><DialogContent><DialogHeader><DialogTitle>删除 HTTP 工具</DialogTitle><DialogDescription>确认删除选中的 {deleting?.length ?? 0} 个工具？删除后无法恢复。</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={remove.isPending} onClick={() => setDeleting(null)}>取消</Button><Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate()}>{remove.isPending ? '删除中…' : '确认删除'}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(debugTool)} onOpenChange={(open) => { if (!open && !debug.isPending) setDebugTool(null); }}><DialogContent className="sm:max-w-3xl max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>调试 HTTP 工具 · {debugTool?.name}</DialogTitle><DialogDescription>调试可验证保存的请求配置；试运行要求工具已启用，并计入调用次数。</DialogDescription></DialogHeader><div className="space-y-4"><p className="break-all text-xs text-muted-foreground">{debugTool?.method} {debugTool?.baseUrl}</p><Textarea aria-label="调试输入参数" rows={6} className="font-mono text-xs" disabled={debug.isPending} value={inputs} onChange={(event) => setInputs(event.target.value)} /><div className="flex gap-2"><Button variant="outline" disabled={debug.isPending} onClick={() => debug.mutate(false)}>{debug.isPending && mode === '调试' ? '调试中…' : '开始调试'}</Button><Button disabled={debug.isPending || Number(debugTool?.status) === 1} onClick={() => debug.mutate(true)}>{debug.isPending && mode === '试运行' ? '试运行中…' : '试运行'}</Button><Button variant="ghost" disabled={debug.isPending} onClick={() => setResult(null)}>清除结果</Button></div>{result && <section aria-label="HTTP 调试结果" className="space-y-3 rounded-xl border border-border bg-muted/20 p-4"><div className="flex flex-wrap gap-3 text-xs"><Badge variant={result.success ? 'success' : 'danger'}>{result.success ? '执行成功' : '执行失败'}</Badge><span>HTTP {result.statusCode ?? '—'}</span><span>{result.durationMs ?? 0} ms</span></div>{result.message && <p className="text-xs text-muted-foreground">{result.message}</p>}<details><summary className="cursor-pointer text-xs font-medium">实际请求</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(result.request, null, 2)}</pre></details><pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-background p-3 text-xs">{result.responseBody || '（空响应）'}</pre></section>}</div></DialogContent></Dialog>
  </ListPageLayout>;
}
