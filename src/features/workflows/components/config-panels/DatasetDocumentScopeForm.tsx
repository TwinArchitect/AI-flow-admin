import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { queryDocuments } from '@/features/agents/knowledgeBase/api/documentApi';
import type { DatasetSearchDocument, DatasetSearchNodeConfig, WorkflowVariableOption } from '../../types';
import { VariablePicker } from './shared/VariablePicker';
import { Field } from './shared/Field';

export function DatasetIdVariableField({ label, value, variables, onChange }: {
  label: string; value: string; variables: WorkflowVariableOption[]; onChange: (value: string) => void;
}) {
  return <Field label={label}><div className="space-y-2">
    <Input aria-label={label} readOnly value={value} placeholder="选择上游 ID 变量" className="font-mono text-xs" />
    <div className="flex justify-end"><VariablePicker variables={variables.filter(item => ['string', 'array', 'arrayString'].includes(item.valueType ?? ''))} onSelect={onChange} /></div>
    <p className="text-[10px] text-muted-foreground">支持单个 ID、英文逗号分隔的 ID 字符串或字符串数组；空值会报错。</p>
  </div></Field>;
}

export function DatasetDocumentScopeForm({ config, variables, onChange }: {
  config: DatasetSearchNodeConfig; variables: WorkflowVariableOption[]; onChange: (patch: Partial<DatasetSearchNodeConfig>) => void;
}) {
  const [open, setOpen] = useState(false);
  return <section className="space-y-3 border-t border-border pt-5">
    <Field label="检索范围"><Select value={config.retrievalScope} onValueChange={(retrievalScope: 'all' | 'files') => onChange({ retrievalScope })}><SelectTrigger aria-label="检索范围"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部文件</SelectItem><SelectItem value="files">指定文件</SelectItem></SelectContent></Select></Field>
    {config.retrievalScope === 'files' && <>
      <Field label="文件来源"><Select value={config.documentInputMode} onValueChange={(documentInputMode: 'select' | 'reference') => onChange({ documentInputMode })}><SelectTrigger aria-label="文件来源"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="select" disabled={config.datasetInputMode === 'reference'}>选择文件</SelectItem><SelectItem value="reference">引用变量</SelectItem></SelectContent></Select></Field>
      {config.datasetInputMode === 'reference' && <p className="text-xs text-muted-foreground">知识库由运行时变量确定，指定文件请通过文件 ID 变量传入。</p>}
      {config.documentInputMode === 'reference' ? <DatasetIdVariableField label="文件 ID 变量" value={config.documentIds.value} variables={variables} onChange={value => onChange({ documentIds: { valueMode: 'reference', value } })} /> : <>
        <Button variant="outline" className="w-full" disabled={!config.datasets.length} onClick={() => setOpen(true)}>选择文件（已选 {config.documents.length} 个）</Button>
        {!config.datasets.length && <p className="text-xs text-muted-foreground">请先选择知识库。</p>}
        <div className="max-h-48 space-y-1 overflow-y-auto">{config.documents.map(item => <div key={item.documentId} className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs"><span className="min-w-0 flex-1 break-all">{item.name || item.documentId} · {config.datasets.find(kb => kb.datasetId === item.datasetId)?.name || item.datasetId}</span><Button variant="ghost" size="sm" aria-label={`移除文件 ${item.name || item.documentId}`} onClick={() => onChange({ documents: config.documents.filter(document => document.documentId !== item.documentId) })}>移除</Button></div>)}</div>
      </>}
      <p className="text-[10px] text-muted-foreground">仅在指定文件内召回相关片段；文件失效或范围为空时会明确报错。</p>
    </>}
    {open && config.datasetInputMode === 'select' && config.documentInputMode === 'select' && config.retrievalScope === 'files' && <DatasetDocumentPicker config={config} onClose={() => setOpen(false)} onConfirm={documents => { onChange({ documents }); setOpen(false); }} />}
  </section>;
}
function DatasetDocumentPicker({ config, onClose, onConfirm }: {
  config: DatasetSearchNodeConfig; onClose: () => void; onConfirm: (documents: DatasetSearchDocument[]) => void;
}) {
  const [draft, setDraft] = useState(config.documents);
  const [datasetId, setDatasetId] = useState(config.datasets[0]?.datasetId ?? '');
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const activeDataset = config.datasets.some(kb => kb.datasetId === datasetId) ? datasetId : config.datasets[0]?.datasetId ?? '';
  const result = useQuery({ queryKey: ['workflow', 'document-scope', activeDataset, query, page], queryFn: () => queryDocuments(activeDataset, { keyword: query, page, size: 20 }), enabled: Boolean(activeDataset) });
  const selected = draft.filter(item => config.datasets.some(kb => kb.datasetId === item.datasetId));
  const remove = (id: string) => setDraft(current => current.filter(item => item.documentId !== id));
  const search = () => { setQuery(keyword.trim()); setPage(1); };
  return <Dialog open onOpenChange={value => { if (!value) onClose(); }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle>选择知识库文件</DialogTitle><DialogDescription>支持跨知识库、跨页多选，确认后带入检索范围。</DialogDescription></DialogHeader>
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2"><Select value={activeDataset} onValueChange={value => { setDatasetId(value); setKeyword(''); setQuery(''); setPage(1); }}><SelectTrigger aria-label="文件所属知识库" className="w-full sm:w-52"><SelectValue /></SelectTrigger><SelectContent>{config.datasets.map(kb => <SelectItem key={kb.datasetId} value={kb.datasetId}>{kb.name || kb.datasetId}</SelectItem>)}</SelectContent></Select><Input className="min-w-0 flex-1" aria-label="搜索知识库文件" placeholder="搜索文件名称" value={keyword} onChange={event => setKeyword(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); search(); } }} /><Button variant="outline" onClick={search}>搜索</Button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border"><div className="max-h-80 min-h-40 overflow-y-auto p-2">
          {result.isLoading ? <p className="p-4 text-xs">加载中…</p> : result.error ? <div className="p-4 text-xs text-destructive"><p>{result.error.message}</p><Button variant="outline" onClick={() => void result.refetch()}>重试</Button></div> : !result.data?.records.length ? <p className="p-4 text-xs text-muted-foreground">暂无文件</p> : result.data.records.map(file => {
            const selectable = file.status === 'READY' && file.searchEnabled !== false;
            return <label key={file.id} className="flex items-start gap-2 border-b px-2 py-3 text-xs"><Checkbox aria-label={file.fileName || file.id} disabled={!selectable} checked={selected.some(item => item.documentId === file.id)} onCheckedChange={checked => { if (checked === true) setDraft(current => current.some(item => item.documentId === file.id) ? current : [...current, { documentId: file.id, datasetId: activeDataset, name: file.fileName }]); else remove(file.id); }} /><span className="break-all">{file.fileName || file.id}{!selectable && (file.searchEnabled === false ? '（已禁用检索）' : '（未完成解析）')}</span></label>;
          })}
        </div><div className="flex items-center justify-between border-t p-2 text-xs"><Button size="sm" variant="ghost" disabled={result.isFetching || page <= 1} onClick={() => setPage(value => value - 1)}>上一页文件</Button><span>{page} / {Math.max(1, Math.ceil((result.data?.total ?? 0) / 20))}</span><Button size="sm" variant="ghost" disabled={result.isFetching || Boolean(result.error) || page * 20 >= (result.data?.total ?? 0)} onClick={() => setPage(value => value + 1)}>下一页文件</Button></div></div>
        <div className="rounded-lg border"><div className="flex justify-between border-b p-2 text-xs"><span>已选 {selected.length} 个文件</span><Button size="sm" variant="ghost" disabled={!selected.length} onClick={() => setDraft([])}>清空</Button></div><div className="max-h-80 overflow-y-auto p-2">{selected.map(item => <div key={item.documentId} className="mb-2 flex items-start gap-2 rounded bg-muted p-2 text-xs"><span className="min-w-0 flex-1 break-all">{item.name || item.documentId}<br />{config.datasets.find(kb => kb.datasetId === item.datasetId)?.name || item.datasetId}</span><Button size="sm" variant="ghost" onClick={() => remove(item.documentId)}>移除</Button></div>)}</div></div>
      </div><p className="text-xs text-muted-foreground">仅可选择已完成解析且已启用检索的文件。</p>
    </div><DialogFooter><Button variant="outline" onClick={onClose}>取消</Button><Button disabled={!selected.length} onClick={() => onConfirm(selected)}>确认选择（{selected.length}）</Button></DialogFooter></DialogContent></Dialog>;
}
