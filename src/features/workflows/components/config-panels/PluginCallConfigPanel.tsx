import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { queryHttpTools, getHttpTool } from '@/features/agents/tools/httpToolApi';
import { queryMcpServers, getMcpServer } from '@/features/agents/tools/mcpApi';
import type { McpToolVO } from '@/features/agents/tools/mcpTypes';
import type { NodeConfigPanelProps } from '../../nodes/types';
import { normalizePluginCall, buildHttpPluginConfig, buildMcpPluginConfig, pluginOutputs, type PluginCallKind } from '../../contracts/pluginCallNodeContract';
import { buildErrorCatchHandle } from '../../utils/edgeHandles';
import { Field } from './shared/Field';
import { VariableInput } from './shared/VariableValueField';
import { VariablePicker } from './shared/VariablePicker';

function PluginPanel({ kind, nodeId, config, variables, onUpdate, onRename, onRemoveSourceHandle }: NodeConfigPanelProps & { kind: PluginCallKind }) {
  const value = normalizePluginCall(config); const isHttp = kind === 'httpPluginCall';
  const targetId = isHttp ? value.httpToolId : value.mcpServerId;
  const targetName = isHttp ? value.pluginName : value.serverName;
  const [open, setOpen] = useState(false); const [keyword, setKeyword] = useState(''); const [selection, setSelection] = useState(''); const [busy, setBusy] = useState(false);
  const [tools, setTools] = useState<McpToolVO[]>([]);
  const activeNode = useRef(nodeId); activeNode.current = nodeId;
  useEffect(() => { setOpen(false); setBusy(false); setTools([]); return () => { activeNode.current = ''; }; }, [nodeId]);
  const options = useQuery({ queryKey: ['workflow-plugin-options', kind, keyword.trim()], enabled: open, queryFn: async () => {
    if (isHttp) { const page = await queryHttpTools({ current: 1, size: 50, status: 0, name: keyword.trim() }); return page.records.map((tool) => ({ id: tool.id, name: tool.name, description: tool.description, meta: tool.method })); }
    const page = await queryMcpServers({ current: 1, size: 50, status: 0, name: keyword.trim() }); return page.records.filter((server) => server.transport !== 'stdio').map((server) => ({ id: server.id, name: server.name, description: server.description, meta: server.transport }));
  } });
  const mcpDetail = useQuery({ queryKey: ['workflow-mcp-tools', value.mcpServerId], queryFn: () => getMcpServer(value.mcpServerId), enabled: !isHttp && Boolean(value.mcpServerId) });
  useEffect(() => { if (!isHttp) setTools(mcpDetail.data?.tools ?? []); }, [isHttp, mcpDetail.data]);
  async function applyTarget(id: string, refresh = false) {
    const requestedNode = nodeId; setBusy(true);
    try {
      const same = refresh || id === targetId;
      const detail = isHttp ? await getHttpTool(id) : await getMcpServer(id);
      if (activeNode.current !== requestedNode) return;
      if (Number(detail.status) === 1) throw new Error('该资源已停用，请重新选择');
      if (!isHttp && 'transport' in detail && detail.transport === 'stdio') throw new Error('stdio 服务不支持工作流调用');
      const next = isHttp && 'method' in detail ? buildHttpPluginConfig(detail, same ? value : undefined) : 'transport' in detail ? buildMcpPluginConfig(detail, same ? value : undefined) : null;
      if (!next) throw new Error('工具类型不匹配');
      if (value.catchError && !next.catchError) onRemoveSourceHandle(buildErrorCatchHandle(nodeId));
      onUpdate({ ...next });
      if ('tools' in detail) setTools(detail.tools ?? []);
      if (!same) onRename?.(detail.name || (isHttp ? 'HTTP 工具调用' : 'MCP 工具调用'));
      setOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : '读取工具失败'); }
    finally { if (activeNode.current === requestedNode) setBusy(false); }
  }
  const mappings = isHttp ? value.inputMappings : [{ id: 'userChatInput', key: 'userChatInput', label: '主输入', valueType: 'string', required: true, field: value.userChatInput }];
  function updateField(id: string, patch: Partial<typeof value.userChatInput>) {
    if (!isHttp) onUpdate({ userChatInput: { ...value.userChatInput, ...patch } });
    else onUpdate({ inputMappings: value.inputMappings.map((item) => item.id === id ? { ...item, field: { ...item.field, ...patch } } : item) });
  }
  return <div className="space-y-5">
    <Field label={isHttp ? 'HTTP 工具' : 'MCP 服务'}><div className="space-y-3 rounded-lg border border-border p-3"><p className="text-sm font-medium">{targetName || targetId || '尚未选择'}</p><p className="text-xs leading-5 text-muted-foreground">{isHttp ? value.pluginRemark || '调用插件中心已启用的 HTTP 工具；此节点不直接配置请求地址。' : value.serverRemark || '调用插件中心已启用的远程 MCP 服务。'}</p><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={busy} onClick={() => { setSelection(targetId); setKeyword(''); setOpen(true); }}>{targetId ? '更换工具' : '选择工具'}</Button>{targetId && <Button variant="outline" size="sm" disabled={busy} onClick={() => void applyTarget(targetId, true)}><RefreshCw size={14} />刷新配置</Button>}</div></div></Field>
    {!isHttp && targetId && <Field label="调用工具"><Select value={value.enabledToolNames?.[0] || '__none__'} onValueChange={(name) => onUpdate({ enabledToolNames: name === '__none__' ? undefined : [name] })}><SelectTrigger aria-label="MCP 调用工具"><SelectValue placeholder="选择一个工具" /></SelectTrigger><SelectContent><SelectItem value="__none__">请选择一个工具</SelectItem>{tools.filter((tool) => tool.enabled !== false).map((tool) => <SelectItem key={tool.toolName} value={tool.toolName}>{tool.nameAlias || tool.toolName}</SelectItem>)}{(value.enabledToolNames ?? []).filter((name) => !tools.some((tool) => tool.toolName === name)).map((name) => <SelectItem key={name} value={name}>{name}（待确认）</SelectItem>)}</SelectContent></Select><p className="text-xs leading-5 text-muted-foreground">每个节点调用一个工具。主输入可填写 JSON 对象，键名对应所选工具的参数。</p>{mcpDetail.isError && <p className="text-xs text-destructive">{mcpDetail.error.message}</p>}{tools.find((tool) => tool.toolName === value.enabledToolNames?.[0])?.inputSchema && <details><summary className="cursor-pointer text-xs text-muted-foreground">输入参数 Schema</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(tools.find((tool) => tool.toolName === value.enabledToolNames?.[0])?.inputSchema, null, 2)}</pre></details>}</Field>}
    <Field label="输入映射">{!targetId ? <p className="text-xs text-muted-foreground">选择工具后配置输入</p> : !mappings.length ? <p className="text-xs text-muted-foreground">该工具没有对外输入参数</p> : mappings.map((item) => <div key={item.id} className="space-y-2 rounded-lg border border-border p-3"><div className="flex justify-between gap-2 text-xs"><span>{item.label}{item.required ? ' *' : ''}</span><span className="text-muted-foreground">{item.key} · {item.valueType}</span></div><Select value={item.field.valueMode} onValueChange={(mode) => updateField(item.id, { valueMode: mode as 'input' | 'reference', value: '' })}><SelectTrigger aria-label={`输入方式 ${item.key}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="reference">引用变量</SelectItem><SelectItem value="input">常量输入</SelectItem></SelectContent></Select><VariableInput aria-label={`输入值 ${item.key}`} variables={variables} value={item.field.value} onChange={(event) => updateField(item.id, { value: event.target.value })} />{item.field.valueMode === 'reference' && <VariablePicker variables={variables} onSelect={(ref) => updateField(item.id, { value: ref })} />}</div>)}</Field>
    <Field label="输出变量">{pluginOutputs(kind).map((output) => <div key={output.key} className="flex justify-between gap-2 rounded border border-border p-2 text-xs"><span>{output.label} · {output.key}</span><span>{output.valueType}</span></div>)}</Field>
    <div className="flex items-center justify-between"><span className="text-sm">错误捕获</span><Switch checked={value.catchError} onCheckedChange={(catchError) => { if (!catchError) onRemoveSourceHandle(buildErrorCatchHandle(nodeId)); onUpdate({ catchError }); }} /></div>
    <Dialog open={open} onOpenChange={(next) => { if (!busy) setOpen(next); }}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>{isHttp ? '选择 HTTP 工具' : '选择 MCP 服务'}</DialogTitle><DialogDescription>从插件中心选择已启用资源，确认后应用。</DialogDescription></DialogHeader><Input aria-label="搜索插件" placeholder="搜索名称…" value={keyword} onChange={(event) => setKeyword(event.target.value)} /><div className="max-h-[45vh] space-y-2 overflow-y-auto">{options.isFetching && <p className="text-xs text-muted-foreground">加载中…</p>}{options.isError && <p className="text-xs text-destructive">{options.error.message}</p>}{!options.isFetching && !options.data?.length && <p className="py-5 text-center text-xs text-muted-foreground">暂无已启用资源，请先在插件中心维护</p>}{options.data?.map((option) => <Button key={option.id} variant={selection === option.id ? 'secondary' : 'outline'} disabled={busy} className="h-auto w-full justify-start whitespace-normal py-3 text-left" onClick={() => setSelection(option.id)}><span className="min-w-0 flex-1"><span className="block">{option.name}</span><span className="mt-1 block text-xs text-muted-foreground">{option.description || option.meta}</span></span>{selection === option.id && <Check size={15} />}</Button>)}</div><DialogFooter><Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>取消</Button><Button disabled={busy || !selection} onClick={() => void applyTarget(selection)}>{busy ? '读取中…' : '确认选择'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
export function HttpPluginCallConfigPanel(props: NodeConfigPanelProps) { return <PluginPanel {...props} kind="httpPluginCall" />; }
export function McpCallConfigPanel(props: NodeConfigPanelProps) { return <PluginPanel {...props} kind="mcpCall" />; }
