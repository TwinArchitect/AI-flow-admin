import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BrainCircuit, Database, FileScan, Image, MessageSquare, RefreshCw, Save, ScanLine, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getKbModelConfig, listEnabledModels, saveKbModelConfig, probeMineru, verifyMineru } from '../api';
import { knowledgeBaseKeys } from '../hooks/queryKeys';
import type { MineruProbeResult, KbModelCategory, KbModelConfigSave, KbModelOption } from '../types';

type FieldKey = Exclude<keyof KbModelConfigSave, 'id'>;
type Field = { key: FieldKey; category: KbModelCategory; label: string; help: string; icon: typeof Database };

const FIELDS: Field[] = [
  { key: 'embeddingModelId', category: 'embedding', label: 'Embedding 模型', help: '文档向量化与语义检索的必要配置，向量维度需与索引一致。', icon: Database },
  { key: 'parserModelId', category: 'parser', label: '文档解析服务', help: '用于 PDF 等复杂文档解析；原生可解析格式可按后端策略降级。', icon: FileScan },
  { key: 'rerankModelId', category: 'rerank', label: 'Rerank 模型', help: '对初步召回结果进行重排，提高最终命中质量。', icon: SlidersHorizontal },
  { key: 'taggingModelId', category: 'llm', label: '自动标签 LLM', help: '用于分块标签、文档知识标签和内容摘要；未绑定时自动生成功能不可用。', icon: MessageSquare },
  { key: 'llmModelId', category: 'llm', label: 'LLM 模型', help: '用于 RAG 问答生成等语言任务。', icon: MessageSquare },
  { key: 'vlmModelId', category: 'multimodal', label: 'VLM 模型', help: '用于文档内图片和多模态内容理解。', icon: Image },
  { key: 'ocrModelId', category: 'ocr', label: 'OCR 模型', help: '用于扫描件和图片文字识别。', icon: ScanLine },
];

const EMPTY: Record<FieldKey, string> = {
  taggingModelId: '', embeddingModelId: '', parserModelId: '', rerankModelId: '', llmModelId: '', vlmModelId: '', ocrModelId: '',
};

function optionLabel(model: KbModelOption) {
  const name = model.name || model.model || model.id;
  const apiName = model.name && model.model && model.name !== model.model ? ` · ${model.model}` : '';
  const dimension = model.category === 'embedding' && model.dimension ? ` · ${model.dimension}维` : '';
  return `${name}${apiName}${dimension}`;
}

export function KbEngineSettings({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [probe, setProbe] = useState<MineruProbeResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const runProbe = async (verify = false) => {
    if (!configQuery.data?.parserModelId || form.parserModelId !== configQuery.data.parserModelId) {
      toast.error('请先保存文档解析模型绑定，再执行检测');
      return;
    }
    setVerifyOpen(false);
    setChecking(true);
    setProbe(null);
    try { setProbe(await (verify ? verifyMineru() : probeMineru())); }
    catch (error) { setProbe({ compatible: false, summary: error instanceof Error ? error.message : '检测失败' }); }
    finally { setChecking(false); }
  };
  const configQuery = useQuery({ queryKey: knowledgeBaseKeys.modelConfig(), queryFn: getKbModelConfig, refetchOnWindowFocus: false });
  const modelQueries = useQueries({
    queries: FIELDS.map((field) => ({
      queryKey: knowledgeBaseKeys.modelOptions(field.category),
      queryFn: () => listEnabledModels(field.category),
    })),
  });

  useEffect(() => {
    if (!configQuery.data) return;
    setForm(Object.fromEntries(Object.keys(EMPTY).map((key) => [key, String(configQuery.data?.[key as FieldKey] ?? '')])) as Record<FieldKey, string>);
  }, [configQuery.data]);

  const saveMutation = useMutation({
    mutationFn: saveKbModelConfig,
    onSuccess: (saved) => {
      queryClient.setQueryData(knowledgeBaseKeys.modelConfig(), saved);
      setProbe(null);
      toast.success('模型配置已保存');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '配置保存失败'),
  });

  const handleSave = () => {
    saveMutation.mutate({
      id: configQuery.data?.id,
      ...Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value || '']),
      ),
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-4 border-b border-border/60 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onBack} title="返回知识库列表"><ArrowLeft size={17} /></Button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary"><BrainCircuit size={18} /></div>
          <div><h1 className="text-base font-bold">知识库模型配置</h1><p className="text-xs text-muted-foreground">配置当前租户知识库使用的默认模型</p></div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" disabled={checking || saveMutation.isPending || configQuery.isFetching} onClick={() => { setProbe(null); void configQuery.refetch(); modelQueries.forEach((query) => { void query.refetch(); }); }}><RefreshCw size={14} />刷新</Button>
        <Button size="sm" disabled={checking || configQuery.isFetching || configQuery.isError || saveMutation.isPending} onClick={handleSave}>
          <Save size={14} />{saveMutation.isPending ? '保存中...' : '保存配置'}
        </Button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto space-y-4">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-5 text-muted-foreground">
            Embedding 是文档索引和检索的必要配置；复杂文档解析还可能依赖 Parser、OCR 或 VLM。这里只展示模型中心中已启用且类别匹配的模型。
          </div>
          <Link className="inline-flex items-center rounded-md text-xs font-medium text-primary underline-offset-4 hover:underline" to="/agents/models">前往模型管理配置模型</Link>
          {configQuery.isError && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{configQuery.error.message}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            {FIELDS.map((field, index) => {
              const Icon = field.icon;
              const available = modelQueries[index].data ?? [];
              const bindingKey = field.key.replace(/Id$/, '') as 'embeddingModel' | 'rerankModel' | 'llmModel' | 'taggingModel' | 'vlmModel' | 'ocrModel' | 'parserModel';
              const binding = configQuery.data?.[bindingKey];
              const selected = form[field.key];
              const selectedBinding = binding && selected === (binding.modelId ?? binding.id) ? binding : undefined;
              const models = selected && !available.some((model) => model.id === selected)
                ? [{ ...selectedBinding, id: selected, name: selectedBinding?.name || '模型不可用', status: selectedBinding?.status ?? 1 }, ...available]
                : available;
              return (
                <section key={field.key} className="rounded-2xl border border-border/60 bg-card/50 p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={17} /></div>
                    <div><div className="flex items-center gap-2"><h2 className="text-sm font-semibold">{field.label}</h2>{field.key === 'embeddingModelId' && <Badge variant="secondary" size="compact">必要</Badge>}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{field.help}</p></div>
                  </div>
                  <Select disabled={checking || configQuery.isFetching || configQuery.isError || saveMutation.isPending} value={form[field.key] || '__none__'} onValueChange={(value) => { if (field.key === 'parserModelId') setProbe(null); setForm((current) => ({ ...current, [field.key]: value === '__none__' ? '' : value })); }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="选择已启用模型" /></SelectTrigger>
                    <SelectContent><SelectItem value="__none__">不绑定</SelectItem>{models.map((model) => <SelectItem key={model.id} value={model.id} disabled={model.status === 1}>{optionLabel(model)}{model.status === 1 ? '（已关闭或不可用）' : ''}</SelectItem>)}</SelectContent>
                  </Select>
                  {binding && selected === (binding.modelId ?? binding.id) && <p className="mt-2 text-xs text-muted-foreground">当前绑定：{optionLabel(binding)}</p>}
                  {modelQueries[index].isError && <p className="mt-2 text-xs text-destructive">模型列表加载失败</p>}
                  {field.key === 'parserModelId' && <div className="mt-3 space-y-2">
                    <Button variant="outline" size="sm" disabled={checking || saveMutation.isPending || !configQuery.data?.parserModelId || form.parserModelId !== configQuery.data.parserModelId} onClick={() => void runProbe()}>{checking ? '检测中...' : '检测 MinerU'}</Button>
                    <p className="text-xs text-muted-foreground">先保存绑定后检测。由知识库服务检查地址和协议，不上传文件。</p>
                    {probe && <div role="status" className="rounded-lg border border-border p-3 text-xs space-y-2"><p>{probe.compatible ? '检测通过' : '检测未通过'}：{probe.summary}</p><p className="break-all">{probe.baseUrl} · 协议：{probe.protocol ?? 'unknown'} · access_mode：{probe.accessMode ?? 'auto'}</p>{probe.protocol === 'legacy-local' && <p>请升级至 MinerU 4 并配置 V1 API。</p>}{[...(probe.checks ?? []), ...(probe.diagnostics ?? [])].map((message, i) => <p key={i}>{message}</p>)}{probe.compatible && probe.protocol === 'official-cloud' && <Button variant="outline" size="sm" disabled={checking || saveMutation.isPending || form.parserModelId !== configQuery.data?.parserModelId} onClick={() => setVerifyOpen(true)}>官网端到端验证</Button>}</div>}
                  </div>}
                  {!modelQueries[index].isLoading && models.length === 0 && <p className="mt-2 text-xs text-amber-500">模型中心暂无已启用的 {field.category} 模型</p>}
                </section>
              );
            })}
          </div>
        </div>
      </div>
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent><DialogHeader><DialogTitle>官网端到端验证</DialogTitle><DialogDescription>将上传极小测试 PDF 到 MinerU 官网并创建一次解析任务，可能消耗配额。</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setVerifyOpen(false)}>取消</Button><Button disabled={checking} onClick={() => void runProbe(true)}>确认验证</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
