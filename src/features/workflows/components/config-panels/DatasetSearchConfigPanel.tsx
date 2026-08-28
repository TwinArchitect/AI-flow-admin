import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, Settings2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { queryWorkflowDatasets } from '../../api/knowledgeApi';
import {
  DATASET_SEARCH_NODE_OUTPUTS,
  normalizeDatasetSearchConfig,
} from '../../contracts/datasetSearchNodeContract';
import type { DatasetSearchMode, DatasetSearchNodeConfig, WorkflowVariableOption } from '../../types';
import { buildErrorCatchHandle } from '../../utils/edgeHandles';
import { DatasetSearchParamsDialog } from './DatasetSearchParamsDialog';
import { Field } from './shared/Field';
import { VariablePicker } from './shared/VariablePicker';

const SEARCH_MODES: Array<{ value: DatasetSearchMode; label: string }> = [
  { value: 'embedding', label: '语义检索' },
  { value: 'fullTextRecall', label: '全文检索' },
  { value: 'mixedRecall', label: '混合检索' },
];

export function DatasetSearchConfigPanel({
  nodeId,
  config,
  variables,
  onUpdate,
  onRemoveSourceHandle,
}: {
  nodeId: string;
  config: Record<string, unknown>;
  variables: WorkflowVariableOption[];
  onUpdate: (config: Partial<DatasetSearchNodeConfig>) => void;
  onRemoveSourceHandle: (handleId: string) => void;
}) {
  const value = normalizeDatasetSearchConfig(config);
  const [datasetOpen, setDatasetOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [paramsOpen, setParamsOpen] = useState(false);
  const datasetsQuery = useQuery({
    queryKey: ['workflow', 'datasets', appliedKeyword],
    queryFn: () => queryWorkflowDatasets(appliedKeyword),
    enabled: datasetOpen,
  });

  const selectedIds = new Set(value.datasets.map((item) => item.datasetId));
  const updateSearchInput = (patch: Partial<DatasetSearchNodeConfig['searchInput']>) => {
    onUpdate({ searchInput: { ...value.searchInput, ...patch } });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="text-xs font-semibold text-foreground">知识库</div>
        <Field label="选择知识库">
          <Popover open={datasetOpen} onOpenChange={setDatasetOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between font-normal">
                <span className="truncate">
                  {value.datasets.length ? `已选择 ${value.datasets.length} 个知识库` : '搜索并选择知识库'}
                </span>
                <BookOpen size={14} className="text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[340px] p-2">
              <form
                className="mb-2 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  setAppliedKeyword(keyword.trim());
                }}
              >
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索知识库名称"
                  className="h-8 text-xs"
                />
                <Button type="submit" size="icon-sm" variant="secondary" aria-label="搜索知识库">
                  <Search size={13} />
                </Button>
              </form>
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {datasetsQuery.isLoading ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">加载中...</p>
                ) : datasetsQuery.error ? (
                  <p className="py-6 text-center text-xs text-destructive">知识库列表加载失败</p>
                ) : !datasetsQuery.data?.length ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">暂无可用知识库</p>
                ) : datasetsQuery.data.map((dataset) => {
                  const checked = selectedIds.has(dataset.id);
                  return (
                    <button
                      key={dataset.id}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-muted"
                      onClick={() => onUpdate({
                        datasets: checked
                          ? value.datasets.filter((item) => item.datasetId !== dataset.id)
                          : [...value.datasets, {
                            datasetId: dataset.id,
                            name: dataset.name,
                            avatar: 'core/dataset/commonDatasetColor',
                            isDeleted: false,
                          }],
                      })}
                    >
                      <Checkbox checked={checked} tabIndex={-1} />
                      <span className="min-w-0 flex-1 truncate text-xs">{dataset.name}</span>
                      <span className="text-[10px] text-muted-foreground">{dataset.documentCount ?? 0} 文档</span>
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
          {value.datasets.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {value.datasets.map((dataset) => (
                <div key={dataset.datasetId} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2">
                  <BookOpen size={13} className="shrink-0 text-blue-500" />
                  <span className="min-w-0 flex-1 truncate text-xs">{dataset.name || dataset.datasetId}</span>
                  {dataset.isDeleted && <Badge variant="destructive" className="text-[9px]">已删除</Badge>}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onUpdate({ datasets: value.datasets.filter((item) => item.datasetId !== dataset.datasetId) })}
                    aria-label="移除知识库"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Field>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <div className="text-xs font-semibold text-foreground">检索内容</div>
        <Field label="输入方式">
          <Select
            value={value.searchInput.valueMode}
            onValueChange={(valueMode: 'input' | 'reference') => updateSearchInput({ valueMode, value: '' })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="reference">引用上游变量</SelectItem>
              <SelectItem value="input">固定文本</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="检索词或检索语句">
          {value.searchInput.valueMode === 'reference' && (
            <div className="mb-2 flex justify-end">
              <VariablePicker
                variables={variables}
                onSelect={(ref) => updateSearchInput({
                  value: [value.searchInput.value.trim(), ref].filter(Boolean).join(' '),
                })}
              />
            </div>
          )}
          <Textarea
            value={value.searchInput.value}
            onChange={(event) => updateSearchInput({ value: event.target.value })}
            placeholder={value.searchInput.valueMode === 'reference' ? '选择一个或多个上游变量' : '输入固定检索内容'}
            className="min-h-20 font-mono text-xs"
          />
        </Field>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setParamsOpen(true)}
        >
          <span>检索参数</span>
          <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
            {SEARCH_MODES.find((item) => item.value === value.searchMode)?.label} · {value.limit} 条
            <Settings2 size={13} />
          </span>
        </Button>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
          <div>
            <p className="text-xs font-medium">启用异常分支</p>
            <p className="text-[10px] text-muted-foreground">检索失败后通过异常分支继续执行</p>
          </div>
          <Switch
            size="sm"
            checked={value.catchError}
            onCheckedChange={(catchError) => {
              if (!catchError) onRemoveSourceHandle(buildErrorCatchHandle(nodeId));
              onUpdate({ catchError });
            }}
          />
        </div>
      </section>

      <section className="space-y-2 border-t border-border pt-5">
        <div className="text-xs font-semibold text-foreground">系统输出</div>
        <div className="flex flex-wrap gap-2">
          {DATASET_SEARCH_NODE_OUTPUTS.map((output) => (
            <Badge key={output.key} variant="outline" className="font-mono text-[10px]">
              {output.key}: {output.valueType}
            </Badge>
          ))}
        </div>
      </section>
      <DatasetSearchParamsDialog
        open={paramsOpen}
        config={value}
        onOpenChange={setParamsOpen}
        onConfirm={onUpdate}
      />
    </div>
  );
}
