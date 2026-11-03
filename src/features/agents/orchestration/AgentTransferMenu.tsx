import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeftRight, FileText, FileUp, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { agentFlowTypeLabel, type AgentOpenSysAgent } from '@/types/agent';
import { exportAgentConfig, importAgentConfig } from '../api/agentApi';
import { detectAgentDslFormat, dslFormatError, importDify, isYamlDslFile, previewImportDify, type DifyImportReport } from './agentTransferApi';

export function AgentTransferMenu({ agentId, agentName, onImported, disabled = false }: {
  agentId?: string; agentName: string; disabled?: boolean;
  onImported: (agent: AgentOpenSysAgent) => void | Promise<void>;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'dsl' | 'dify' | null>(null);
  const [busy, setBusy] = useState<'export' | 'preview' | 'import' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [report, setReport] = useState<DifyImportReport | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const dragDepth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [formatError, setFormatError] = useState('');
  const [checkingFormat, setCheckingFormat] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setFormatError('');
    if (!file || !mode) { setCheckingFormat(false); return; }
    setCheckingFormat(true);
    file.text().then((content) => {
      if (!cancelled) setFormatError(dslFormatError(detectAgentDslFormat(content), mode));
    }).catch(() => { if (!cancelled) setFormatError('文件读取失败，请重新选择文件'); })
      .finally(() => { if (!cancelled) setCheckingFormat(false); });
    return () => { cancelled = true; };
  }, [file, mode]);
  const open = (next: 'dsl' | 'dify') => {
    setMode(next); setFile(null); setName(''); setError(''); setReport(null); setPreviewName('');
    setDragOver(false); dragDepth.current = 0;
  };
  const acceptFile = (next: File | null) => {
    setReport(null); setPreviewName('');
    setError(next && !isYamlDslFile(next) ? '仅支持 .yml / .yaml 格式的 DSL 文件' : '');
    setFile(next && isYamlDslFile(next) ? next : null);
    if (inputRef.current) inputRef.current.value = '';
  };
  const exportDsl = async () => {
    if (!agentId || busy) return;
    setBusy('export');
    try { await exportAgentConfig(agentId, agentName); toast.success('配置已导出'); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : '导出失败'); }
    finally { setBusy(null); }
  };
  const preview = async () => {
    if (!file || busy || checkingFormat || formatError) return;
    setBusy('preview'); setError('');
    try {
      const invalidFormat = dslFormatError(detectAgentDslFormat(await file.text()), 'dify');
      if (invalidFormat) throw new Error(invalidFormat);
      const result = await previewImportDify(file);
      setReport(result.report ?? null);
      const title = result.agent?.agentName?.trim() || '';
      setPreviewName(title);
      if (!name.trim() && title) setName(title);
    } catch (cause) { setReport(null); setPreviewName(''); setError(cause instanceof Error ? cause.message : '预览失败'); }
    finally { setBusy(null); }
  };
  const submit = async () => {
    if (!file || busy || checkingFormat || formatError || (mode === 'dsl' && !agentId)) return;
    setBusy('import'); setError('');
    try {
      if (!mode) return;
      const invalidFormat = dslFormatError(detectAgentDslFormat(await file.text()), mode);
      if (invalidFormat) throw new Error(invalidFormat);
      if (mode === 'dsl' && agentId) {
        const updated = await importAgentConfig(agentId, file);
        if (!updated?.id) throw new Error('导入成功但未返回智能体 ID');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['agents'] }),
          queryClient.invalidateQueries({ queryKey: ['workflow-runtime', 'agent', updated.id], refetchType: 'none' }),
        ]);
        const targetPath = updated.flowType === 0 ? '/agents/orchestration' : '/workflows';
        if (location.pathname !== targetPath) {
          setMode(null);
          navigate(`${targetPath}?id=${encodeURIComponent(updated.id)}`);
          toast.success('配置已导入');
          return;
        }
        await onImported(updated);
        setMode(null); toast.success('配置已导入');
      } else if (mode === 'dify') {
        const result = await importDify(file, { agentName: name.trim() || undefined });
        if (!result.agent?.id) throw new Error('导入成功但未返回智能体 ID');
        const pending = (result.report ?? report)?.pending?.length ?? 0;
        await queryClient.invalidateQueries({ queryKey: ['agents'] });
        setMode(null);
        toast.success(`已导入「${result.agent.agentName}」${pending ? `，有 ${pending} 项待复核` : ''}`);
        navigate(`${result.agent.flowType === 0 ? '/agents/orchestration' : '/workflows'}?id=${encodeURIComponent(result.agent.id)}`);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : '导入失败'); }
    finally { setBusy(null); }
  };
  const sections = report ? [
    ['已转换', report.converted ?? []], ['警告', report.warnings ?? []], ['已跳过', report.skipped ?? []],
    ['待复核', report.pending?.map((item) => [item.kind ? `[${item.kind}] ${item.name?.trim() || '待配置项'}` : item.name?.trim() || '待配置项', item.detail?.trim()].filter(Boolean).join('：')) ?? []],
  ] as const : [];
  return <>
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" disabled={disabled || Boolean(busy)}><ArrowLeftRight size={14} />导入导出</Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {!agentId && <p className="px-2 py-2 text-xs leading-5 text-muted-foreground">当前画布尚未保存。先保存生成智能体 ID，才能导入或导出平台 DSL。</p>}
        <DropdownMenuItem disabled={!agentId} onSelect={() => void exportDsl()}>导出 DSL</DropdownMenuItem>
        <DropdownMenuItem disabled={!agentId} onSelect={() => open('dsl')}>导入 DSL</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => open('dify')}>导入 Dify · 新建草稿</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={mode !== null} onOpenChange={(value) => { if (!value && !busy) setMode(null); }}>
      <DialogContent showCloseButton={!busy} className="gap-0 overflow-hidden rounded-xl p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-6 py-5 pr-12 text-left"><DialogTitle className="flex items-center gap-3 text-base"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><ArrowLeftRight size={18} /></span>{mode === 'dify' ? '导入 Dify' : '导入平台 DSL'}</DialogTitle>
          <DialogDescription className="mt-2 text-xs leading-5">{mode === 'dify' ? '选择 Dify 导出的 YAML，可先预览转换结果，再新建草稿智能体。' : `将平台导出的配置导入「${agentName}」，覆盖当前配置。`}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-6 py-5">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs leading-5 text-muted-foreground">{mode === 'dify' ? 'Dify 文件 → 转换为新草稿；本平台导出的文件请使用“导入 DSL”。' : '平台 DSL → 覆盖当前智能体；Dify 文件请使用“导入 Dify”。'}</div>
          <div className="space-y-2"><Label>配置文件</Label>
          <Button variant="outline" className={`h-auto min-h-24 w-full justify-start gap-4 whitespace-normal rounded-lg border-dashed px-4 py-5 text-left shadow-none ${dragOver ? 'border-primary bg-primary/10 ring-2 ring-ring/30' : 'bg-muted/20'}`} disabled={Boolean(busy)}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => { event.preventDefault(); event.stopPropagation(); if (!busy) { dragDepth.current += 1; setDragOver(true); } }}
            onDragLeave={(event) => { event.preventDefault(); event.stopPropagation(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragOver(false); }}
            onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); if (!busy) event.dataTransfer.dropEffect = 'copy'; }}
            onDrop={(event) => { event.preventDefault(); event.stopPropagation(); dragDepth.current = 0; setDragOver(false); if (!busy) acceptFile(event.dataTransfer.files[0] ?? null); }}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-primary">{file ? <FileText size={20} /> : <FileUp size={20} />}</span><span className="min-w-0 flex-1"><span className="block break-all text-sm font-medium">{dragOver ? '松开鼠标添加文件' : file ? file.name : '点击选择文件，或拖拽到此处'}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{file ? `${(file.size / 1024).toFixed(1)} KB · 点击可替换文件` : '支持 .yml / .yaml 格式'}</span></span>
          </Button>
          <input aria-label="DSL 文件" ref={inputRef} type="file" accept=".yml,.yaml,application/x-yaml,text/yaml" className="hidden" disabled={Boolean(busy)} onChange={(event) => acceptFile(event.target.files?.[0] ?? null)} />
          <div className="flex min-h-5 items-center justify-between text-xs text-muted-foreground"><span>{checkingFormat ? '正在检查文件格式…' : file && !formatError ? '文件已选择' : '请选择对应来源的配置文件'}</span>{file && <Button variant="ghost" size="xs" disabled={Boolean(busy)} onClick={() => acceptFile(null)}><Trash2 size={12} />移除</Button>}</div></div>
          {mode === 'dify' ? <div className="space-y-2"><Label htmlFor="dify-agent-name">智能体名称 <span className="font-normal text-muted-foreground">（选填）</span></Label><Input id="dify-agent-name" value={name} maxLength={50} disabled={Boolean(busy)} placeholder={previewName || '默认使用文件中的应用名称'} onChange={(event) => setName(event.target.value)} /></div> : <p className="text-xs leading-5 text-muted-foreground">导入会替换当前未保存修改，不改变发布状态；导入后请重新调试再发布。</p>}
          {report && <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{[report.appMode && `模式 ${report.appMode}`, report.targetFlowType != null && agentFlowTypeLabel(report.targetFlowType), report.nodeTotal != null && `节点 ${report.nodeMapped ?? 0}/${report.nodeTotal}`, report.dslVersion && `DSL ${report.dslVersion}`].filter(Boolean).join(' · ')}</p>
            {sections.map(([title, items]) => items.length > 0 && <section key={title} className="rounded-lg border border-border bg-muted/40 p-3"><h3 className="text-sm font-medium">{title}（{items.length}）</h3><ul className="mt-2 space-y-1 text-xs">{items.map((item, index) => <li className="break-words" key={index}>{item}</li>)}</ul></section>)}
            {sections.every(([, items]) => items.length === 0) && <p className="text-xs text-muted-foreground">预览完成，未返回明细条目。</p>}
          </div>}
          {(formatError || error) && <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs leading-5 text-destructive"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><div><p>{formatError || error}</p>{formatError && mode === 'dify' && <p className="mt-1 text-muted-foreground">{agentId ? '关闭此窗口后，从“导入导出 → 导入 DSL”选择此文件。' : '当前画布还没有智能体 ID，请先保存，再使用“导入 DSL”。'}</p>}</div></div>}
        </div>
        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4"><Button variant="ghost" disabled={Boolean(busy)} onClick={() => setMode(null)}>取消</Button>
          {mode === 'dify' && <Button variant="outline" disabled={!file || Boolean(busy) || checkingFormat || Boolean(formatError)} onClick={() => void preview()}>{busy === 'preview' && <Loader2 size={14} className="animate-spin" />}预览转换</Button>}
          <Button disabled={!file || Boolean(busy) || checkingFormat || Boolean(formatError) || (mode === 'dsl' && !agentId)} onClick={() => void submit()}>{busy === 'import' && <Loader2 size={14} className="animate-spin" />}确认导入</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
