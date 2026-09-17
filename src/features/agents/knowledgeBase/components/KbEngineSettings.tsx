import { useEffect, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BrainCircuit, Database, FileScan, Image, MessageSquare, ScanLine, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getKbModelConfig, listEnabledModels, saveKbModelConfig } from '../api';
import { knowledgeBaseKeys } from '../hooks/queryKeys';
import type { KbModelCategory, KbModelConfigSave, KbModelOption } from '../types';

type FieldKey = Exclude<keyof KbModelConfigSave, 'id'>;
type Field = { key: FieldKey; category: KbModelCategory; label: string; help: string; icon: typeof Database };

const FIELDS: Field[] = [
  { key: 'embeddingModelId', category: 'embedding', label: 'Embedding 模型', help: '文档向量化与语义检索的必要配置，向量维度需与索引一致。', icon: Database },
  { key: 'parserModelId', category: 'parser', label: '文档解析服务', help: '用于 PDF 等复杂文档解析；原生可解析格式可按后端策略降级。', icon: FileScan },
  { key: 'rerankModelId', category: 'rerank', label: 'Rerank 模型', help: '对初步召回结果进行重排，提高最终命中质量。', icon: SlidersHorizontal },
  { key: 'llmModelId', category: 'llm', label: 'LLM 模型', help: '用于 RAG 问答生成等语言任务。', icon: MessageSquare },
  { key: 'vlmModelId', category: 'multimodal', label: 'VLM 模型', help: '用于文档内图片和多模态内容理解。', icon: Image },
  { key: 'ocrModelId', category: 'ocr', label: 'OCR 模型', help: '用于扫描件和图片文字识别。', icon: ScanLine },
];

const EMPTY: Record<FieldKey, string> = {
  embeddingModelId: '', parserModelId: '', rerankModelId: '', llmModelId: '', vlmModelId: '', ocrModelId: '',
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
  const configQuery = useQuery({ queryKey: knowledgeBaseKeys.modelConfig(), queryFn: getKbModelConfig });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.modelConfig() });
      toast.success('知识库引擎配置已保存');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '配置保存失败'),
  });

  const handleSave = () => {
    if (!form.embeddingModelId) {
      toast.error('请先选择 Embedding 模型；它是文档解析、索引和检索的必要配置');
      return;
    }
    saveMutation.mutate({
      id: configQuery.data?.id,
      ...Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value || undefined]),
      ),
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onBack} title="返回知识库列表"><ArrowLeft size={17} /></Button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary"><BrainCircuit size={18} /></div>
          <div><h1 className="text-base font-bold">知识库引擎设置</h1><p className="text-xs text-muted-foreground">配置当前租户知识库使用的默认模型</p></div>
        </div>
        <Button size="sm" disabled={configQuery.isLoading || saveMutation.isPending} onClick={handleSave}>
          {saveMutation.isPending ? '保存中...' : '保存配置'}
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-5 text-muted-foreground">
            Embedding 是文档索引和检索的必要配置；复杂文档解析还可能依赖 Parser、OCR 或 VLM。这里只展示模型中心中已启用且类别匹配的模型。
          </div>
          {configQuery.isError && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{configQuery.error.message}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            {FIELDS.map((field, index) => {
              const Icon = field.icon;
              const models = modelQueries[index].data ?? [];
              return (
                <section key={field.key} className="rounded-2xl border border-border/60 bg-card/50 p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={17} /></div>
                    <div><div className="flex items-center gap-2"><h2 className="text-sm font-semibold">{field.label}</h2>{field.key === 'embeddingModelId' && <Badge variant="secondary" className="text-[10px]">必要</Badge>}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{field.help}</p></div>
                  </div>
                  <Select value={form[field.key] || '__none__'} onValueChange={(value) => setForm((current) => ({ ...current, [field.key]: value === '__none__' ? '' : value }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="选择已启用模型" /></SelectTrigger>
                    <SelectContent>{field.key !== 'embeddingModelId' && <SelectItem value="__none__">暂不配置</SelectItem>}{models.map((model) => <SelectItem key={model.id} value={model.id}>{optionLabel(model)}</SelectItem>)}</SelectContent>
                  </Select>
                  {!modelQueries[index].isLoading && models.length === 0 && <p className="mt-2 text-xs text-amber-500">模型中心暂无已启用的 {field.category} 模型</p>}
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
