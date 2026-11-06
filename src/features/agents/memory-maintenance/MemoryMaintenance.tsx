import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Brain, Pin, Plus, RefreshCw, Search, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { queryAgents } from '../api/agentApi';
import * as api from './memoryApi';
import type { MemoryItemVo, MemoryRecallDebugVo } from './types';
import { MEMORY_TYPE_OPTIONS, formatMemoryTime, memorySourceLabel, memoryStrategyLabel, memoryTypeLabel } from './utils';

const EMPTY = { agentId: '', content: '', memoryType: 'fact', memoryKey: '', pinned: false };
const ROOT_KEY = ['agent-memories'];
const NO_AGENTS: { id: string; agentName: string }[] = [];

function Choice({ value, onChange, label, children, disabled = false }: { value: string; onChange: (value: string) => void; label: string; children: ReactNode; disabled?: boolean }) {
  return <Select value={value || '__all__'} onValueChange={(next) => onChange(next === '__all__' ? '' : next)} disabled={disabled}><SelectTrigger aria-label={label} className="w-full"><SelectValue placeholder={label} /></SelectTrigger><SelectContent>{children}</SelectContent></Select>;
}

export default function MemoryMaintenance() {
  const client = useQueryClient();
  const [tab, setTab] = useState('archive');
  const [keywordInput, setKeywordInput] = useState('');
  const [agentNameInput, setAgentNameInput] = useState('');
  const [filters, setFilters] = useState({ keyword: '', agentName: '', agentId: '', memoryType: '', current: 1, size: 20 });
  const [selected, setSelected] = useState<string[]>([]);
  const [editor, setEditor] = useState<{ item: MemoryItemVo | null } | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmation, setConfirmation] = useState<{ kind: 'delete' | 'batch' | 'clear'; ids: string[]; name?: string } | null>(null);
  const [testAgentId, setTestAgentId] = useState('');
  const [question, setQuestion] = useState('');
  const [topK, setTopK] = useState('8');
  const [recall, setRecall] = useState<MemoryRecallDebugVo | null>(null);
  const recallSequence = useRef(0);
  const agentsQuery = useQuery({ queryKey: ['memory-agents'], queryFn: () => queryAgents({ pageNum: 1, pageSize: 200 }) });
  const agents = agentsQuery.data?.records ?? NO_AGENTS;
  const list = useQuery({ queryKey: [...ROOT_KEY, filters], queryFn: () => api.queryMemories(filters) });
  const memories = list.data?.records ?? [];
  const total = Number(list.data?.total ?? 0);
  const pages = Math.max(1, Math.ceil(total / filters.size));
  useEffect(() => { setSelected([]); }, [filters, list.data]);
  useEffect(() => {
    if (list.data && !list.isFetching && filters.current > pages) setFilters((prev) => ({ ...prev, current: pages }));
  }, [list.data, list.isFetching, filters.current, pages]);
  useEffect(() => { if (!testAgentId && agents.length) setTestAgentId(agents[0].id); }, [testAgentId, agents]);
  const refresh = () => {
    ++recallSequence.current;
    setRecall(null);
    return client.invalidateQueries({ queryKey: ROOT_KEY });
  };
  const save = useMutation({
    mutationFn: () => {
      if (!form.content.trim()) throw new Error('请填写记忆正文');
      if (!editor?.item && !form.agentId) throw new Error('请选择智能体');
      const payload = { content: form.content.trim(), memoryType: form.memoryType, memoryKey: form.memoryKey.trim() || undefined, pinned: form.pinned };
      return editor?.item ? api.updateMemory({ id: editor.item.id, ...payload }) : api.saveMemory({ agentId: form.agentId, ...payload });
    },
    onSuccess: async () => { setEditor(null); await refresh(); toast.success('记忆已保存'); },
    onError: (error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: async () => {
      if (!confirmation) return;
      if (confirmation.kind === 'clear') return api.clearMemories(confirmation.ids[0]);
      if (confirmation.kind === 'batch') return api.deleteMemoriesBatch(confirmation.ids);
      return api.deleteMemory(confirmation.ids[0]);
    },
    onSuccess: async () => { setConfirmation(null); setSelected([]); await refresh(); toast.success('记忆已删除'); },
    onError: (error) => toast.error(error.message),
  });
  const pin = useMutation({ mutationFn: (item: MemoryItemVo) => api.pinMemory(item.id, item.pinned !== 1), onSuccess: refresh, onError: (error) => toast.error(error.message) });
  const debug = useMutation({
    mutationFn: async () => {
      if (!testAgentId || !question.trim()) throw new Error('请选择智能体并输入测试问题');
      const sequence = ++recallSequence.current;
      return { sequence, result: await api.debugMemoryRecall({ agentId: testAgentId, query: question.trim(), topK: Number(topK) }) };
    },
    onSuccess: ({ sequence, result }) => { if (sequence === recallSequence.current) setRecall(result); },
    onError: (error) => { setRecall(null); toast.error(error.message); },
  });
  const edit = (item: MemoryItemVo | null) => {
    setForm(item ? { agentId: item.agentId ?? '', content: item.content ?? '', memoryType: item.memoryType || 'fact', memoryKey: item.memoryKey ?? '', pinned: item.pinned === 1 } : { ...EMPTY, agentId: testAgentId || agents[0]?.id || '' });
    setEditor({ item });
  };
  const changeFilter = (key: 'agentId' | 'memoryType', value: string) => setFilters((prev) => ({ ...prev, [key]: value, current: 1 }));
  const error = list.error || agentsQuery.error;

  return <div className="flex h-full min-h-0 flex-col bg-background">
    <header className="flex shrink-0 flex-wrap items-center gap-4 border-b border-border px-6 py-4">
      <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Brain size={20} /></div><div><h1 className="text-base font-semibold">记忆维护</h1><p className="mt-1 text-xs text-muted-foreground">维护智能体的长期记忆，验证真实召回效果</p></div></div>
      <div className="ml-auto flex gap-2"><Button variant="outline" size="sm" disabled={list.isFetching} onClick={() => { void refresh(); void agentsQuery.refetch(); }}><RefreshCw size={14} />刷新</Button><Button size="sm" onClick={() => edit(null)}><Plus size={14} />新增记忆</Button></div>
    </header>
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden p-4 sm:p-6">
      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error.message}</p>}
      <div className="grid gap-3 sm:grid-cols-3">{[['匹配记忆', total], ['当前页置顶', memories.filter((item) => item.pinned === 1).length], ['当前页对话凝练', memories.filter((item) => item.source === 'extract').length]].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-card px-5 py-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p></div>)}</div>
      <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 overflow-hidden">
        <TabsList><TabsTrigger value="archive">记忆档案</TabsTrigger><TabsTrigger value="simulation">召回调试</TabsTrigger></TabsList>
        <TabsContent value="archive" className="flex min-h-0 flex-col gap-4 overflow-hidden pt-2 data-[state=inactive]:hidden">
          <form className="flex flex-wrap items-center gap-2" onSubmit={(event) => { event.preventDefault(); setFilters((prev) => ({ ...prev, keyword: keywordInput.trim(), agentName: agentNameInput.trim(), current: 1 })); }}>
            <Input aria-label="记忆内容关键词" placeholder="搜索记忆内容" className="w-full sm:w-56" value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} />
            <Input aria-label="智能体名称" placeholder="智能体名称" className="w-full sm:w-44" value={agentNameInput} onChange={(event) => setAgentNameInput(event.target.value)} />
            <div className="w-full sm:w-44"><Choice label="智能体筛选" value={filters.agentId} onChange={(value) => changeFilter('agentId', value)}><SelectItem value="__all__">全部智能体</SelectItem>{agents.map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.agentName}</SelectItem>)}</Choice></div>
            <div className="w-full sm:w-36"><Choice label="记忆类型筛选" value={filters.memoryType} onChange={(value) => changeFilter('memoryType', value)}><SelectItem value="__all__">全部类型</SelectItem>{MEMORY_TYPE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</Choice></div>
            <Button type="submit" variant="outline" size="sm"><Search size={14} />查询</Button>
          </form>
          <div className="flex flex-wrap items-center gap-2"><p className="mr-auto text-xs text-muted-foreground">已选择 {selected.length} 条</p><Button variant="outline" size="sm" disabled={!selected.length || remove.isPending} onClick={() => setConfirmation({ kind: 'batch', ids: [...selected] })}><Trash2 size={14} />批量删除</Button><Button variant="outline" size="sm" disabled={!filters.agentId || remove.isPending} onClick={() => setConfirmation({ kind: 'clear', ids: [filters.agentId], name: agents.find((agent) => agent.id === filters.agentId)?.agentName || filters.agentId })}>清空所选智能体记忆</Button></div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card"><Table scrollable><TableHeader><TableRow><TableHead className="w-10"><Checkbox aria-label="选择当前页全部记忆" checked={memories.length > 0 && selected.length === memories.length ? true : selected.length ? 'indeterminate' : false} onCheckedChange={(checked) => setSelected(checked ? memories.map((item) => item.id) : [])} /></TableHead><TableHead>记忆内容</TableHead><TableHead>所属智能体</TableHead><TableHead>类型 / 来源</TableHead><TableHead>重要度</TableHead><TableHead>更新时间</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>
            {list.isLoading ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">正在加载记忆…</TableCell></TableRow> : memories.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">{list.isError ? '记忆加载失败，请刷新重试' : '暂无记忆，可手动新增或通过智能体对话凝练'}</TableCell></TableRow> : memories.map((item) => <TableRow key={item.id}>
              <TableCell><Checkbox aria-label={`选择记忆 ${item.id}`} checked={selected.includes(item.id)} onCheckedChange={(checked) => setSelected((prev) => checked ? [...prev, item.id] : prev.filter((id) => id !== item.id))} /></TableCell>
              <TableCell className="min-w-64 max-w-lg"><p className="whitespace-pre-wrap break-words text-sm leading-6">{item.content}</p>{item.memoryKey && <p className="mt-1 text-xs text-muted-foreground">稳定键：{item.memoryKey}</p>}{item.pinned === 1 && <Badge variant="secondary" className="mt-2"><Pin size={11} />置顶</Badge>}</TableCell>
              <TableCell><p className="text-sm">{item.agentName || '未命名智能体'}</p><p className="mt-1 text-xs text-muted-foreground">{item.agentId}</p></TableCell><TableCell><Badge variant="outline">{memoryTypeLabel(item.memoryType)}</Badge><p className="mt-2 text-xs text-muted-foreground">{memorySourceLabel(item.source)}</p></TableCell><TableCell>{item.importance ?? '—'}</TableCell><TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatMemoryTime(item.updateTime || item.createTime)}</TableCell>
              <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" aria-label={item.pinned === 1 ? '取消置顶记忆' : '置顶记忆'} disabled={pin.isPending} onClick={() => pin.mutate(item)}><Pin size={14} className={item.pinned === 1 ? 'text-primary' : ''} /></Button><Button tone="brand" variant="ghost" size="icon-sm" aria-label="编辑记忆" onClick={() => edit(item)}><Pencil size={14} /></Button><Button tone="danger" variant="ghost" size="icon-sm" aria-label="删除记忆" disabled={remove.isPending} onClick={() => setConfirmation({ kind: 'delete', ids: [item.id] })}><Trash2 size={14} /></Button></div></TableCell>
            </TableRow>)}
          </TableBody></Table></div>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span>共 {total} 条 · 第 {filters.current} / {pages} 页</span><div className="flex items-center gap-2"><div className="w-28"><Choice label="每页条数" value={String(filters.size)} onChange={(value) => setFilters((prev) => ({ ...prev, size: Number(value), current: 1 }))}>{[10, 20, 50].map((size) => <SelectItem key={size} value={String(size)}>{size} 条 / 页</SelectItem>)}</Choice></div><Button variant="outline" size="sm" disabled={filters.current <= 1 || list.isFetching} onClick={() => setFilters((prev) => ({ ...prev, current: prev.current - 1 }))}>上一页</Button><Button variant="outline" size="sm" disabled={filters.current >= pages || list.isFetching} onClick={() => setFilters((prev) => ({ ...prev, current: prev.current + 1 }))}>下一页</Button></div></div>
        </TabsContent>
        <TabsContent value="simulation" className="min-h-0 overflow-y-auto pt-2"><div className="grid gap-5 lg:grid-cols-3">
          <form className="space-y-4 rounded-xl border border-border bg-card p-5" onSubmit={(event) => { event.preventDefault(); setRecall(null); debug.mutate(); }}><h2 className="text-sm font-semibold">召回测试</h2><div className="space-y-2"><Label>所属智能体</Label><Choice label="测试智能体" value={testAgentId} disabled={debug.isPending} onChange={(value) => { ++recallSequence.current; setTestAgentId(value); setRecall(null); }}><SelectItem value="__all__">请选择智能体</SelectItem>{agents.map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.agentName}</SelectItem>)}</Choice></div><div className="space-y-2"><Label htmlFor="memory-question">模拟用户问题</Label><Textarea id="memory-question" rows={6} disabled={debug.isPending} value={question} onChange={(event) => setQuestion(event.target.value)} /></div><div className="space-y-2"><Label>召回条数 Top K</Label><Choice label="召回条数" value={topK} disabled={debug.isPending} onChange={setTopK}>{[3, 5, 8, 10, 15, 20].map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</Choice></div><Button type="submit" disabled={debug.isPending || !testAgentId || !question.trim()} className="w-full"><Search size={14} />{debug.isPending ? '召回中…' : '运行召回'}</Button><p className="text-xs leading-5 text-muted-foreground">展示实际召回策略、最终注入提示词及向量原始命中。</p></form>
          <div className="space-y-4 lg:col-span-2">{!recall ? <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">{debug.isPending ? '正在检索真实记忆…' : '输入问题并运行召回，查看结果'}</div> : <>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4"><Badge variant="secondary">{memoryStrategyLabel(recall.strategy)}</Badge><span className="text-xs text-muted-foreground">有效记忆 {recall.activeCount ?? 0} 条 · Top K {recall.topK ?? topK} · 返回 {recall.items?.length ?? 0} 条</span><Button variant="ghost" size="sm" className="ml-auto" onClick={() => { ++recallSequence.current; setRecall(null); }}>清除结果</Button></div>
            <details open className="rounded-xl border border-border bg-card p-4"><summary className="cursor-pointer text-sm font-semibold">实际注入提示词</summary><pre className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-4 text-xs leading-6">{recall.promptBlock?.trim() || '本次未注入记忆'}</pre></details>
            <section className="space-y-3"><h3 className="text-sm font-semibold">最终召回记忆（注入顺序）</h3>{!recall.items?.length && <p className="text-sm text-muted-foreground">未召回匹配记忆</p>}{recall.items?.map((item, index) => <div key={item.id} className="rounded-xl border border-border bg-card p-4"><div className="mb-2 flex gap-2"><span className="text-xs text-muted-foreground">#{index + 1}</span><Badge variant="outline">{memoryTypeLabel(item.memoryType)}</Badge>{item.pinned === 1 && <Badge variant="secondary">置顶</Badge>}<span className="text-xs text-muted-foreground">{memorySourceLabel(item.source)}</span></div><p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p></div>)}</section>
            <details className="rounded-xl border border-border bg-card p-4"><summary className="cursor-pointer text-sm font-semibold">向量原始命中（{recall.vectorHits?.length ?? 0}）</summary><div className="mt-3 space-y-3">{!recall.vectorHits?.length && <p className="text-xs text-muted-foreground">无向量命中</p>}{recall.vectorHits?.map((hit, index) => <div key={`${hit.id}-${index}`} className="rounded-lg bg-muted/40 p-3"><p className="mb-2 text-xs text-muted-foreground">{hit.id || '—'} · 分数 {hit.score ?? '—'} · {hit.matchedInDb ? '已匹配数据库' : '未匹配数据库'}</p><p className="whitespace-pre-wrap text-sm">{hit.content}</p></div>)}</div></details>
          </>}</div>
        </div></TabsContent>
      </Tabs>
    </div>
    <Dialog open={Boolean(editor)} onOpenChange={(open) => { if (!open && !save.isPending) setEditor(null); }}><DialogContent><DialogHeader><DialogTitle>{editor?.item ? '编辑记忆' : '新增记忆'}</DialogTitle><DialogDescription>记忆归属于智能体，保存后参与后续对话召回。</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
      <div className="space-y-2"><Label>所属智能体</Label><Choice label="记忆所属智能体" value={form.agentId} disabled={Boolean(editor?.item) || save.isPending} onChange={(value) => setForm((prev) => ({ ...prev, agentId: value }))}><SelectItem value="__all__">请选择智能体</SelectItem>{form.agentId && !agents.some((agent) => agent.id === form.agentId) && <SelectItem value={form.agentId}>{editor?.item?.agentName || form.agentId}</SelectItem>}{agents.map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.agentName}</SelectItem>)}</Choice></div>
      <div className="space-y-2"><Label>记忆类型</Label><Choice label="记忆类型" value={form.memoryType} disabled={save.isPending} onChange={(value) => setForm((prev) => ({ ...prev, memoryType: value }))}>{!MEMORY_TYPE_OPTIONS.some((option) => option.value === form.memoryType) && <SelectItem value={form.memoryType}>{form.memoryType}</SelectItem>}{MEMORY_TYPE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</Choice></div>
      <div className="space-y-2"><Label htmlFor="memory-content">记忆正文</Label><Textarea id="memory-content" rows={5} disabled={save.isPending} value={form.content} onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="memory-key">稳定键（可选）</Label><Input id="memory-key" disabled={save.isPending} value={form.memoryKey} onChange={(event) => setForm((prev) => ({ ...prev, memoryKey: event.target.value }))} /></div><div className="flex items-center gap-2"><Switch id="memory-pinned" checked={form.pinned} disabled={save.isPending} onCheckedChange={(pinned) => setForm((prev) => ({ ...prev, pinned }))} /><Label htmlFor="memory-pinned">置顶记忆</Label></div><DialogFooter><Button type="button" variant="outline" disabled={save.isPending} onClick={() => setEditor(null)}>取消</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? '保存中…' : '保存记忆'}</Button></DialogFooter>
    </form></DialogContent></Dialog>
    <Dialog open={Boolean(confirmation)} onOpenChange={(open) => { if (!open && !remove.isPending) setConfirmation(null); }}><DialogContent><DialogHeader><DialogTitle>{confirmation?.kind === 'clear' ? '清空智能体记忆' : '删除记忆'}</DialogTitle><DialogDescription>{confirmation?.kind === 'clear' ? `将清空「${confirmation.name}」下当前用户的全部记忆，包括筛选条件以外的内容。` : `将删除选中的 ${confirmation?.ids.length ?? 0} 条记忆。`}删除后将无法召回，此操作不可恢复。</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={remove.isPending} onClick={() => setConfirmation(null)}>取消</Button><Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate()}>{remove.isPending ? '删除中…' : '确认删除'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
