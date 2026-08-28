import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { queryWorkflowRerankModels } from '../../api/knowledgeApi';
import {
  DATASET_SEARCH_LIMIT_MAX,
  DATASET_SEARCH_LIMIT_MIN,
  normalizeDatasetSearchConfig,
} from '../../contracts/datasetSearchNodeContract';
import type { DatasetSearchMode, DatasetSearchNodeConfig } from '../../types';
import { Field } from './shared/Field';

const SEARCH_MODES: Array<{ value: DatasetSearchMode; label: string; description: string }> = [
  { value: 'embedding', label: '语义检索', description: '基于向量相似度召回' },
  { value: 'fullTextRecall', label: '全文检索', description: '基于关键词全文匹配' },
  { value: 'mixedRecall', label: '混合检索', description: '语义与全文加权融合' },
];

type ParamsDraft = Pick<
  DatasetSearchNodeConfig,
  'similarity' | 'limit' | 'searchMode' | 'embeddingWeight' |
  'usingReRank' | 'rerankModel' | 'rerankWeight'
>;

function paramsFromConfig(config: DatasetSearchNodeConfig): ParamsDraft {
  const value = normalizeDatasetSearchConfig(config);
  return {
    similarity: value.similarity,
    limit: value.limit,
    searchMode: value.searchMode,
    embeddingWeight: value.embeddingWeight,
    usingReRank: value.usingReRank,
    rerankModel: value.rerankModel,
    rerankWeight: value.rerankWeight,
  };
}

export function DatasetSearchParamsDialog({
  open,
  config,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  config: DatasetSearchNodeConfig;
  onOpenChange: (open: boolean) => void;
  onConfirm: (config: ParamsDraft) => void;
}) {
  const [draft, setDraft] = useState<ParamsDraft>(() => paramsFromConfig(config));
  const rerankQuery = useQuery({
    queryKey: ['workflow', 'models', 'rerank'],
    queryFn: queryWorkflowRerankModels,
    enabled: open,
  });

  useEffect(() => {
    if (open) setDraft(paramsFromConfig(config));
  }, [open, config]);

  const patch = (value: Partial<ParamsDraft>) => setDraft((current) => ({ ...current, ...value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>检索参数</DialogTitle>
          <DialogDescription>配置知识库召回、过滤与结果重排参数。</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <Field label="检索模式">
            <Select value={draft.searchMode} onValueChange={(searchMode: DatasetSearchMode) => patch({ searchMode })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEARCH_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              {SEARCH_MODES.find((mode) => mode.value === draft.searchMode)?.description}
            </p>
          </Field>

          {draft.searchMode === 'mixedRecall' ? (
            <Field label={`语义权重：${draft.embeddingWeight.toFixed(2)}`}>
              <Slider min={0} max={1} step={0.01} value={[draft.embeddingWeight]} onValueChange={([embeddingWeight]) => patch({ embeddingWeight })} />
              <p className="text-[10px] text-muted-foreground">全文权重为 1 − 语义权重。</p>
            </Field>
          ) : null}

          <Field label={`最低相关度：${draft.similarity.toFixed(2)}`}>
            <Slider min={0} max={1} step={0.01} value={[draft.similarity]} onValueChange={([similarity]) => patch({ similarity })} />
          </Field>

          <Field label="引用上限">
            <Input
              type="number"
              min={DATASET_SEARCH_LIMIT_MIN}
              max={DATASET_SEARCH_LIMIT_MAX}
              value={draft.limit}
              onChange={(event) => patch({ limit: Number(event.target.value) || DATASET_SEARCH_LIMIT_MIN })}
            />
          </Field>

          <div className="space-y-4 rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium">结果重排</p>
                <p className="text-[10px] text-muted-foreground">使用 Rerank 模型优化检索结果顺序。</p>
              </div>
              <Switch
                size="sm"
                checked={draft.usingReRank}
                onCheckedChange={(usingReRank) => {
                  const first = rerankQuery.data?.[0];
                  patch({
                    usingReRank,
                    ...(usingReRank && !draft.rerankModel && first
                      ? { rerankModel: first.model?.trim() || first.id }
                      : {}),
                  });
                }}
              />
            </div>

            {draft.usingReRank ? (
              <div className="space-y-4 border-t border-border pt-4">
                <Field label="Rerank 模型">
                  <Select value={draft.rerankModel} onValueChange={(rerankModel) => patch({ rerankModel })}>
                    <SelectTrigger><SelectValue placeholder={rerankQuery.isLoading ? '加载中...' : '请选择 Rerank 模型'} /></SelectTrigger>
                    <SelectContent>
                      {draft.rerankModel && !rerankQuery.data?.some((model) => (model.model?.trim() || model.id) === draft.rerankModel) ? (
                        <SelectItem value={draft.rerankModel}>{draft.rerankModel}（当前配置）</SelectItem>
                      ) : null}
                      {rerankQuery.data?.map((model) => (
                        <SelectItem key={model.id} value={model.model?.trim() || model.id}>{model.name || model.model || model.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {rerankQuery.error ? <p className="text-xs text-destructive">Rerank 模型加载失败</p> : null}
                </Field>

                <Field label={`重排权重：${draft.rerankWeight.toFixed(2)}`}>
                  <Slider min={0} max={1} step={0.01} value={[draft.rerankWeight]} onValueChange={([rerankWeight]) => patch({ rerankWeight })} />
                  <p className="text-[10px] text-warning">当前后端执行器尚未使用该字段，前端按参照项目保留配置。</p>
                </Field>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="button" onClick={() => { onConfirm(draft); onOpenChange(false); }}>确认</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
