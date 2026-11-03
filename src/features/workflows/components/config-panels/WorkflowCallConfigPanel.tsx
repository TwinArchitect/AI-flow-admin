import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAgentSetting, queryAgents } from '@/features/agents/api/agentApi';
import type { AgentOpenSysAgent } from '@/types/agent';
import type { NodeConfigPanelProps } from '../../nodes/types';
import { buildWorkflowCallFromSetting, normalizeWorkflowCallConfig } from '../../contracts/workflowCallNodeContract';
import { buildErrorCatchHandle } from '../../utils/edgeHandles';
import { VariableInput } from './shared/VariableValueField';
import { VariablePicker } from './shared/VariablePicker';
import { Field } from './shared/Field';

export function WorkflowCallConfigPanel({ nodeId, agentId, config, variables, onUpdate, onRename, onRemoveSourceHandle }: NodeConfigPanelProps) {
  const value = normalizeWorkflowCallConfig(config);
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<Pick<AgentOpenSysAgent, 'id' | 'agentName' | 'remark' | 'headImg'> | null>(null);
  const [busy, setBusy] = useState(false);
  const activeNode = useRef(nodeId);
  activeNode.current = nodeId;
  useEffect(() => {
    activeNode.current = nodeId;
    setBusy(false);
    setOpen(false);
    return () => { activeNode.current = ''; };
  }, [nodeId]);
  const options = useQuery({
    queryKey: ['workflow-call-targets', keyword.trim(), agentId], enabled: open,
    queryFn: () => queryAgents({ pageNum: 1, pageSize: 50, agentName: keyword.trim() || undefined, status: 1, flowType: 1 }),
  });
  function openPicker() {
    setKeyword('');
    setSelectedTarget(value.agentId ? { id: value.agentId, agentName: value.agentName, remark: value.agentRemark, headImg: value.headImg } : null);
    setOpen(true);
  }
  async function selectTarget(target: Pick<AgentOpenSysAgent, 'id' | 'agentName' | 'remark' | 'headImg'>, refresh = false) {
    if (target.id === agentId) { toast.error('不能调用当前智能体'); return; }
    const requestedNode = nodeId;
    setBusy(true);
    try {
      const detail = await getAgentSetting(target.id);
      if (activeNode.current !== requestedNode) return;
      const next = buildWorkflowCallFromSetting(detail.agentSetting, { agentId: target.id, agentName: target.agentName, agentRemark: target.remark, headImg: target.headImg }, refresh || target.id === value.agentId ? value : undefined);
      if (value.catchError && !next.catchError) onRemoveSourceHandle(buildErrorCatchHandle(nodeId));
      onUpdate({ ...next });
      if (!refresh && value.agentId !== target.id) onRename?.(next.agentName || '工作流插件');
      setOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : '读取目标工作流配置失败'); }
    finally { if (activeNode.current === requestedNode) setBusy(false); }
  }
  return (
    <div className="space-y-5">
      <Field label="目标工作流">
        <div className="space-y-3 rounded-lg border p-3">
          <p className="text-sm font-medium">{value.agentName || value.agentId || '请选择工作流'}</p>
          <p className="text-xs text-muted-foreground">{value.agentRemark || '仅可选择已发布的工作流型智能体，不能选择当前智能体'}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={busy} onClick={openPicker}>{value.agentId ? '更换工作流' : '选择工作流'}</Button>
            {value.agentId && <Button variant="outline" size="sm" disabled={busy} onClick={() => void selectTarget({ id: value.agentId, agentName: value.agentName, remark: value.agentRemark, headImg: value.headImg }, true)}>{busy ? '读取中…' : '刷新 schema'}</Button>}
          </div>
        </div>
      </Field>
      <Field label="输入映射">
        {!value.agentId ? <p className="text-xs text-muted-foreground">选择工作流后自动同步入参</p> : value.inputMappings.map(item => (
          <div key={item.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium">{item.label}{item.required && ' *'}</span><span className="text-xs text-muted-foreground">{item.valueType}</span></div>
            <p className="text-xs text-muted-foreground">{item.fixed ? '对应子流程用户消息（message）' : `目标变量 ${item.key}`}</p>
            <Select value={item.field.valueMode} onValueChange={mode => onUpdate({ inputMappings: value.inputMappings.map(row => row.id === item.id ? { ...row, field: { valueMode: mode, value: '' } } : row) })}>
              <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="reference">引用变量</SelectItem><SelectItem value="input">常量输入</SelectItem></SelectContent>
            </Select>
            <VariableInput variables={variables} value={item.field.value} onChange={event => onUpdate({ inputMappings: value.inputMappings.map(row => row.id === item.id ? { ...row, field: { ...row.field, value: event.target.value } } : row) })} />
            {item.field.valueMode === 'reference' && <VariablePicker variables={variables} onSelect={ref => onUpdate({ inputMappings: value.inputMappings.map(row => row.id === item.id ? { ...row, field: { ...row.field, value: ref } } : row) })} />}
          </div>
        ))}
      </Field>
      <Field label="输出变量">
        <p className="text-xs text-muted-foreground">透出目标工作流结束节点输出，供下游引用</p>
        {value.exposedOutputs.length ? value.exposedOutputs.map(output => <div key={output.key} className="flex justify-between gap-2 rounded border p-2 text-xs"><span>{output.label} · {output.key}</span><span>{output.valueType}</span></div>) : <p className="text-xs text-muted-foreground">{value.agentId ? '结束节点暂无输出，可刷新 schema' : '选择工作流后同步输出'}</p>}
      </Field>
      <div className="flex items-center justify-between"><span className="text-sm">错误捕获</span><Switch checked={value.catchError} onCheckedChange={catchError => { if (!catchError) onRemoveSourceHandle(buildErrorCatchHandle(nodeId)); onUpdate({ catchError }); }} /></div>
      <Dialog open={open} onOpenChange={next => { if (!busy) setOpen(next); }}>
        <DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>选择工作流插件</DialogTitle></DialogHeader>
          <div className="flex items-center gap-2">
            <Input placeholder="搜索工作流名称…" value={keyword} onChange={e => setKeyword(e.target.value)} />
            <Button variant="outline" size="sm" disabled={busy || options.isFetching} onClick={() => void options.refetch()}><RefreshCw size={14} className={options.isFetching ? 'animate-spin' : undefined} />刷新</Button>
          </div>
          {options.isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
          {options.isError && <div className="space-y-2"><p className="text-sm text-destructive">{options.error.message}</p><Button variant="outline" onClick={() => void options.refetch()}>重试</Button></div>}
          {!options.isLoading && !options.isError && !(options.data?.records ?? []).some(a => a.flowType === 1 && a.status === 1 && a.id !== agentId) && <p className="text-sm text-muted-foreground">暂无已发布的工作流型智能体</p>}
          {(options.data?.records ?? []).filter(a => a.flowType === 1 && a.status === 1 && a.id !== agentId).map(a => <Button key={a.id} variant={selectedTarget?.id === a.id ? 'secondary' : 'outline'} aria-pressed={selectedTarget?.id === a.id} className="h-auto justify-start whitespace-normal py-3 text-left" disabled={busy} onClick={() => setSelectedTarget(a)}><span className="min-w-0 flex-1"><span className="block">{a.agentName}</span><span className="block text-xs text-muted-foreground">{a.remark || '子工作流'} · 已发布{a.updateTime ? ` · ${a.updateTime.slice(0, 16).replace('T', ' ')}` : ''}</span></span>{selectedTarget?.id === a.id && <Check size={16} className="shrink-0" />}</Button>)}
          <DialogFooter>
            <p className="mr-auto self-center text-xs text-muted-foreground">{selectedTarget ? `已选择：${selectedTarget.agentName || selectedTarget.id}` : '请选择一个工作流'}</p>
            <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>取消</Button>
            <Button disabled={busy || !selectedTarget || selectedTarget.id === agentId} onClick={() => { if (selectedTarget) void selectTarget(selectedTarget); }}>{busy ? '读取中…' : '确定'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
