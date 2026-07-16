import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Activity,
  Cpu,
  Clock,
  MoreVertical,
  Pencil,
  Zap,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { AgentOpenModel, ModelDebugResult, ModelType, ModelVendor } from './types';
import {
  debugModel,
  deleteModel,
  getModel,
  queryModels,
  saveModel,
  updateModel,
} from './modelApi';
import {
  formatParamsForEdit,
  isModelActive,
  maskAuthToken,
  modelTypeLabel,
  validateParamsJson,
  validateUrl,
  vendorLabel,
} from './utils';

// ====== 表单状态 ======

type FormState = {
  model: string;
  url: string;
  type: ModelType;
  vendor: ModelVendor;
  status: number;
  authToken: string;
  remark: string;
  params: string;
};

const emptyForm = (): FormState => ({
  model: '',
  url: '',
  type: 'llm',
  vendor: 'openai',
  status: 0,
  authToken: '',
  remark: '',
  params: '',
});

// ====== 页面区间大小 ======

const PAGE_SIZE = 12;

// ====== 组件 ======

export default function ModelManagement() {
  const [models, setModels] = useState<AgentOpenModel[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [appliedQuery, setAppliedQuery] = useState({ model: '', type: '', status: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const [debugTarget, setDebugTarget] = useState<AgentOpenModel | null>(null);
  const [debugPrompt, setDebugPrompt] = useState('你好，请简短回复 OK');
  const [debugTimeout, setDebugTimeout] = useState(30);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugResult, setDebugResult] = useState<ModelDebugResult | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await queryModels({
        pageNum,
        pageSize: PAGE_SIZE,
        model: appliedQuery.model || undefined,
        type: (appliedQuery.type as ModelType) || undefined,
        status: appliedQuery.status === '' ? undefined : Number(appliedQuery.status),
      });
      setModels(page?.records || []);
      setTotal(page?.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
      setModels([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [pageNum, appliedQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEdit = async (item: AgentOpenModel) => {
    try {
      const detail = await getModel(item.id);
      const data = detail || item;
      setEditingId(data.id);
      setForm({
        model: data.model || '',
        url: data.url || '',
        type: data.type || 'llm',
        vendor: data.vendor || 'openai',
        status: data.status ?? 0,
        authToken: data.authToken || '',
        remark: data.remark || '',
        params: formatParamsForEdit(data.params),
      });
      setIsModalOpen(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : '获取详情失败');
    }
  };

  const handleSave = async () => {
    if (!form.model.trim()) {
      alert('模型名称不能为空');
      return;
    }
    const urlErr = validateUrl(form.url);
    if (urlErr) {
      alert(urlErr);
      return;
    }
    const paramsErr = validateParamsJson(form.params);
    if (paramsErr) {
      alert(paramsErr);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        model: form.model.trim(),
        url: form.url.trim(),
        type: form.type,
        vendor: form.vendor,
        status: form.status,
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
      alert(e instanceof Error ? e.message : '保存失败');
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
        url: data.url,
        type: data.type || 'llm',
        vendor: data.vendor || 'openai',
        status: nextStatus,
        remark: data.remark,
        params: data.params,
        authToken: data.authToken,
      });
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : '状态更新失败');
    }
  };

  const handleDelete = async (item: AgentOpenModel) => {
    if (!window.confirm('删除后引用该模型的智能体可能无法调用，是否继续？')) return;
    try {
      await deleteModel(item.id);
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : '删除失败');
    }
  };

  const openDebug = async (item: AgentOpenModel) => {
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

  const runDebug = async () => {
    if (!debugTarget) return;
    setDebugLoading(true);
    setDebugResult(null);
    try {
      const result = await debugModel({
        id: debugTarget.id,
        prompt: debugPrompt,
        timeoutSeconds: debugTimeout,
      });
      setDebugResult(result);
    } catch (e) {
      setDebugResult({
        success: false,
        errorMessage: e instanceof Error ? e.message : '调试请求失败',
      });
    } finally {
      setDebugLoading(false);
    }
  };

  const handleSearch = () => {
    setAppliedQuery({
      model: searchInput.trim(),
      type: filterType,
      status: filterStatus,
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
    <div className="h-full overflow-y-auto">
      <div className="space-y-8 pb-10">
        {/* ====== 头部 ====== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                <SelectItem value="llm">大语言模型</SelectItem>
                <SelectItem value="multimodal">多模态</SelectItem>
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

        {/* ====== 错误提示 ====== */}
        {error && (
          <div className="text-sm text-destructive px-4 py-2 bg-destructive/10 rounded-xl">{error}</div>
        )}

        {/* ====== 模型卡片网格 ====== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
          {loading && (
            <div className="absolute inset-0 z-10 bg-background/40 rounded-2xl pointer-events-none" />
          )}
          {models.map((model) => {
            const active = isModelActive(model.status);
            return (
              <Card
                key={model.id}
                className="overflow-hidden border-line bg-surface p-0 transition-shadow hover:shadow-md"
              >
                {/* 状态条 */}
                <div className={cn('h-1.5 w-full', active ? 'bg-emerald-500' : 'bg-muted')} />

                <CardContent className="p-6">
                  {/* 顶部：图标 + 操作菜单 + 开关 */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-muted/50 border border-line/40 text-primary">
                      <Cpu size={24} />
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="text-fg-muted">
                            <MoreVertical size={18} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem onClick={() => openEdit(model)}>
                            <Pencil size={14} />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDebug(model)}>
                            <Zap size={14} />
                            调试
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(model)}
                            className="text-destructive"
                          >
                            <Trash2 size={14} />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Switch
                        checked={active}
                        onCheckedChange={() => toggleStatus(model)}
                      />
                    </div>
                  </div>

                  {/* 模型名称 + 厂商信息 */}
                  <div className="mb-6">
                    <h3
                      className="text-lg font-bold text-fg mb-1 truncate"
                      title={model.model}
                    >
                      {model.model}
                    </h3>
                    <p className="text-xs text-fg-muted font-bold uppercase tracking-widest truncate">
                      {vendorLabel(model.vendor)} · {modelTypeLabel(model.type)}
                    </p>
                  </div>

                  {/* 描述 */}
                  <div className="mb-4 h-10">
                    <p className="text-xs text-fg-muted line-clamp-2 leading-relaxed">
                      {model.remark || '暂无描述'}
                    </p>
                  </div>

                  {/* URL */}
                  <p className="text-[10px] text-fg-muted truncate mb-4" title={model.url}>
                    {model.url || '-'}
                  </p>

                  {/* Token */}
                  {model.authToken && (
                    <p className="text-[10px] text-fg-muted mb-4 font-mono">
                      Token: {maskAuthToken(model.authToken)}
                    </p>
                  )}

                  {/* 底部状态栏 */}
                  <div className="flex items-center justify-between pt-4 border-t border-line">
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
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ====== 空状态 ====== */}
        {!loading && !models.length && (
          <div className="text-center py-16 text-fg-muted text-sm">暂无模型配置</div>
        )}

        {/* ====== 分页 ====== */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pageNum <= 1}
              onClick={() => setPageNum((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={18} />
            </Button>
            <span className="text-sm text-fg-muted">
              第 {pageNum} / {totalPages} 页，共 {total} 条
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pageNum >= totalPages}
              onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        )}

        {/* ====== 添加/编辑模型弹窗 ====== */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px]">
            <DialogHeader>
              <DialogTitle>{editingId ? '编辑模型配置' : '配置新模型资源'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                  模型名称
                </label>
                <Input
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="例如: Qwen/Qwen2.5-7B-Instruct"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                  调用地址
                </label>
                <Input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://api.siliconflow.cn/v1/chat/completions"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                  描述
                </label>
                <Textarea
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                  className="h-20 resize-none"
                  placeholder="简要描述模型用途"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                  认证 Token
                </label>
                <Input
                  type="password"
                  value={form.authToken}
                  onChange={(e) => setForm({ ...form, authToken: e.target.value })}
                  placeholder={editingId ? '留空则保持原 Token' : 'sk-••••••••••••••••'}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                  扩展参数 (JSON)
                </label>
                <Textarea
                  value={form.params}
                  onChange={(e) => setForm({ ...form, params: e.target.value })}
                  className="h-24 resize-none font-mono text-xs"
                  placeholder='{"temperature":0.7,"max_tokens":2048}'
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                    模型类型
                  </label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v as ModelType })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llm">大语言模型</SelectItem>
                      <SelectItem value="multimodal">多模态</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                    厂商协议
                  </label>
                  <Select
                    value={form.vendor}
                    onValueChange={(v) => setForm({ ...form, vendor: v as ModelVendor })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI 兼容</SelectItem>
                      <SelectItem value="dify">Dify</SelectItem>
                      <SelectItem value="ollama">Ollama</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                  状态
                </label>
                <Select
                  value={String(form.status)}
                  onValueChange={(v) => setForm({ ...form, status: Number(v) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">开启</SelectItem>
                    <SelectItem value="1">关闭</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
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
            </div>
          </DialogContent>
        </Dialog>

        {/* ====== 调试弹窗 ====== */}
        <Dialog open={!!debugTarget} onOpenChange={(open) => !open && setDebugTarget(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>连通性调试 · {debugTarget?.model}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                  测试提示词
                </label>
                <Textarea
                  value={debugPrompt}
                  onChange={(e) => setDebugPrompt(e.target.value)}
                  className="h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-fg-muted uppercase tracking-widest pl-1">
                  超时 (秒)
                </label>
                <Input
                  type="number"
                  min={5}
                  max={120}
                  value={debugTimeout}
                  onChange={(e) => setDebugTimeout(Number(e.target.value) || 30)}
                />
              </div>

              {debugResult && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={debugResult.success ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {debugResult.success ? '连通成功' : '连通失败'}
                    </Badge>
                    {debugResult.costMs != null && (
                      <span className="text-xs text-fg-muted">{debugResult.costMs} ms</span>
                    )}
                    {debugResult.httpStatus != null && (
                      <span className="text-xs text-fg-muted">HTTP {debugResult.httpStatus}</span>
                    )}
                  </div>
                  {debugResult.errorMessage && (
                    <p className="text-sm text-destructive">{debugResult.errorMessage}</p>
                  )}
                  {debugResult.content && (
                    <div className="p-4 rounded-xl bg-muted/30 border border-line text-sm whitespace-pre-wrap">
                      {debugResult.content}
                    </div>
                  )}
                  {debugResult.reasoningContent && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-fg-muted font-bold text-xs uppercase tracking-widest">
                        推理内容
                      </summary>
                      <pre className="mt-2 p-3 rounded-xl bg-muted/30 border border-line text-xs overflow-x-auto whitespace-pre-wrap">
                        {debugResult.reasoningContent}
                      </pre>
                    </details>
                  )}
                  {debugResult.responseBody && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-fg-muted font-bold text-xs uppercase tracking-widest">
                        原始响应
                      </summary>
                      <pre className="mt-2 p-3 rounded-xl bg-muted/30 border border-line text-xs overflow-x-auto whitespace-pre-wrap max-h-48">
                        {debugResult.responseBody}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => setDebugTarget(null)}
                className="flex-1"
              >
                关闭
              </Button>
              <Button onClick={runDebug} disabled={debugLoading} className="flex-1">
                {debugLoading ? '测试中...' : '开始测试'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
