/**
 * KnowledgeBasePage — 知识库管理
 */

import React, { useState, useEffect } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Database,
  ChevronRight,
  FileText,
  Plus,
  Search,
  Layers,
  Check,
  Trash2,
  Settings2,
  Eye,
  Download,
  Info,
  AlertCircle,
  Play,
  RefreshCw,
  X,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { DataTable } from '@/components/ui/data-table';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AddFileModal } from './components/AddFileModal';
import { ChunksModal } from './components/ChunksModal';
import { DocPreviewModal } from './components/DocPreviewModal';
import { DocumentMetadataModal } from './components/DocumentMetadataModal';
import { ChunkMediaPreview } from './components/ChunkMediaPreview';
import type { KBFile } from './data/kbMock';
import {
  deleteDataset,
  deleteDocument,
  downloadDocument,
  getDataset,
  getDatasetStats,
  getDocument,
  getDocumentProgress,
  listEnabledModels,
  parseDocument,
  queryDatasets,
  queryDocumentChunks,
  queryDocuments,
  searchKnowledgeBase,
  saveDataset,
  setDocumentAvailability,
  stopDocumentParse,
  uploadDocumentsBatch,
} from './api';
import { knowledgeBaseKeys } from './hooks/queryKeys';
import type { DatasetListItem, DocumentProgress, KnowledgeDataset, RetrievalChunk } from './types';

const CHUNK_STRATEGY_OPTIONS: Array<{ value: NonNullable<KnowledgeDataset['chunkStrategy']>; label: string }> = [
  { value: 'naive', label: '通用分块（默认）' },
  { value: 'one', label: '整篇一块' },
  { value: 'table', label: '表格每行一块' },
  { value: 'qa', label: '问答对拆分' },
  { value: 'book', label: '书籍标题层级' },
  { value: 'manual', label: '手册（PDF sec_id）' },
  { value: 'laws', label: '法律条文' },
  { value: 'paper', label: '论文结构（仅 PDF）' },
  { value: 'presentation', label: '每页一块' },
  { value: 'picture', label: '图片/视频' },
  { value: 'email', label: '邮件' },
  { value: 'tag', label: 'content+tags 每行' },
];

function RetrievalHighlight({ html, fallback }: { html?: string | null; fallback: string }) {
  if (!html?.trim()) return <>{fallback}</>;
  let highlighted = false;
  return (
    <>
      {html.split(/(<\/?em\b[^>]*>)/gi).map((part, index) => {
        if (/^<em\b/i.test(part)) {
          highlighted = true;
          return null;
        }
        if (/^<\/em/i.test(part)) {
          highlighted = false;
          return null;
        }
        const text = part.replace(/<[^>]+>/g, '');
        return highlighted ? (
          <mark key={index} className="rounded bg-primary/15 px-1 font-bold text-primary">
            {text}
          </mark>
        ) : <React.Fragment key={index}>{text}</React.Fragment>;
      })}
    </>
  );
}

/* ─── 主页面 ─── */
export function KnowledgeBasePage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selKb, setSelKb] = useState<DatasetListItem | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createParserType, setCreateParserType] = useState<KnowledgeDataset['parserType']>('native');
  const [createChunkStrategy, setCreateChunkStrategy] = useState<KnowledgeDataset['chunkStrategy']>('naive');
  const [createChunkSize, setCreateChunkSize] = useState(512);
  const [createChunkOverlap, setCreateChunkOverlap] = useState(64);
  const [deleteTarget, setDeleteTarget] = useState<DatasetListItem | null>(null);

  const datasetParams = { page, size: 12, name: appliedSearch };
  const datasetsQuery = useQuery({
    queryKey: knowledgeBaseKeys.datasetList(datasetParams),
    queryFn: () => queryDatasets(datasetParams),
  });

  const saveMutation = useMutation({
    mutationFn: saveDataset,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.datasets() });
      setCreateOpen(false);
      setCreateName('');
      setCreateDescription('');
      setCreateParserType('native');
      setCreateChunkStrategy('naive');
      setCreateChunkSize(512);
      setCreateChunkOverlap(64);
      toast.success('知识库创建成功');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '知识库创建失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDataset,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.datasets() });
      setDeleteTarget(null);
      toast.success('知识库删除成功');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '知识库删除失败'),
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setAppliedSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className="flex-1 flex min-w-0 flex-col">
        {view === 'detail' && selKb ? (
          <DetailView
            kb={selKb}
            kbId={selKb.id}
            onBack={() => setView('list')}
            onDatasetSaved={(dataset) => {
              setSelKb((current) => current ? { ...current, ...dataset } : current);
              void queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.datasets() });
            }}
          />
        ) : (
          <ListView
            kbs={datasetsQuery.data?.records ?? []}
            total={datasetsQuery.data?.total ?? 0}
            page={page}
            pageSize={12}
            search={searchInput}
            loading={datasetsQuery.isLoading}
            error={datasetsQuery.error}
            onSearch={setSearchInput}
            onPageChange={setPage}
            onOpen={(kb) => {
              setSelKb(kb);
              setView('detail');
            }}
            onCreate={() => setCreateOpen(true)}
            onEdit={(kb) => {
              setSelKb(kb);
              setView('detail');
            }}
            onDelete={setDeleteTarget}
          />
        )}
      </main>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">确认删除知识库</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground leading-relaxed">
            删除知识库{' '}
            <span className="text-destructive bg-destructive/10 px-1.5 py-0.5 rounded font-bold">
              “{deleteTarget?.name}”
            </span>{' '}
            后，其文档与分块数据也会被移除，此操作无法撤销。
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? '删除中...' : '确认删除'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新建知识库 */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>配置知识库资源</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                知识库名称
              </Label>
              <Input
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="例如: 某区域技术规范文档库"
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">解析方式</Label>
                <Select value={createParserType} onValueChange={(value) => setCreateParserType(value as KnowledgeDataset['parserType'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="native">本地解析</SelectItem>
                    <SelectItem value="ocr">OCR 增强</SelectItem>
                    <SelectItem value="remote">远程解析</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">分块策略</Label>
                <Select value={createChunkStrategy} onValueChange={(value) => setCreateChunkStrategy(value as KnowledgeDataset['chunkStrategy'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHUNK_STRATEGY_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">分块长度</Label>
                <Input type="number" min={1} value={createChunkSize} onChange={(event) => setCreateChunkSize(Number(event.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">重叠长度</Label>
                <Input type="number" min={0} value={createChunkOverlap} onChange={(event) => setCreateChunkOverlap(Number(event.target.value))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">简介说明</Label>
              <Textarea
                value={createDescription}
                onChange={(event) => setCreateDescription(event.target.value)}
                placeholder="描述知识库的收录范围与用途"
                className="min-h-24 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setCreateOpen(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="flex-1"
              disabled={!createName.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate({
                name: createName.trim(),
                description: createDescription.trim() || undefined,
                status: 'ACTIVE',
                parserType: createParserType,
                chunkStrategy: createChunkStrategy,
                chunkSize: createChunkSize,
                chunkOverlap: createChunkOverlap,
              })}
            >
              {saveMutation.isPending ? '创建中...' : '立即创建'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── 列表视图 ─── */
function ListView({
  kbs,
  total,
  page,
  pageSize,
  search,
  loading,
  error,
  onSearch,
  onPageChange,
  onOpen,
  onCreate,
  onEdit,
  onDelete,
}: {
  kbs: DatasetListItem[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  loading: boolean;
  error: Error | null;
  onSearch: (value: string) => void;
  onPageChange: (page: number) => void;
  onOpen: (kb: DatasetListItem) => void;
  onCreate: () => void;
  onEdit: (kb: DatasetListItem) => void;
  onDelete: (kb: DatasetListItem) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return (
    <>
      <header className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h1 className="text-xl font-bold text-foreground tracking-tight">知识库列表</h1>
            <Badge variant="secondary" className="text-2xs font-bold uppercase tracking-widest">
              ALL
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground ml-[18px]">
            平台的知识底座，负责企业知识资产的统一管理和共享。
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="搜索库名称..."
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              className="pl-9 w-56 h-9 bg-background border-border rounded-xl text-xs"
            />
          </div>
          <Button size="sm" className="text-xs gap-1.5 rounded-xl shadow-sm" onClick={onCreate}>
            <Plus size={15} /> 新建知识库
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        {loading && <div className="py-20 text-center text-sm text-muted-foreground">正在加载知识库...</div>}
        {error && (
          <div className="py-20 text-center text-sm text-destructive">
            {error.message || '加载知识库失败'}
          </div>
        )}
        {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {kbs.map((kb) => (
            <div
              key={kb.id}
              className="bg-card/60 border border-border/60 rounded-2xl p-6 hover:shadow-md hover:border-primary/30 transition-all flex flex-col relative group"
            >
              <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground"
                  onClick={() => onEdit(kb)}
                  title="编辑知识库"
                >
                  <Settings2 size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(kb)}
                  title="删除知识库"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/10 mb-5">
                <Database size={20} />
              </div>
              <div className="flex-1 mb-6">
                <h4 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {kb.name}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {kb.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-y-3 py-4 border-t border-border/40">
                <div className="space-y-0.5">
                  <p className="text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider">
                    创建人
                  </p>
                  <p className="text-xs font-bold text-foreground">{kb.creator || '—'}</p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider">
                    创建日期
                  </p>
                  <p className="text-xs font-bold text-foreground">{kb.createTime || '—'}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-border/20 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText size={13} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">向量库索引</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpen(kb)}
                  className="text-xs font-bold text-primary gap-1 h-auto p-0"
                >
                  详情配置 <ChevronRight size={13} />
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="ghost"
            onClick={onCreate}
            className="w-full border border-dashed border-border/60 rounded-2xl flex-col items-center justify-center p-10 text-muted-foreground hover:text-primary hover:border-primary/30 bg-muted/10 min-h-[220px] gap-0 h-auto"
          >
            <div className="w-12 h-12 rounded-2xl border border-dashed border-border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-primary/30 transition-all bg-background shadow-sm">
              <Plus size={22} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-center leading-relaxed">
              创建数据知识库
              <br />
              <span className="text-2xs font-normal opacity-60">（节点：根目录）</span>
            </span>
          </Button>
        </div>
        )}
        {!loading && !error && total === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">暂无知识库</div>
        )}
        {!loading && !error && total > 0 && (
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">共 {total} 个知识库，第 {page}/{pageCount} 页</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>上一页</Button>
              <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>下一页</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── 详情 ─── */
function DetailView({
  kb,
  kbId,
  onBack,
  onDatasetSaved,
}: {
  kb: DatasetListItem;
  kbId: string;
  onBack: () => void;
  onDatasetSaved: (dataset: KnowledgeDataset) => void;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'files' | 'search' | 'config'>('files');
  const detailQuery = useQuery({
    queryKey: knowledgeBaseKeys.datasetDetail(kbId),
    queryFn: () => getDataset(kbId),
  });
  const statsQuery = useQuery({
    queryKey: knowledgeBaseKeys.datasetStats(kbId),
    queryFn: () => getDatasetStats(kbId),
  });
  const currentKb: DatasetListItem = {
    ...kb,
    ...detailQuery.data,
    documentCount: statsQuery.data?.documentCount ?? kb.documentCount,
    chunkCount: statsQuery.data?.chunkCount ?? kb.chunkCount,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex h-full gap-6"
    >
      <aside className="w-64 shrink-0 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-border">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-xl uppercase">
            {currentKb.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold truncate text-foreground">{currentKb.name}</h4>
            <p className="text-2xs text-muted-foreground mt-0.5">{currentKb.documentCount ?? 0} 个文件 · {currentKb.chunkCount ?? 0} 个分块</p>
            <p className="text-2xs text-muted-foreground mt-0.5">创建于 {currentKb.createTime}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {(
            [
              ['files', '文件列表', FileText],
              ['search', '检索测试', Search],
              ['config', '配置', Settings2],
            ] as const
          ).map(([id, label, Icon]) => (
            <Button
              key={id}
              variant="ghost"
              size="sm"
              onClick={() => setTab(id as typeof tab)}
              className={cn(
                'w-full justify-start gap-3 rounded-2xl text-xs font-bold',
                tab === id
                  ? 'bg-primary/10 text-primary hover:bg-primary/15'
                  : 'text-muted-foreground'
              )}
            >
              <Icon size={18} /> {label}
            </Button>
          ))}
        </nav>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="justify-start text-muted-foreground text-xs font-bold mt-auto gap-2"
        >
          <ChevronRight size={16} className="rotate-180" /> 返回列表
        </Button>
      </aside>
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {tab === 'files' && (
          <FileTab kbId={kbId} parserType={currentKb.parserType} />
        )}
        {tab === 'search' && <SearchTab kbId={kbId} />}
        {tab === 'config' && <ConfigTab kb={currentKb} onSaved={(dataset) => {
          queryClient.setQueryData(knowledgeBaseKeys.datasetDetail(kbId), dataset);
          void queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.datasetStats(kbId) });
          onDatasetSaved(dataset);
        }} />}
      </div>
    </motion.div>
  );
}

/* ─── 文件表格 ─── */
function getDocumentTypeBadge(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() || 'file';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return { label: extension === 'csv' ? 'CSV' : 'XLS', className: 'bg-emerald-50 text-emerald-600' };
  if (['doc', 'docx'].includes(extension)) return { label: 'DOC', className: 'bg-blue-50 text-blue-600' };
  if (extension === 'pdf') return { label: 'PDF', className: 'bg-red-50 text-destructive' };
  if (['ppt', 'pptx'].includes(extension)) return { label: 'PPT', className: 'bg-orange-50 text-orange-600' };
  if (['txt', 'md'].includes(extension)) return { label: extension.toUpperCase(), className: 'bg-slate-100 text-slate-600' };
  return { label: extension.slice(0, 4).toUpperCase(), className: 'bg-muted text-muted-foreground' };
}

function getParserLabel(parserType?: KnowledgeDataset['parserType']) {
  if (parserType === 'ocr') return 'OCR';
  if (parserType === 'remote') return 'Remote';
  return 'General';
}

function getDocumentStageLabel(status?: string) {
  const labels: Record<string, string> = {
    NEW: '新建',
    UPLOADED: '已上传',
    PARSING: '解析中',
    PARSED: '结构解析完成',
    CHUNKING: '分块中',
    EMBEDDING: '向量化中',
    INDEXING: '索引中',
    READY: '已完成',
    FAILED: '解析失败',
    CANCELLED: '已取消',
  };
  return status ? labels[status] ?? status : '解析中';
}

function FileTab({ kbId, parserType }: { kbId: string; parserType?: KnowledgeDataset['parserType'] }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actFile, setActFile] = useState<KBFile | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [chunksOpen, setChunksOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState<KBFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number; fileName: string } | null>(null);
  const [pendingParseIds, setPendingParseIds] = useState<Set<string>>(() => new Set());
  const [submittingParseIds, setSubmittingParseIds] = useState<Set<string>>(() => new Set());
  const notifiedFailedParseIds = React.useRef<Set<string>>(new Set());
  const chunkCountAttempts = React.useRef<Map<string, number>>(new Map());
  const documentParams = { keyword: search.trim(), page, size: 20 };
  const documentsQuery = useQuery({
    queryKey: knowledgeBaseKeys.documentList(kbId, documentParams),
    queryFn: () => queryDocuments(kbId, documentParams),
  });
  const documents = documentsQuery.data?.records ?? [];
  const readyWithoutChunks = documents.filter((document) => document.status === 'READY' && !(document.chunkCount && document.chunkCount > 0));
  const chunkCountQueries = useQueries({
    queries: readyWithoutChunks.map((document) => ({
      queryKey: [...knowledgeBaseKeys.documentDetail(document.id), 'resolved-chunk-count'],
      queryFn: async () => {
        chunkCountAttempts.current.set(document.id, (chunkCountAttempts.current.get(document.id) ?? 0) + 1);
        const detail = await getDocument(document.id).catch(() => null);
        if ((detail?.chunkCount ?? 0) > 0) return { documentId: document.id, count: detail!.chunkCount! };
        const chunks = await queryDocumentChunks(document.id, 1, 1);
        return { documentId: document.id, count: chunks.total ?? 0 };
      },
      refetchInterval: (query: { state: { data?: { count: number } } }) => (
        (query.state.data?.count ?? 0) <= 0 && (chunkCountAttempts.current.get(document.id) ?? 0) < 5 ? 3000 : false
      ),
    })),
  });
  const resolvedChunkCounts = new Map(chunkCountQueries.flatMap((query) => query.data ? [[query.data.documentId, query.data.count] as const] : []));
  const activeDocuments = documents.filter((document) =>
    ['PARSING', 'PARSED', 'CHUNKING', 'EMBEDDING', 'INDEXING'].includes(document.status)
    || (pendingParseIds.has(document.id) && !submittingParseIds.has(document.id)),
  );
  const progressQueries = useQueries({
    queries: activeDocuments.map((document) => ({
      queryKey: knowledgeBaseKeys.documentProgress(document.id),
      queryFn: () => getDocumentProgress(document.id),
      refetchInterval: (query: { state: { data?: DocumentProgress } }) => {
        const progress = query.state.data;
        if (progress?.errorMessage || progress?.taskError || (progress && ['READY', 'FAILED', 'CANCELLED'].includes(progress.status))) return false;
        return 3000;
      },
    })),
  });
  const progressByDocumentId = new Map(progressQueries.flatMap((query) => query.data ? [[query.data.documentId, query.data] as const] : []));
  const progressSignature = progressQueries
    .map((query) => query.data ? `${query.data.documentId}:${query.data.status}:${query.data.retryCount ?? 0}` : 'pending')
    .join('|');
  useEffect(() => {
    progressQueries.forEach((query) => {
      const progress = query.data;
      const errorMessage = progress?.errorMessage ?? progress?.taskError;
      const activeWithError = Boolean(
        progress
        && errorMessage
        && ['PARSING', 'PARSED', 'CHUNKING', 'EMBEDDING', 'INDEXING'].includes(progress.status),
      );
      const failed = Boolean(progress && (activeWithError || ['FAILED', 'CANCELLED'].includes(progress.status)));
      if (!progress || !failed || notifiedFailedParseIds.current.has(progress.documentId)) return;
      notifiedFailedParseIds.current.add(progress.documentId);
      toast.error(`文件解析失败：${errorMessage || progress.progressMessage || '后台任务执行失败'}`);
    });
    const hasFinished = progressQueries.some((query) => query.data && ['READY', 'FAILED', 'CANCELLED'].includes(query.data.status));
    if (hasFinished) void queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.documents(kbId) });
    const acceptedIds = progressQueries
      .map((query) => query.data)
      .filter((progress): progress is DocumentProgress => Boolean(
        progress && pendingParseIds.has(progress.documentId) && progress.status !== 'UPLOADED'
      ))
      .map((progress) => progress.documentId);
    if (acceptedIds.length) {
      setPendingParseIds((current) => {
        const next = new Set(current);
        acceptedIds.forEach((id) => next.delete(id));
        return next.size === current.size ? current : next;
      });
    }
  // progressSignature ensures one refresh per backend state transition instead of once per render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kbId, progressSignature, queryClient]);
  const files: KBFile[] = documents.map((document) => ({
    ...(() => {
      const progress = progressByDocumentId.get(document.id);
      const reportedStatus = progress?.status ?? document.status;
      const reportedError = progress?.errorMessage ?? progress?.taskError ?? document.errorMessage;
      const status = ['PARSING', 'PARSED', 'CHUNKING', 'EMBEDDING', 'INDEXING'].includes(reportedStatus)
        && Boolean(reportedError)
        ? 'FAILED'
        : reportedStatus;
      const errorMessage = ['FAILED', 'CANCELLED'].includes(status)
        ? reportedError
        : null;
      const isPending = pendingParseIds.has(document.id) && status === 'UPLOADED';
      return {
        progress: isPending ? 10 : progress?.progressPercent ?? document.progressPercent ?? (status === 'READY' ? 100 : 0),
        status: status === 'UPLOADED' && !isPending ? 'waiting' as const : status === 'READY' ? 'success' as const : ['FAILED', 'CANCELLED'].includes(status) ? 'failed' as const : 'parsing' as const,
        rawStatus: status,
        errorMessage,
        progressMessage: progress?.progressMessage ?? document.progressMessage,
        taskStatus: progress?.taskStatus,
        retryCount: progress?.retryCount,
      };
    })(),
    id: document.id,
    name: document.fileName,
    uploadDate: document.createTime ?? '-',
    enabled: document.searchEnabled ?? true,
    chunks: resolvedChunkCounts.get(document.id) ?? document.chunkCount ?? 0,
    metadataFields: 0,
    parser: getParserLabel(parserType),
  }));
  const refreshDocuments = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.documents(kbId) }),
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.datasetDetail(kbId) }),
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.datasetStats(kbId) }),
    ]);
  };
  const uploadMutation = useMutation({
    mutationFn: (selectedFiles: File[]) => uploadDocumentsBatch(kbId, selectedFiles, (done, total, fileName) => setUploadProgress({ done, total, fileName })),
    onSuccess: async ({ succeeded, failed }) => {
      await refreshDocuments();
      setUploadProgress(null);
      setAddOpen(false);
      if (failed.length) toast.warning(`上传完成：成功 ${succeeded.length} 个，失败 ${failed.length} 个`);
      else toast.success(`成功上传 ${succeeded.length} 个文件`);
    },
    onError: (error) => { setUploadProgress(null); toast.error(error instanceof Error ? error.message : '文件上传失败'); },
  });
  const availabilityMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => setDocumentAvailability([id], enabled),
    onSuccess: refreshDocuments,
    onError: (error) => toast.error(error instanceof Error ? error.message : '更新检索状态失败'),
  });
  const removeMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(deleteDocument)),
    onSuccess: async () => {
      const count = deleteTargets.length;
      setDeleteTargets([]);
      await refreshDocuments();
      toast.success(count > 1 ? `成功批量删除 ${count} 个文件` : '文件已移除');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '文件删除失败'),
    meta: { silentError: true },
  });
  const parseMutation = useMutation({
    mutationFn: ({ id, active, force }: { id: string; active: boolean; force: boolean }) => active ? stopDocumentParse(id) : parseDocument(id, force),
    onMutate: ({ id, active }) => {
      if (!active) {
        notifiedFailedParseIds.current.delete(id);
        setPendingParseIds((current) => new Set(current).add(id));
        setSubmittingParseIds((current) => new Set(current).add(id));
      }
    },
    onSuccess: async (result, variables) => {
      if (variables.active) {
        setPendingParseIds((current) => { const next = new Set(current); next.delete(variables.id); return next; });
        toast.success('已请求停止解析');
      } else if (!result?.skipped && !result?.taskIds?.length) {
        setPendingParseIds((current) => { const next = new Set(current); next.delete(variables.id); return next; });
        toast.error('解析接口未返回任务 ID，后台任务可能没有成功创建');
      } else {
        toast.success(variables.force ? '已重新触发解析' : '已启动解析');
      }
      if (!variables.active) {
        queryClient.removeQueries({ queryKey: knowledgeBaseKeys.documentProgress(variables.id) });
      }
      await refreshDocuments();
    },
    onError: (error, variables) => {
      setPendingParseIds((current) => { const next = new Set(current); next.delete(variables.id); return next; });
      toast.error(error instanceof Error ? error.message : '解析操作失败');
    },
    onSettled: (_result, _error, variables) => {
      setSubmittingParseIds((current) => {
        const next = new Set(current);
        next.delete(variables.id);
        return next;
      });
    },
  });

  const handleBatchParse = async (targets: KBFile[]) => {
    const targetIds = targets.map((file) => file.id);
    targetIds.forEach((id) => {
      notifiedFailedParseIds.current.delete(id);
      queryClient.removeQueries({ queryKey: knowledgeBaseKeys.documentProgress(id) });
    });
    setPendingParseIds((current) => new Set([...current, ...targetIds]));
    setSubmittingParseIds((current) => new Set([...current, ...targetIds]));

    const settled = await Promise.allSettled(
      targets.map(async (file) => {
        const force = ['FAILED', 'CANCELLED'].includes(file.rawStatus ?? '');
        const result = await parseDocument(file.id, force);
        if (!result?.skipped && !result?.taskIds?.length) {
          throw new Error(`文件「${file.name}」未返回解析任务 ID`);
        }
        return { id: file.id, skipped: Boolean(result?.skipped) };
      }),
    );

    const failedIds = settled.flatMap((result, index) => result.status === 'rejected' ? [targetIds[index]] : []);
    const skippedIds = settled.flatMap((result) => result.status === 'fulfilled' && result.value.skipped ? [result.value.id] : []);
    setPendingParseIds((current) => {
      const next = new Set(current);
      [...failedIds, ...skippedIds].forEach((id) => next.delete(id));
      return next;
    });
    setSubmittingParseIds((current) => {
      const next = new Set(current);
      targetIds.forEach((id) => next.delete(id));
      return next;
    });
    await refreshDocuments();

    const succeededCount = settled.length - failedIds.length;
    if (failedIds.length === 0) {
      toast.success(`已批量提交 ${succeededCount} 个文件解析`);
    } else {
      toast.warning(`批量解析提交完成：成功 ${succeededCount} 个，失败 ${failedIds.length} 个`);
    }
  };

  const columns = React.useMemo(
    () =>
      [
        {
          id: 'name',
          header: '名称',
          size: 280,
          cell: ({ row }) => {
            const badge = getDocumentTypeBadge(row.original.name);
            return (
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={cn(
                  'w-8 h-8 rounded flex items-center justify-center font-bold text-2xs shrink-0',
                  badge.className
                )}
              >
                {badge.label}
              </div>
              <span className="min-w-0 truncate text-xs font-semibold text-foreground" title={row.original.name}>
                <button type="button" className="max-w-full truncate text-left hover:text-primary" onClick={() => { setActFile(row.original); setPreviewOpen(true); }}>
                  {row.original.name}
                </button>
              </span>
            </div>
          );
          },
        },
        {
          id: 'chunks',
          header: '分块数',
          size: 64,
          cell: ({ row }) => (
            <button
              type="button"
              className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground hover:text-primary"
              title="查看分块内容"
              onClick={() => {
                setActFile(row.original);
                setChunksOpen(true);
              }}
            >
              <Layers size={11} />
              {row.original.chunks}
            </button>
          ),
        },
        {
          id: 'enabled',
          header: '检索',
          size: 64,
          cell: ({ row }) => (
            <Switch
              checked={row.original.enabled}
              disabled={availabilityMutation.isPending}
              onCheckedChange={(enabled) => availabilityMutation.mutate({ id: row.original.id, enabled })}
              className="data-[state=checked]:bg-success"
            />
          ),
        },
        {
          id: 'metadata',
          header: '元数据',
          size: 82,
          cell: ({ row }) => (
            <span className="text-xs text-muted-foreground">
              {row.original.metadataFields} fields
            </span>
          ),
        },
        {
          id: 'parser',
          header: '解析器',
          size: 78,
          cell: ({ row }) => (
            <span className="text-xs text-foreground font-bold">{row.original.parser}</span>
          ),
        },
        {
          id: 'progress',
          header: '解析',
          size: 170,
          cell: ({ row }) => (
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2">
              {row.original.status === 'parsing' ? (
                <>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="min-w-0 flex-1 truncate text-2xs text-muted-foreground" title={row.original.progressMessage ?? undefined}>
                        {getDocumentStageLabel(row.original.rawStatus)}{row.original.progressMessage ? `：${row.original.progressMessage}` : ''}
                      </span>
                      {row.original.taskStatus === 'PENDING' && <span className="shrink-0 text-2xs text-warning">排队中</span>}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        title="停止解析"
                        disabled={parseMutation.isPending}
                        onClick={() => parseMutation.mutate({ id: row.original.id, active: true, force: false })}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={row.original.progress}
                        className="flex-1 h-1.5 bg-muted [&>div]:bg-success [&>div]:animate-pulse"
                      />
                      <span className="text-2xs font-bold text-success font-mono">
                        {row.original.progress.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </>
              ) : row.original.status === 'waiting' ? (
                <div className="flex items-center gap-1">
                  <span className="text-2xs font-medium text-muted-foreground">已上传，等待解析</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    title="继续解析"
                    disabled={parseMutation.isPending}
                    onClick={() => parseMutation.mutate({ id: row.original.id, active: false, force: false })}
                  >
                    <RefreshCw size={12} />
                  </Button>
                </div>
              ) : row.original.status === 'success' ? (
                <span className="text-2xs font-bold text-success flex items-center gap-1">
                  <Check size={10} /> 完成
                </span>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-2xs font-bold text-destructive">
                    {getDocumentStageLabel(row.original.rawStatus)}
                    {(row.original.retryCount ?? 0) > 0 ? ` · 已重试 ${row.original.retryCount} 次` : ''}
                  </span>
                  <Button variant="ghost" size="icon-xs" title="重新解析" disabled={parseMutation.isPending} onClick={() => parseMutation.mutate({ id: row.original.id, active: false, force: true })}>
                    <RefreshCw size={12} />
                  </Button>
                </div>
              )}
              </div>
              {row.original.status === 'failed' && row.original.errorMessage && (
                <span
                  className="flex min-w-0 items-start gap-1 text-2xs leading-4 text-destructive"
                  title={row.original.errorMessage}
                >
                  <AlertCircle size={11} className="mt-0.5 shrink-0" />
                  <span className="min-w-0 truncate">{row.original.errorMessage}</span>
                </span>
              )}
            </div>
          ),
        },
        {
          id: 'uploadDate',
          header: '上传日期',
          size: 145,
          cell: ({ row }) => (
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {row.original.uploadDate}
            </span>
          ),
        },
        {
          id: 'actions',
          header: '操作',
          size: 140,
          cell: ({ row }) => (
            <div className="inline-flex gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                title="原文预览"
                onClick={() => {
                  setActFile(row.original);
                  setPreviewOpen(true);
                }}
              >
                <Eye size={13} />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                title="元数据"
                onClick={() => {
                  setActFile(row.original);
                  setMetadataOpen(true);
                }}
              >
                <Info size={13} />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                title="下载"
                onClick={() => void downloadDocument(row.original.id, row.original.name).catch((error) => toast.error(error instanceof Error ? error.message : '下载失败'))}
              >
                <Download size={13} />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                title="移除"
                disabled={removeMutation.isPending}
                onClick={() => setDeleteTargets([row.original])}
                className="hover:text-destructive"
              >
                <Trash2 size={13} />
              </Button>
            </div>
          ),
        },
      ] as ColumnDef<KBFile>[],
    [availabilityMutation, handleBatchParse, parseMutation, removeMutation, submittingParseIds]
  );

  return (
    <>
      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="px-8 py-4 h-16 flex items-center justify-between border-b border-border shrink-0">
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {/*<span className="px-4 py-1.5 bg-background rounded-lg text-xs font-bold shadow-sm">*/}
            {/*  文件*/}
            {/*</span>*/}
            {/*<span className="px-4 py-1.5 text-muted-foreground text-xs font-bold">知识库</span>*/}
          </div>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="text"
                placeholder="搜索文件名..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 h-9 bg-muted border-border rounded-lg text-xs w-48"
              />
            </div>
            <Button size="sm" className="text-xs rounded-lg" onClick={() => setAddOpen(true)}>
              添加文件
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-2">
          <DataTable
            columns={columns}
            data={files}
            className="max-w-full overflow-hidden [&_[data-slot=table-container]]:overflow-x-hidden"
            selectable
            showPagination={false}
            showViewOptions={false}
            toolbar={(table) => {
              const selected = table.getFilteredSelectedRowModel().rows;
              if (selected.length === 0) return null;
              const parseTargets = selected.filter((row) => ['NEW', 'UPLOADED', 'FAILED', 'CANCELLED'].includes(row.original.rawStatus ?? ''));
              const stopTargets = selected.filter((row) => ['PARSING', 'PARSED', 'CHUNKING', 'EMBEDDING', 'INDEXING'].includes(row.original.rawStatus ?? ''));
              return (
                <div className="flex w-full items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-6 py-3 text-xs font-bold text-primary">
                  <div className="flex items-center gap-2">
                    <Layers size={14} />
                    <span>已勾选 {selected.length} 个文件</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="xs" disabled={parseTargets.length === 0 || parseMutation.isPending || submittingParseIds.size > 0} onClick={() => void handleBatchParse(parseTargets.map((row) => row.original)).then(() => table.resetRowSelection()).catch((error) => toast.error(error instanceof Error ? error.message : '批量解析失败'))}>
                      批量解析{parseTargets.length > 0 ? ` (${parseTargets.length})` : ''}
                    </Button>
                    <Button variant="outline" size="xs" disabled={stopTargets.length === 0} onClick={() => void Promise.all(stopTargets.map((row) => stopDocumentParse(row.original.id))).then(refreshDocuments).then(() => toast.success(`已批量关闭 ${stopTargets.length} 个文件的解析`)).catch((error) => toast.error(error instanceof Error ? error.message : '批量关闭失败'))}>
                      批量关闭{stopTargets.length > 0 ? ` (${stopTargets.length})` : ''}
                    </Button>
                    <Button variant="destructive" size="xs" onClick={() => {
                      setDeleteTargets(selected.map((row) => row.original));
                    }}>
                      批量删除
                    </Button>
                  </div>
                </div>
              );
            }}
          />
          {files.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
              <FileText size={48} className="opacity-30 mb-3" />
              <p className="text-sm font-bold">{documentsQuery.isLoading ? '正在加载文件...' : documentsQuery.isError ? '文件加载失败' : '暂无匹配文件'}</p>
            </div>
          )}
        </div>
        <div className="px-8 py-4 bg-muted/30 border-t border-border flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-muted-foreground">
            页面显示 {files.length} 项（共 {documentsQuery.data?.total ?? 0} 个）
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="xs" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>上一页</Button>
            <Button variant="outline" size="xs" disabled={page * 20 >= (documentsQuery.data?.total ?? 0)} onClick={() => setPage((value) => value + 1)}>下一页</Button>
          </div>
        </div>
      </div>
      <AddFileModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        submitting={uploadMutation.isPending}
        progress={uploadProgress}
        onConfirm={(selectedFiles) => uploadMutation.mutate(selectedFiles)}
      />
      <ChunksModal open={chunksOpen} file={actFile} datasetId={kbId} onClose={() => setChunksOpen(false)} />
      <DocPreviewModal open={previewOpen} file={actFile} datasetId={kbId} onClose={() => setPreviewOpen(false)} />
      <DocumentMetadataModal open={metadataOpen} file={actFile} onClose={() => setMetadataOpen(false)} />
      <Dialog open={deleteTargets.length > 0} onOpenChange={(open) => !open && setDeleteTargets([])}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{deleteTargets.length > 1 ? '批量删除文档' : '删除文档'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-6 text-muted-foreground">
            {deleteTargets.length > 1
              ? `确定删除选中的 ${deleteTargets.length} 个文档吗？`
              : `确定删除文档「${deleteTargets[0]?.name ?? ''}」吗？`}
            删除后将级联清理对应分块与索引，此操作无法撤销。
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" disabled={removeMutation.isPending} onClick={() => setDeleteTargets([])}>取消</Button>
            <Button
              variant="destructive"
              disabled={removeMutation.isPending}
              onClick={() => removeMutation.mutate(deleteTargets.map((file) => file.id))}
            >
              {removeMutation.isPending ? '删除中...' : '确认删除'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── 检索测试 ─── */
function SearchTab({ kbId }: { kbId: string }) {
  const [query, setQuery] = useState('高处作业的反违章管理和安全带佩戴标准是什么？');
  const [threshold, setThreshold] = useState(0.2);
  const [weight, setWeight] = useState(0.3);
  const [rerankEnabled, setRerankEnabled] = useState(true);
  const [rerank, setRerank] = useState('');
  const [kg, setKg] = useState(true);
  const [fusionMode, setFusionMode] = useState<'rrf' | 'weighted'>('rrf');
  const [topK, setTopK] = useState(10);
  const [resultSize, setResultSize] = useState(10);
  const [searching, setSearching] = useState(false);
  const [ran, setRan] = useState(false);
  const [results, setResults] = useState<RetrievalChunk[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(0);
  const rerankModelsQuery = useQuery({
    queryKey: knowledgeBaseKeys.modelOptions('rerank'),
    queryFn: () => listEnabledModels('rerank'),
  });
  const rerankModels = rerankModelsQuery.data ?? [];

  useEffect(() => {
    if (!rerank && rerankModels.length) setRerank(rerankModels[0].id);
  }, [rerank, rerankModels]);

  const doSearch = async () => {
    if (!query.trim()) {
      toast.error('请输入检索问题');
      return;
    }
    setSearching(true);
    const startedAt = performance.now();
    try {
      const response = await searchKnowledgeBase({
        question: query.trim(),
        dataset_ids: [kbId],
        page: 1,
        page_size: resultSize,
        top_k: topK,
        similarity_threshold: threshold,
        vector_similarity_weight: kg && fusionMode === 'weighted' ? weight : undefined,
        keyword: kg,
        hybrid_enabled: kg,
        highlight: true,
        rerank_enabled: rerankEnabled && Boolean(rerank),
        rerank_id: rerankEnabled && rerank ? rerank : undefined,
      });
      setResults(response.chunks ?? []);
      setTotal(response.total ?? response.chunks?.length ?? 0);
      setRan(true);
      toast.success(`检索完成，命中 ${response.total ?? response.chunks?.length ?? 0} 条结果`);
    } catch (error) {
      setResults([]);
      setTotal(0);
      setRan(true);
      toast.error(error instanceof Error ? error.message : '检索失败');
    } finally {
      setElapsed(Math.round(performance.now() - startedAt));
      setSearching(false);
    }
  };

  const presets = [
    ['🔔 反违章: 高处作业安全带扣罚标准', '高处临边作业，不系挂安全带怎么扣罚的'],
    [
      '🔥 锅炉应急: 壁温超温580度停机指令',
      '锅炉受热面金属壁温逼近临界580℃时，值长如何切断燃料紧急停机？',
    ],
    ['⚡ 汽轮机: 润滑油低压连锁直流事故泵', '汽轮机滑油系统油压降至0.07MPa底线以下，泵怎么启动？'],
  ];

  return (
    <div className="flex-1 bg-card border border-border rounded-2xl p-8 flex flex-col overflow-hidden">
      <header className="mb-6 shrink-0">
        <h2 className="text-lg font-bold tracking-tight text-foreground">知识检索调试</h2>
        <p className="text-xs text-muted-foreground mt-1">用于对知识库内容进行检索与验证。</p>
      </header>
      <div className="flex-1 grid grid-cols-5 gap-6 overflow-hidden">
        <div className="col-span-2 space-y-5 bg-muted/30 p-5 rounded-2xl border border-border overflow-y-auto flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal size={14} className="text-primary" /> 测试超参数参数
          </h3>
          <div className="space-y-4 flex-1">
            <div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-muted-foreground">相似度最低阈值</span>
                <span className="px-2 py-0.5 bg-background border border-border rounded text-2xs font-bold font-mono">
                  {threshold}
                </span>
              </div>
              <Slider
                value={[threshold]}
                onValueChange={([v]) => setThreshold(v)}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-2xs font-bold text-muted-foreground">候选数量 TopK</Label>
                <Input type="number" min={1} max={200} value={topK} onChange={(event) => setTopK(Math.max(1, Number(event.target.value) || 1))} className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-2xs font-bold text-muted-foreground">返回数量</Label>
                <Input type="number" min={1} max={100} value={resultSize} onChange={(event) => setResultSize(Math.max(1, Number(event.target.value) || 1))} className="mt-1 h-9" />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border py-1">
              <Label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest">混合检索</Label>
              <Switch checked={kg} onCheckedChange={setKg} />
            </div>
            {kg && <div>
              <Label className="mb-1.5 block text-2xs font-bold text-muted-foreground uppercase tracking-widest">融合方式</Label>
              <Select value={fusionMode} onValueChange={(value) => setFusionMode(value as 'rrf' | 'weighted')}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="rrf">RRF 融合</SelectItem><SelectItem value="weighted">加权融合</SelectItem></SelectContent>
              </Select>
            </div>}
            {kg && fusionMode === 'weighted' && <div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-muted-foreground">向量相似度权重</span>
                <span className="px-2 py-0.5 bg-background border border-border rounded text-2xs font-bold font-mono">
                  {weight}
                </span>
              </div>
              <Slider
                value={[weight]}
                onValueChange={([v]) => setWeight(v)}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>}
            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between"><Label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest">Rerank 深度排序</Label><Switch checked={rerankEnabled} onCheckedChange={setRerankEnabled} /></div>
              {rerankEnabled && <Select value={rerank} onValueChange={setRerank} disabled={rerankModelsQuery.isLoading || rerankModels.length === 0}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rerankModels.map((model) => <SelectItem key={model.id} value={model.id}>{model.name || model.model || model.id}</SelectItem>)}
                </SelectContent>
              </Select>}
              {rerankEnabled && !rerankModelsQuery.isLoading && rerankModels.length === 0 && <p className="text-2xs text-warning">当前没有已启用的 Rerank 模型，将使用一阶段召回。</p>}
            </div>
            <div className="pt-2 border-t border-border space-y-1.5">
              <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider block">
                样例测试检索词
              </span>
              {presets.map(([label, q]) => (
                <Button
                  key={label}
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery(q)}
                  className="w-full justify-start px-2.5 text-xs font-medium text-foreground/70 hover:text-primary truncate rounded-lg"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-border shrink-0">
            <Button
              onClick={() => void doSearch()}
              disabled={searching}
              className="w-full gap-1.5 text-xs font-bold rounded-xl shadow-sm"
            >
              {searching ? (
                <>
                  <Clock size={14} className="animate-spin" /> 检索中...
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" /> 开始检索测试
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="col-span-3 border border-border rounded-2xl overflow-hidden flex flex-col bg-muted/10">
          <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              召回索引块列表
            </h3>
            {ran && !searching && (
              <span className="text-2xs font-mono px-2 py-0.5 bg-primary/10 text-primary rounded">
                {elapsed} ms · {total} 条
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {searching ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                <Clock size={32} className="animate-spin text-primary" />
                <span className="text-xs font-bold">正在检索并调用 Reranker 交叉修正评分...</span>
              </div>
            ) : !ran ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                <Search size={32} className="text-muted-foreground/30" />
                <span className="text-xs font-bold">暂无数据，请在左侧点击"开始检索测试"</span>
              </div>
            ) : results.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                <AlertCircle size={32} className="text-muted-foreground/30" />
                <span className="text-xs font-bold">未找到满足相似度最低阈值的结果</span>
              </div>
            ) : (
              results.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 bg-card border border-border rounded-2xl space-y-3 shadow-sm hover:border-primary/30 transition-all"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-2xs">
                        {item.page_start ? `第 ${item.page_start} 页` : `分块 ${idx + 1}`}
                      </Badge>
                      <span className="text-2xs text-muted-foreground">{item.document_keyword || item.document_id}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-success/10 text-success rounded text-xs font-bold font-mono shrink-0">
                      {item.similarity.toFixed(4)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-xs font-medium leading-relaxed text-foreground/80">
                    <RetrievalHighlight html={item.highlight} fallback={item.content} />
                  </p>
                  <ChunkMediaPreview assets={item.media_assets} imageId={item.image_id} />
                  <div className="flex items-center justify-between text-2xs text-muted-foreground border-t border-border/50 pt-2">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <span>字符数: <strong className="text-foreground">{item.content.length}</strong></span>
                      <span>类型: <strong className="text-foreground">{item.chunk_type ?? 'text'}</strong></span>
                      <span>向量分: <strong className="font-mono text-foreground">{typeof item.vector_similarity === 'number' ? item.vector_similarity.toFixed(4) : '—'}</strong></span>
                      <span>关键词分: <strong className="font-mono text-foreground">{typeof item.term_similarity === 'number' ? item.term_similarity.toFixed(4) : '—'}</strong></span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80 font-bold h-auto p-0 text-2xs"
                      onClick={() => void navigator.clipboard.writeText(item.content).then(() => toast.success('分块内容已复制'))}
                    >
                      复制分块
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 配置 ─── */
function ConfigTab({ kb, onSaved }: { kb: DatasetListItem; onSaved: (dataset: KnowledgeDataset) => void }) {
  const [form, setForm] = useState<Partial<KnowledgeDataset>>({ ...kb });
  useEffect(() => {
    setForm({ ...kb });
  }, [kb.id, kb.name, kb.description, kb.embeddingModel, kb.parserType, kb.chunkStrategy, kb.chunkSize, kb.chunkOverlap, kb.status]);
  const saveMutation = useMutation({
    mutationFn: saveDataset,
    onSuccess: (dataset) => {
      setForm({ ...dataset });
      onSaved(dataset);
      toast.success('知识库配置已保存');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '知识库配置保存失败'),
  });

  return (
    <div className="flex-1 bg-card border border-border rounded-2xl p-8 flex flex-col overflow-y-auto">
      <header className="mb-8 shrink-0">
        <h2 className="text-xl font-bold tracking-tight text-foreground">知识库配置</h2>
        <p className="text-xs text-muted-foreground mt-1">
          管理和调整知识库配置参数，包括嵌入模型、解析策略等。
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-muted/30 border border-border p-6 rounded-2xl space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <span className="w-1.5 h-4 bg-primary rounded-full" /> 基础属性配置
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block ml-1 mb-1.5">
                知识库名称
              </Label>
              <Input
                value={form.name ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="h-10 text-sm"
              />
            </div>
            <div>
              <Label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block ml-1 mb-1.5">
                简介说明
              </Label>
              <Textarea
                className="h-28 text-xs resize-none"
                value={form.description ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
              <div>
                <p className="text-xs font-bold text-foreground">允许检索</p>
                <p className="text-2xs text-muted-foreground">停用后不参与知识库召回</p>
              </div>
              <Switch
                checked={form.status !== 'DISABLED'}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, status: checked ? 'ACTIVE' : 'DISABLED' }))}
              />
            </div>
          </div>
        </div>
        <div className="bg-muted/30 border border-border p-6 rounded-2xl space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <span className="w-1.5 h-4 bg-purple-500 rounded-full" /> 算法与关联模型
          </h3>
          <div className="space-y-5">
            <div>
              <Label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
                嵌入向量模型
              </Label>
              <Input
                value={form.embeddingModel ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, embeddingModel: event.target.value }))}
                placeholder="例如：BAAI/bge-small-zh-v1.5"
                className="h-10 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">解析方式</Label>
                <Select
                  value={form.parserType ?? 'native'}
                  onValueChange={(value) => setForm((current) => ({ ...current, parserType: value as KnowledgeDataset['parserType'] }))}
                >
                  <SelectTrigger className="w-full h-10 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="native">本地解析</SelectItem>
                    <SelectItem value="ocr">OCR 增强</SelectItem>
                    <SelectItem value="remote">远程解析</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">分块策略</Label>
                <Select
                  value={form.chunkStrategy ?? 'naive'}
                  onValueChange={(value) => setForm((current) => ({ ...current, chunkStrategy: value as KnowledgeDataset['chunkStrategy'] }))}
                >
                  <SelectTrigger className="w-full h-10 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHUNK_STRATEGY_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">分块长度</Label>
                <Input type="number" min={1} value={form.chunkSize ?? 512} onChange={(event) => setForm((current) => ({ ...current, chunkSize: Number(event.target.value) }))} />
              </div>
              <div>
                <Label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">重叠长度</Label>
                <Input type="number" min={0} value={form.chunkOverlap ?? 50} onChange={(event) => setForm((current) => ({ ...current, chunkOverlap: Number(event.target.value) }))} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-6 mt-8 border-t border-border">
        <Button variant="outline" size="sm" className="text-xs rounded-xl" onClick={() => setForm({ ...kb })}>
          重置更改
        </Button>
        <Button
          size="sm"
          className="text-xs rounded-xl shadow-sm"
          disabled={!form.name?.trim() || saveMutation.isPending}
          onClick={() => saveMutation.mutate({ ...form, id: kb.id, name: form.name!.trim() })}
        >
          {saveMutation.isPending ? '保存中...' : '保存配置'}
        </Button>
      </div>
    </div>
  );
}
