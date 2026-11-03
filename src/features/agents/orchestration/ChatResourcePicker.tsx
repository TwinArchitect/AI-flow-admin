import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { queryDatasets } from '../knowledgeBase/api/datasetApi';
import { queryAgents } from '../api/agentApi';
import { queryHttpToolResources, queryMcpServerResources } from './skillResourceApi';

export type ChatResourceKind = 'knowledge' | 'http' | 'mcp' | 'workflow';
export interface ChatResourceOption { id: string; name: string; description?: string; meta?: string; toolKey?: string }

async function queryResources(kind: ChatResourceKind, keyword: string): Promise<ChatResourceOption[]> {
  const name = keyword.trim() || undefined;
  if (kind === 'knowledge') {
    const page = await queryDatasets({ page: 1, size: 50, name, status: 'ACTIVE' });
    return (page.records ?? []).map((item) => ({ id: item.id, name: item.name, description: item.description ?? undefined, meta: `${item.documentCount ?? 0} 文档` }));
  }
  if (kind === 'http') {
    const page = await queryHttpToolResources(name);
    return (page.records ?? []).map((item) => ({ id: item.id, name: item.name, description: item.description ?? undefined, meta: item.method?.toUpperCase(), toolKey: item.toolName?.trim() || undefined }));
  }
  if (kind === 'mcp') {
    const page = await queryMcpServerResources(name);
    return (page.records ?? []).map((item) => ({ id: item.id, name: item.name, description: item.description ?? undefined, meta: item.transport ?? undefined }));
  }
  const page = await queryAgents({ pageNum: 1, pageSize: 50, agentName: name, status: 1, flowType: 1 });
  return page.records.filter((item) => item.flowType === 1 && item.status === 1).map((item) => ({ id: item.id, name: item.agentName, description: item.remark ?? undefined, meta: '已发布' }));
}

const titles = { knowledge: '知识库', http: 'HTTP 组件', mcp: 'MCP 组件', workflow: '工作流' };

/** 挂载时建立临时选择；搜索结果变化不丢已选项，只有确认才提交。 */
export function ChatResourcePicker({ kind, selected, onClose, onConfirm }: {
  kind: ChatResourceKind; selected: ChatResourceOption[]; onClose: () => void; onConfirm: (items: ChatResourceOption[]) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState(() => new Map(selected.map((item) => [item.id, item])));
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(keyword.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [keyword]);
  const query = useQuery({ queryKey: ['agents', 'chat-resource-picker', kind, search], queryFn: () => queryResources(kind, search) });
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="sm:max-w-lg">
    <DialogHeader><DialogTitle>选择{titles[kind]}</DialogTitle><DialogDescription>{kind === 'workflow' ? '仅展示已发布工作流。确认后应用选择，取消保留原配置。' : '可多选已启用资源。确认后应用选择，取消保留原配置。'}</DialogDescription></DialogHeader>
    <Input aria-label={`搜索${titles[kind]}`} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索名称…" />
    <p className="text-xs text-muted-foreground">已选 {selection.size} 项</p>
    <div className="max-h-[48vh] space-y-2 overflow-y-auto">
      {query.isFetching && <p className="py-3 text-center text-xs text-muted-foreground">加载中…</p>}
      {query.isError && <div className="space-y-2 py-4 text-center"><p className="text-xs text-destructive">{query.error instanceof Error ? query.error.message : '资源加载失败'}</p><Button size="sm" variant="outline" onClick={() => void query.refetch()}>重试</Button></div>}
      {!query.isFetching && !query.isError && query.data?.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">暂无匹配资源</p>}
      {query.data?.map((option) => <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:border-primary/40"><Checkbox aria-label={`选择${option.name}`} checked={selection.has(option.id)} onCheckedChange={(checked) => setSelection((current) => { const next = new Map(current); if (checked === true) next.set(option.id, option); else next.delete(option.id); return next; })} /><span className="min-w-0"><span className="block text-sm font-medium">{option.name}</span><span className="mt-1 block text-xs text-muted-foreground">{option.description || '暂无描述'}{option.meta ? ` · ${option.meta}` : ''}</span></span></label>)}
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>取消</Button><Button onClick={() => onConfirm([...selection.values()])}>确认选择</Button></DialogFooter>
  </DialogContent></Dialog>;
}
