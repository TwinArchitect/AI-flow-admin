import { useCallback, useEffect, useRef, useState } from 'react';
import { ListPageLayout, ListPageHeader, ListPageContent, ListPageFooter } from '@/components/layout/ListPageLayout';
import {
  Plus,
  Search,
  Trash2,
  Activity,
  AlertTriangle,
  Cpu,
  Clock,
  Pencil,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { AgentOpenModel, ModelCategory, ModelCategoryItem, ModelDebugResult, ModelVendor } from './types';
import {
  debugModel,
  debugModelStream,
  deleteModel,
  getModel,
  getModelCategories,
  queryModels,
  saveModel,
  updateModel,
} from './modelApi';
import {
  formatParamsForEdit,
  isModelActive,
  maskAuthToken,
  modelAddressDisplay,
  modelCategoryLabel,
  MODEL_CATEGORY_DEFAULT_API_PATH,
  resolveModelCategory,
  syncTypeFromCategory,
  validateParamsJson,
  validateModelEndpoint,
  resolveModelEndpoint,
  resolveVendorForCategory,
  joinModelEndpoint,
  vendorLabel,
  vendorsForCategory,
} from './utils';

// ====== 表单状态 ======

type FormState = {
  name: string;
  model: string;
  baseUrl: string;
  apiPath: string;
  category: ModelCategory;
  vendor: ModelVendor;
  status: number;
  isDefault: number;
  dimension: string;
  sendDimensions: boolean;
  authToken: string;
  remark: string;
  params: string;
};

const emptyForm = (): FormState => ({
  name: '',
  model: '',
  baseUrl: '',
  apiPath: MODEL_CATEGORY_DEFAULT_API_PATH.llm,
  category: 'llm',
  vendor: 'openai',
  status: 0,
  isDefault: 0,
  dimension: '',
  sendDimensions: true,
  authToken: '',
  remark: '',
  params: '',
});

// ====== 页面区间大小 ======

const PAGE_SIZE = 12;

const DEFAULT_RERANK_DOCUMENTS = [
  '人工智能和大模型在各个行业中正实现快速的渗透与融合落地。',
  '向量数据库是高维向量近似最近邻搜索的重要基础架构，广泛用于知识库。',
  '重排模型作为二阶段排序能够明显纠正一阶段检索的精度偏置。',
  '本周全国大部地区气温明显回升，华北黄淮等地可能迎来高温。',
];

const CATEGORY_COLORS: Record<ModelCategory, string> = {
  llm: 'bg-amber-500',
  multimodal: 'bg-rose-500',
  embedding: 'bg-emerald-500',
  rerank: 'bg-indigo-500',
  ocr: 'bg-violet-500',
  parser: 'bg-sky-500',
};

// ====== 组件 ======

export default function ModelManagement() {
  const [categories, setCategories] = useState<ModelCategoryItem[]>([]);
  const [models, setModels] = useState<AgentOpenModel[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const loadSequenceRef = useRef(0);

  const [searchInput, setSearchInput] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [appliedQuery, setAppliedQuery] = useState({ model: '', type: '', status: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AgentOpenModel | null>(null);
  const [debugTarget, setDebugTarget] = useState<AgentOpenModel | null>(null);
  const debugAbortRef = useRef<AbortController | null>(null);
  const [debugStreamText, setDebugStreamText] = useState('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [debugRawStreamEvents, setDebugRawStreamEvents] = useState<string[]>([]);
  const [debugText, setDebugText] = useState('hello embedding');
  const [debugQuery, setDebugQuery] = useState('什么是 RAG？');
  const [debugDocuments, setDebugDocuments] = useState([...DEFAULT_RERANK_DOCUMENTS]);
  const [debugImageBase64, setDebugImageBase64] = useState('');
  useEffect(() => () => { debugAbortRef.current?.abort(); }, []);
  const [debugPrompt, setDebugPrompt] = useState('你好，请简短回复 OK');
  const [debugTimeout, setDebugTimeout] = useState(30);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugResult, setDebugResult] = useState<ModelDebugResult | null>(null);

  const loadData = useCallback(async () => {
    const sequence = ++loadSequenceRef.current;
    setLoading(true);
    setError('');
    const [pageResult, categoryResult] = await Promise.allSettled([
      queryModels({
        pageNum,
        pageSize,
        model: appliedQuery.model || undefined,
        category: (appliedQuery.type as ModelCategory) || undefined,
        status: appliedQuery.status === '' ? undefined : Number(appliedQuery.status),
      }),
      getModelCategories(),
    ]);
    if (sequence !== loadSequenceRef.current) return;

    if (pageResult.status === 'fulfilled') {
      const page = pageResult.value;
      setModels(page?.records || []);
      setTotal(page?.total || 0);
    } else {
      const e: unknown = pageResult.reason;
      setError(e instanceof Error ? e.message : '加载失败');
      setModels([]);
      setTotal(0);
    }
    if (categoryResult.status === 'fulfilled') {
      setCategories(categoryResult.value?.categories || []);
    } else if (pageResult.status === 'fulfilled') {
      toast.warning('分类统计加载失败，请稍后刷新');
    }
    setLoading(false);
  }, [pageNum, pageSize, appliedQuery]);

  useEffect(() => {
    loadData();
    return () => { loadSequenceRef.current += 1; };
  }, [loadData]);



  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const categoryOptions = categories.length
    ? categories
    : (['llm', 'multimodal', 'embedding', 'rerank', 'ocr', 'parser'] as ModelCategory[]).map((code) => ({
        code,
        label: modelCategoryLabel(code),
        defaultApiPath: MODEL_CATEGORY_DEFAULT_API_PATH[code],
        count: 0,
      }));

  const openCreate = () => {
    setEditingId(null);
    const category = filterType && filterType !== 'all' ? filterType as ModelCategory : 'llm';
    setForm({ ...emptyForm(), category, vendor: resolveVendorForCategory(category), apiPath: MODEL_CATEGORY_DEFAULT_API_PATH[category] });
    setIsModalOpen(true);
  };

  const openEdit = async (item: AgentOpenModel) => {
    try {
      const detail = await getModel(item.id);
      const data = detail || item;
      setEditingId(data.id);
      const category = resolveModelCategory(data);
      const endpoint = resolveModelEndpoint(data);
      setForm({
        name: data.name || '',
        model: data.model || '',
        baseUrl: endpoint.baseUrl,
        apiPath: endpoint.apiPath,
        category,
        vendor: resolveVendorForCategory(category, data.vendor),
        status: data.status ?? 0,
        isDefault: data.isDefault === 1 ? 1 : 0,
        dimension: data.dimension == null ? '' : String(data.dimension),
        sendDimensions: data.sendDimensions ?? true,
        authToken: data.authToken || '',
        remark: data.remark || '',
        params: formatParamsForEdit(data.params),
      });
      setIsModalOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '获取详情失败');
    }
  };

  const handleSave = async () => {
    if (form.category !== 'ocr' && form.category !== 'parser' && !form.model.trim()) {
      toast.error('模型标识不能为空');
      return;
    }
    const apiPath = form.apiPath.trim() || MODEL_CATEGORY_DEFAULT_API_PATH[form.category];
    const urlErr = validateModelEndpoint(form.baseUrl, apiPath);
    if (urlErr) {
      toast.error(urlErr);
      return;
    }
    if (form.category === 'embedding' && (!form.dimension.trim() || !Number.isInteger(Number(form.dimension)) || Number(form.dimension) <= 0)) {
      toast.error('Embedding 模型须填写有效的向量维度');
      return;
    }
    const paramsErr = validateParamsJson(form.params);
    if (paramsErr) {
      toast.error(paramsErr);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        model: form.model.trim(),
        name: form.name.trim() || undefined,
        baseUrl: form.baseUrl.trim() || undefined,
        apiPath,
        dimension: form.category === 'embedding' ? Number(form.dimension) : undefined,
        sendDimensions: form.category === 'embedding' ? form.sendDimensions : undefined,
        category: form.category,
        type: syncTypeFromCategory(form.category),
        vendor: form.vendor,
        status: form.status,
        isDefault: form.isDefault,
        remark: form.remark.trim() || undefined,
        params: form.params.trim() || undefined,
        authToken: form.authToken.trim() || undefined,
      };
      if (editingId) {
        if (!payload.authToken) {
          const detail = await getModel(editingId);
          if (detail?.authToken) payload.authToken = detail.authToken;
        }
        await updateModel({ id: editingId, ...payload });
      } else {
        await saveModel(payload);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      await loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: AgentOpenModel) => {
    const nextStatus = isModelActive(item.status) ? 1 : 0;
    try {
      const detail = await getModel(item.id);
      const data = detail || item;
      await updateModel({
        id: data.id,
        model: data.model,
        name: data.name,
        ...resolveModelEndpoint(data),
        dimension: data.dimension,
        sendDimensions: data.sendDimensions,
        category: resolveModelCategory(data),
        type: syncTypeFromCategory(resolveModelCategory(data)),
        vendor: resolveVendorForCategory(resolveModelCategory(data), data.vendor),
        status: nextStatus,
        isDefault: data.isDefault,
        remark: data.remark,
        params: data.params,
        authToken: data.authToken,
      });
      await loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '状态更新失败');
    }
  };

  const handleDelete = (item: AgentOpenModel) => {
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteModel(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    }
  };

  const openDebug = async (item: AgentOpenModel) => {
    setDebugStreamText('');
    setDebugLogs([]);
    setDebugRawStreamEvents([]);
    setDebugImageBase64('');
    setDebugText('hello embedding');
    setDebugQuery('什么是 RAG？');
    setDebugDocuments([...DEFAULT_RERANK_DOCUMENTS]);
    setDebugTarget(item);
    setDebugPrompt('你好，请简短回复 OK');
    setDebugTimeout(30);
    setDebugResult(null);
    try {
      const detail = await getModel(item.id);
      if (detail) setDebugTarget(detail);
    } catch {
      // use row data
    }
  };

  const closeDebug = () => {
    debugAbortRef.current?.abort();
    debugAbortRef.current = null;
    setDebugTarget(null);
    setDebugLoading(false);
  };

  const runDebug = async () => {
    if (!debugTarget) return;
    debugAbortRef.current?.abort();
    const controller = new AbortController();
    debugAbortRef.current = controller;
    setDebugLoading(true);
    setDebugResult(null);
    setDebugStreamText('');
    setDebugRawStreamEvents([]);
    const category = resolveModelCategory(debugTarget);
    setDebugLogs([`开始调试：${debugTarget.name || debugTarget.model}`, `使用${category === 'llm' || category === 'multimodal' ? '流式接口 /debug/stream' : '同步接口 /debug'}`]);
    const payload = { id: debugTarget.id, prompt: debugPrompt, text: debugText || debugPrompt,
      query: debugQuery, documents: debugDocuments.filter((item) => item.trim()),
      imageBase64: debugImageBase64 || undefined, timeoutSeconds: debugTimeout };
    try {
      const result = category === 'llm' || category === 'multimodal'
        ? await debugModelStream(payload, { onChunk: (chunk) => {
            if (controller.signal.aborted) return;
            if (chunk.content) setDebugStreamText((previous) => previous + chunk.content);
            if (chunk.rawData) setDebugRawStreamEvents((previous) => [...previous, chunk.rawData!]);
          } }, controller.signal)
        : await debugModel(payload);
      if (!controller.signal.aborted) {
        setDebugResult(result);
        if (category === 'embedding') {
          const dimensionLogs: string[] = [];
          if (result.dimensionsSent != null) dimensionLogs.push(result.dimensionsSent
            ? '请求已携带 dimensions 参数' : '请求未携带 dimensions，使用模型服务默认维度');
          if (result.actualDimension != null) {
            dimensionLogs.push(`实际返回向量维度：${result.actualDimension}`);
            if (result.configuredDimension != null && result.configuredDimension > 0) dimensionLogs.push(
              `配置向量维度：${result.configuredDimension}，${result.actualDimension === result.configuredDimension ? '校验通过' : '维度不匹配，知识库调用将拒绝此向量'}`,
            );
          }
          setDebugLogs(previous => [...previous, ...dimensionLogs]);
        }
        setDebugLogs((previous) => [...previous, `${result.success ? '成功' : '失败'}，耗时 ${result.costMs ?? '-'} ms`]);
      }
    } catch (error) {
      if (!controller.signal.aborted) setDebugResult({ success: false, errorMessage: error instanceof Error ? error.message : '调试请求失败' });
    } finally {
      if (!controller.signal.aborted) setDebugLoading(false);
    }
  };

  const handleSearch = () => {
    setAppliedQuery({
      model: searchInput.trim(),
      type: filterType === 'all' ? '' : filterType,
      status: filterStatus === 'all' ? '' : filterStatus,
    });
    setPageNum(1);
  };

  const applyFilters = (type: string, status: string) => {
    setAppliedQuery({
      model: searchInput.trim(),
      type: type === 'all' ? '' : type,
      status: status === 'all' ? '' : status,
    });
    setPageNum(1);
  };

  const formatDate = (value?: string) => {
    if (!value) return '-';
    return value.slice(0, 10);
  };

  return (
    <ListPageLayout>
      <ListPageHeader>
        {/* ====== 头部 ====== */}
        <div className="shrink-0 flex flex-col justify-between gap-4 border-b border-line bg-background pb-4 md:flex-row md:items-center">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              <h1 className="text-2xl font-bold text-fg tracking-tight">模型管理</h1>
            </div>
            <p className="text-[11px] text-fg-muted pl-[18px]">
              针对大模型调用分散、使用情况不清晰等问题，提供统一的模型管理与监控能力
              <br />
              支持接入集团大模型，全面适配各类主流厂商模型
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索模型名称..."
                className="pl-10 w-64"
              />
            </div>
            <Select
              value={filterType || undefined}
              onValueChange={(v) => {
                setFilterType(v);
                applyFilters(v, filterStatus);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="全部类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.code} value={category.code}>
                    {category.label} {category.count > 0 ? `(${category.count})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterStatus || undefined}
              onValueChange={(v) => {
                setFilterStatus(v);
                applyFilters(filterType, v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="0">开启</SelectItem>
                <SelectItem value="1">关闭</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleSearch}>
              <RefreshCw size={16} />
              查询
            </Button>
            <Button onClick={openCreate}>
              <Plus size={18} />
              添加新模型
            </Button>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2" aria-label="模型分类统计">
          <Button variant={!filterType || filterType === 'all' ? 'secondary' : 'outline'} onClick={() => { setFilterType('all'); applyFilters('all', filterStatus); }}>全部模型（{categories.reduce((sum, item) => sum + item.count, 0)}）</Button>
          {categoryOptions.map((item) => <Button key={item.code} variant={filterType === item.code ? 'secondary' : 'outline'} onClick={() => { setFilterType(item.code); applyFilters(item.code, filterStatus); }}>{item.label}（{item.count}）</Button>)}
        </div>

        {/* ====== 错误提示 ====== */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

      </ListPageHeader>
        <ListPageContent>
        {/* ====== 模型卡片网格 ====== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
          {loading && (
            <div className="absolute inset-0 z-10 rounded-2xl pointer-events-none p-6 flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
              ))}
            </div>
          )}
          {models.map((model) => {
            const active = isModelActive(model.status);
            return (
              <Card
                key={model.id}
                className="flex h-full flex-col gap-0 overflow-hidden border-line bg-surface p-0 transition-shadow hover:shadow-md"
              >
                {/* 状态条 */}
                <div className={cn('h-1.5 w-full shrink-0', active ? CATEGORY_COLORS[resolveModelCategory(model)] : 'bg-muted')} />

                <CardContent className="flex flex-1 flex-col p-6">
                  {/* 顶部：图标 + 编辑/删除 + 开关 */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-muted/50 border border-line/40 text-primary">
                      <Cpu size={24} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button tone="brand" variant="ghost" size="icon-sm" aria-label={`编辑 ${model.name || model.model}`} title="编辑" onClick={() => openEdit(model)}><Pencil size={16} /></Button>
                      <Button tone="danger" variant="ghost" size="icon-sm" aria-label={`删除 ${model.name || model.model}`} title="删除" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(model)}><Trash2 size={16} /></Button>
                      <Switch
                        checked={active}
                        onCheckedChange={() => toggleStatus(model)}
                      />
                    </div>
                  </div>

                  {/* 模型名称 + 厂商信息 */}
                  <div className="mb-4 min-h-28">
                    <h3
                      className="text-lg font-bold text-fg mb-1 truncate"
                      title={model.model}
                    >
                      {model.name?.trim() || model.model}
                    </h3>
                    {model.name?.trim() && <p className="truncate text-xs text-muted-foreground">{model.model}</p>}
                    {model.isDefault === 1 && <Badge variant="secondary">默认模型</Badge>}
                    {resolveModelCategory(model) === 'embedding' && model.dimension != null && <p className="text-xs text-muted-foreground">向量维度：{model.dimension}</p>}
                    <p className="text-xs text-fg-muted font-bold uppercase tracking-widest truncate">
                      {vendorLabel(model.vendor)} · {modelCategoryLabel(resolveModelCategory(model))}
                    </p>
                  </div>

                  {/* 描述 */}
                  <div className="mb-4 h-10">
                    <p className="text-xs text-fg-muted line-clamp-2 leading-relaxed">
                      {model.remark || '暂无描述'}
                    </p>
                  </div>

                  <div className="mb-5 min-h-20 rounded-xl border border-line/50 bg-muted/20 p-3">
                  {/* URL */}
                  <p className="text-[10px] text-fg-muted truncate mb-2" title={modelAddressDisplay(model)}>
                    {modelAddressDisplay(model)}
                  </p>

                  {/* Token */}
                  {model.authToken && (
                    <p className="text-[10px] text-fg-muted truncate font-mono">
                      Token: {maskAuthToken(model.authToken)}
                    </p>
                  )}

                  </div>

                  {/* 底部状态栏 */}
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-4">
                    <div className="flex items-center gap-1.5">
                      <Activity
                        size={14}
                        className={active ? 'text-emerald-500' : 'text-fg-muted'}
                      />
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase',
                          active ? 'text-emerald-600 dark:text-emerald-400' : 'text-fg-muted',
                        )}
                      >
                        {active ? '开启' : '关闭'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-fg-muted font-bold">
                      <Clock size={12} />
                      {formatDate(model.createTime)}
                    </div>
                    <Button variant="secondary" size="sm" disabled={!active} onClick={() => openDebug(model)}><Zap size={14} />调试</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ====== 空状态 ====== */}
        {!loading && !models.length && (
          <Alert className="text-center py-8 justify-center">
            <AlertDescription>暂无模型配置</AlertDescription>
          </Alert>
        )}

        </ListPageContent>
        {/* ====== 分页 ====== */}
          <ListPageFooter>
            <Pagination page={pageNum} pageCount={totalPages} pageSize={pageSize} total={total} onPageChange={setPageNum} onPageSizeChange={size => { setPageSize(size); setPageNum(1); }} disabled={loading} />
          </ListPageFooter>

        {/* ====== 添加/编辑模型弹窗 ====== */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] rounded-[32px]">
            <DialogHeader>
              <DialogTitle>{editingId ? '编辑模型配置' : '配置新模型资源'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <fieldset className="space-y-2 rounded-xl border bg-muted/20 p-3">
                <legend className="px-1 text-xs font-medium">模型类别 *</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categoryOptions.map(({ code, label }) => (
                    <Button key={code} type="button" variant={form.category === code ? 'secondary' : 'outline'}
                      aria-pressed={form.category === code}
                      className={cn('justify-start', form.category === code && 'border border-primary text-primary')}
                      onClick={() => setForm({ ...form, category: code, apiPath: MODEL_CATEGORY_DEFAULT_API_PATH[code], vendor: resolveVendorForCategory(code, form.vendor) })}>
                      <Cpu size={14} />{label}
                    </Button>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                  显示名称
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="用于界面展示，可选"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                  模型标识
                </Label>
                <Input
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="例如：Qwen/Qwen3-Embedding-8B"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                    Base URL
                  </Label>
                  <Input
                    value={form.baseUrl}
                    onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                    placeholder="https://dashscope.aliyuncs.com/compatible-mode"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                    API Path
                  </Label>
                  <Input
                    value={form.apiPath}
                    onChange={(e) => setForm({ ...form, apiPath: e.target.value })}
                    placeholder={MODEL_CATEGORY_DEFAULT_API_PATH[form.category]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Base URL 不包含接口路径；API Path 以 / 开头。已有完整 URL 会在编辑时自动拆分。</p>
                <p className="break-all rounded-lg border bg-muted/40 px-3 py-2 text-xs font-mono">
                  最终请求地址：{joinModelEndpoint(form.baseUrl, form.apiPath || MODEL_CATEGORY_DEFAULT_API_PATH[form.category]) || '—'}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                  描述
                </Label>
                <Textarea
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                  className="h-20 resize-none"
                  placeholder="简要描述模型用途"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                  认证 Token
                </Label>
                <Input
                  type="password"
                  value={form.authToken}
                  onChange={(e) => setForm({ ...form, authToken: e.target.value })}
                  placeholder={editingId ? '留空则保持原 Token' : 'sk-••••••••••••••••'}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                  扩展参数 (JSON)
                </Label>
                <Textarea
                  value={form.params}
                  onChange={(e) => setForm({ ...form, params: e.target.value })}
                  className="h-24 resize-none font-mono text-xs"
                  placeholder='{"temperature":0.7,"max_tokens":2048}'
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                    调用协议
                  </Label>
                  <Select
                    value={form.vendor}
                    onValueChange={(v) => setForm({ ...form, vendor: v as ModelVendor })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorsForCategory(form.category).map((vendor) => (
                        <SelectItem key={vendor} value={vendor}>{vendorLabel(vendor)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.category === 'embedding' && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                    向量维度
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.dimension}
                    onChange={(e) => setForm({ ...form, dimension: e.target.value })}
                    placeholder="例如：2560"
                  />
                  {editingId && <p className="text-xs text-amber-600 dark:text-amber-400">修改向量维度可能导致已入库向量不一致，请谨慎操作。</p>}
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.sendDimensions} onChange={(event) => setForm({ ...form, sendDimensions: event.target.checked })} className="accent-primary" />
                    发送 dimensions 参数
                  </label>
                  <p className="text-xs text-muted-foreground">默认开启。关闭后使用模型服务默认维度，返回向量仍须与上方配置维度一致；同时用于调试、知识库入库和检索。</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">状态</Label>
                  <Select value={String(form.status)} onValueChange={(v) => setForm({ ...form, status: Number(v) })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">开启</SelectItem>
                      <SelectItem value="1">关闭</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">默认模型</Label>
                  <Select value={String(form.isDefault)} onValueChange={(v) => setForm({ ...form, isDefault: Number(v) })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">否</SelectItem>
                      <SelectItem value="1">是</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 gap-4">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? '保存中...' : editingId ? '保存修改' : '立即添加'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ====== 调试弹窗 ====== */}
        <Dialog open={!!debugTarget} onOpenChange={(open) => !open && closeDebug()}>
          <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-4xl [&>[data-slot=dialog-body]]:gap-0 [&>[data-slot=dialog-body]]:overflow-hidden">
            <DialogHeader className="border-b px-6 py-5">
              <DialogTitle className="flex items-center gap-2"><Zap size={18} className="text-primary" />模型连通性调试</DialogTitle>
              <DialogDescription>{debugTarget?.name || debugTarget?.model} · {debugTarget && modelCategoryLabel(resolveModelCategory(debugTarget))}</DialogDescription>
            </DialogHeader>

            <div className="grid min-h-0 grid-cols-1 overflow-y-auto md:h-[520px] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:overflow-hidden">
              <div className="space-y-4 border-b p-6 md:overflow-y-auto md:border-r md:border-b-0">
                <h3 className="text-sm font-semibold">测试参数</h3>
              {debugTarget && (resolveModelCategory(debugTarget) === 'llm' || resolveModelCategory(debugTarget) === 'multimodal') && <div className="space-y-2"><Label>Prompt · 支持流式输出</Label><Textarea aria-label="Prompt" value={debugPrompt} onChange={(event) => setDebugPrompt(event.target.value)} /></div>}
              {debugTarget && resolveModelCategory(debugTarget) === 'embedding' && <div className="space-y-2"><Label>测试文本 (text)</Label><Textarea aria-label="测试文本" value={debugText} onChange={(event) => setDebugText(event.target.value)} /></div>}
              {debugTarget && resolveModelCategory(debugTarget) === 'rerank' && <div className="space-y-2"><Label>Query</Label><Input aria-label="Query" value={debugQuery} onChange={(event) => setDebugQuery(event.target.value)} /><Label>Documents</Label>{debugDocuments.map((item, index) => <Input key={index} aria-label={`Document ${index + 1}`} value={item} onChange={(event) => setDebugDocuments((previous) => previous.map((value, position) => position === index ? event.target.value : value))} />)}</div>}
              {debugTarget && resolveModelCategory(debugTarget) === 'ocr' && <div className="space-y-2"><Label>上传图片 (Base64)</Label><Input aria-label="上传图片" type="file" accept="image/*" onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) { setDebugImageBase64(''); return; }
                const reader = new FileReader();
                reader.onload = () => setDebugImageBase64(String(reader.result).split(',')[1] || '');
                reader.readAsDataURL(file);
              }} />{debugImageBase64 && <p className="text-xs text-muted-foreground">已加载图片数据</p>}</div>}
              {debugTarget && resolveModelCategory(debugTarget) === 'parser' && <p className="text-sm text-muted-foreground">文档解析模型将执行连通性探测，无需额外参数。</p>}

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                  超时 (秒)
                </Label>
                <Input
                  type="number"
                  min={5}
                  max={120}
                  value={debugTimeout}
                  onChange={(e) => setDebugTimeout(Number(e.target.value) || 30)}
                />
              </div>

                <Button onClick={runDebug} disabled={debugLoading} className="w-full"><Zap size={14} />{debugLoading ? '测试中...' : '开始测试'}</Button>
              </div>
              <div className="flex min-h-80 min-w-0 flex-col bg-slate-950 p-6 text-slate-200 md:min-h-0">
                <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-3 text-xs text-slate-400"><span>执行日志与响应</span>{debugResult && <span className={debugResult.success ? 'text-emerald-400' : 'text-rose-400'}>{debugResult.success ? 'SUCCESS' : 'FAILED'}</span>}</div>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto break-words [&_pre]:break-words [&_pre]:whitespace-pre-wrap">
                  {!debugLoading && !debugResult && !debugLogs.length && <p className="py-16 text-center text-xs text-slate-500">配置参数后点击「开始测试」</p>}
              {debugLogs.length > 0 && <div className="space-y-1 text-xs text-slate-400" aria-label="执行日志">{debugLogs.map((log, index) => <p key={index}>{log}</p>)}</div>}
              {debugStreamText && <div className="whitespace-pre-wrap rounded-lg border bg-slate-900 p-4 text-sm">{debugStreamText}</div>}
              {debugRawStreamEvents.length > 0 && <details open><summary>原始流式响应（{debugRawStreamEvents.length} 条）</summary><div className="max-h-48 overflow-auto">{debugRawStreamEvents.map((event, index) => <pre key={index} className="whitespace-pre-wrap break-all text-xs">#{index + 1} {event}</pre>)}</div></details>}
              {debugResult && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={debugResult.success ? 'success' : 'danger'}
                     
                    >
                      {debugResult.success ? '连通成功' : '连通失败'}
                    </Badge>
                    {debugResult.costMs != null && (
                      <span className="text-xs text-slate-400">{debugResult.costMs} ms</span>
                    )}
                    {debugResult.httpStatus != null && (
                      <span className="text-xs text-slate-400">HTTP {debugResult.httpStatus}</span>
                    )}
                  </div>
                  {debugResult.errorMessage && (
                    <p className="text-sm text-rose-400">{debugResult.errorMessage}</p>
                  )}
                  {debugResult.content && !debugStreamText && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm whitespace-pre-wrap">
                      {debugResult.content}
                    </div>
                  )}
                  {debugResult.reasoningContent && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-slate-400 font-bold text-xs uppercase tracking-widest">
                        推理内容
                      </summary>
                      <pre className="mt-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs overflow-x-auto whitespace-pre-wrap">
                        {debugResult.reasoningContent}
                      </pre>
                    </details>
                  )}
                  {debugResult.responseBody && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-slate-400 font-bold text-xs uppercase tracking-widest">
                        原始响应
                      </summary>
                      <pre className="mt-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs overflow-x-auto whitespace-pre-wrap max-h-48">
                        {debugResult.responseBody}
                      </pre>
                    </details>
                  )}
                </div>
              )}
                </div>
                <div className="mt-3 flex justify-between border-t border-slate-800 pt-3 text-xs text-slate-400"><span>延迟：{debugResult?.costMs != null ? `${debugResult.costMs} ms` : '—'}</span><span>{debugLoading ? '连接中...' : debugResult?.success ? '调用成功' : debugResult ? '调用失败' : '待命'}</span></div>
              </div>
            </div>
            <DialogFooter className="border-t bg-muted/20 px-6 py-4"><Button variant="outline" onClick={closeDebug}>关闭</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ====== 删除确认弹窗 ====== */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
              <DialogDescription>
                删除后引用该模型的智能体可能无法调用，是否继续？
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 p-3 rounded-md bg-destructive/10">
              <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">此操作不可撤销，数据将被永久删除。</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
              <Button variant="destructive" onClick={confirmDelete}>确认删除</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </ListPageLayout>
  );
}
