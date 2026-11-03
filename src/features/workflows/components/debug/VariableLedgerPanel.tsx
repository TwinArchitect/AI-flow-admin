import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WorkflowCanvasNode, WorkflowCanvasEdge } from '../../types';
import type { WorkflowNodeExecutionStates } from '../../types/execution';
import {
  buildWorkflowVariableLedger, getLedgerDetailValue, getLedgerDisplayValue,
  normalizeLedgerValue, sampleStatusLabel, summarizeVariableLedger,
} from '../../utils/workflowVariableLedger';

const columns = 'grid grid-cols-[minmax(140px,1.2fr)_minmax(100px,1fr)_80px_80px_minmax(140px,1fr)_90px] gap-3';

export function VariableLedgerPanel({ open, nodes, edges, nodeStates, onClose, onSelectNode }: {
  open: boolean;
  nodes: WorkflowCanvasNode[]; edges: WorkflowCanvasEdge[]; nodeStates: WorkflowNodeExecutionStates;
  onClose: () => void; onSelectNode: (nodeId: string) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [group, setGroup] = useState('all');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const entries = useMemo(() => buildWorkflowVariableLedger(nodes, edges, nodeStates), [nodes, edges, nodeStates]);
  const stats = useMemo(() => summarizeVariableLedger(entries), [entries]);
  const filtered = useMemo(() => entries.filter((entry) => {
    if (group !== 'all' && group !== entry.group) return false;
    if (filter === 'sampled' && entry.sampleStatus !== 'sampled') return false;
    if (filter === 'mismatch' && !entry.typeMismatch) return false;
    const query = keyword.trim().toLowerCase();
    return !query || [entry.outputLabel, entry.outputKey, entry.nodeLabel, entry.ref, entry.schemaTypeLabel].some((text) => text.toLowerCase().includes(query));
  }), [entries, keyword, group, filter]);
  const selected = filtered.find((entry) => entry.id === selectedId);
  const detail = selected ? normalizeLedgerValue(getLedgerDetailValue(selected)) : undefined;
  if (!open) return null;
  return <section aria-label="变量台账" className="flex h-[min(48vh,400px)] min-h-0 shrink-0 flex-col border-t border-border bg-card text-card-foreground">
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2">
      <div><h2 className="text-sm font-semibold">变量台账</h2><p className="text-xs text-muted-foreground">左侧浏览变量，右侧查看详情（只读）</p></div>
      <div className="flex items-center gap-2"><Badge variant="secondary">共 {stats.total}</Badge><Badge variant="secondary">已采样 {stats.sampled}</Badge>{stats.mismatched > 0 && <Badge variant="destructive">类型不一致 {stats.mismatched}</Badge>}<Button variant="ghost" size="icon-sm" aria-label="关闭变量台账" onClick={onClose}><X size={16} /></Button></div>
    </header>
    <div className="flex shrink-0 flex-wrap gap-2 border-b border-border px-4 py-2">
      <Input className="min-w-40 flex-1" aria-label="搜索台账变量" placeholder="搜索变量名、键、节点或引用路径…" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
      <Select value={group} onValueChange={setGroup}><SelectTrigger className="w-32" aria-label="变量来源"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部来源</SelectItem><SelectItem value="global">全局变量</SelectItem><SelectItem value="node">节点输出</SelectItem></SelectContent></Select>
      <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-36" aria-label="变量采样筛选"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部状态</SelectItem><SelectItem value="sampled">仅有采样</SelectItem><SelectItem value="mismatch">类型不一致</SelectItem></SelectContent></Select>
    </div>
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-w-0 flex-1 overflow-auto border-r border-border">
        <div className="min-w-[760px]">
          <div className={`${columns} sticky top-0 z-10 border-b border-border bg-muted px-3 py-2 text-xs text-muted-foreground`}><span>来源 / 引用</span><span>变量</span><span>声明类型</span><span>运行时</span><span>格式 / 内容</span><span>状态</span></div>
          {filtered.map((entry) => <button key={entry.id} type="button" aria-pressed={selectedId === entry.id} className={`${columns} w-full items-center border-b border-border px-3 py-2 text-left text-xs hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedId === entry.id ? 'bg-accent' : ''}`} onClick={() => setSelectedId((current) => current === entry.id ? null : entry.id)}>
            <span className="min-w-0"><span className="block truncate">{entry.nodeLabel}</span><code className="block truncate text-[10px] text-muted-foreground" title={entry.ref}>{entry.ref}</code></span>
            <span className="min-w-0"><span className="block truncate">{entry.outputLabel}</span><code className="block truncate text-muted-foreground">{entry.outputKey}</code></span>
            <span>{entry.schemaTypeLabel}</span><span className={entry.typeMismatch ? 'font-semibold text-destructive' : 'text-muted-foreground'}>{entry.runtimeType ?? '—'}</span>
            <span className="truncate text-muted-foreground" title={entry.formatSummary}>{entry.sampleStatus !== 'sampled' && entry.defaultValue?.trim() ? '默认：' : ''}{entry.formatSummary ?? '—'}</span>
            <span>{entry.typeMismatch ? '类型不一致' : sampleStatusLabel(entry.sampleStatus)}</span>
          </button>)}
          {!filtered.length && <p className="p-6 text-center text-xs text-muted-foreground">{entries.length ? '没有匹配的变量' : '当前流程暂无变量定义'}</p>}
        </div>
      </div>
      <aside className="w-[35%] min-w-48 max-w-sm overflow-auto p-4">
        {selected ? <div className="space-y-3">
          <div><h3 className="text-sm font-semibold">{selected.outputLabel}</h3><code className="break-all text-xs text-muted-foreground">{selected.ref}</code></div>
          <div className="flex flex-wrap gap-1"><Badge variant="secondary">{selected.schemaTypeLabel}</Badge><Badge variant={selected.typeMismatch ? 'destructive' : 'secondary'}>运行时 {selected.runtimeType ?? '—'}</Badge><Badge variant="outline">{sampleStatusLabel(selected.sampleStatus)}</Badge></div>
          <p className="text-xs text-muted-foreground">{selected.nodeLabel}</p>
          {selected.nodeType !== 'global' && <Button size="sm" variant="outline" onClick={() => onSelectNode(selected.nodeId)}>定位节点</Button>}
          {selected.fileFieldSpecs && <div className="space-y-2 rounded-lg border border-border p-3"><h4 className="text-xs font-semibold">文件数组字段说明</h4><p className="text-xs text-muted-foreground">配置填写 fileId / fileName；执行后补全 url / name / mime。</p>{selected.fileFieldSpecs.map((spec) => <div key={spec.key} className="text-xs"><code>{spec.label}</code> · {spec.source === 'config' ? '配置' : '运行时'}<p className="text-muted-foreground">{spec.description}</p></div>)}</div>}
          {selected.fileFieldSpecs && getLedgerDisplayValue(selected) === undefined && <p className="text-xs text-muted-foreground">完整运行时结构示例（非本轮采样）</p>}
          {detail === undefined ? <p className="text-xs text-muted-foreground">暂无可展示的内容</p> : <pre className="whitespace-pre-wrap break-all rounded-lg bg-muted p-3 text-xs">{JSON.stringify(detail, null, 2)}</pre>}
        </div> : <p className="py-8 text-center text-xs text-muted-foreground">点击左侧变量行，查看字段说明与 JSON 详情。</p>}
      </aside>
    </div>
  </section>;
}
