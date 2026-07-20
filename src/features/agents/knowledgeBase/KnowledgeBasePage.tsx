/**
 * KnowledgeBasePage — 知识库管理
 */

import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Database,
  BookOpen,
  ChevronRight,
  FileText,
  Plus,
  Search,
  FolderIcon,
  Layers,
  Check,
  Trash2,
  Settings2,
  Edit2,
  Key,
  Eye,
  Download,
  AlertCircle,
  Play,
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
import { DataTable, createSelectColumn } from '@/components/ui/data-table';
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
import { EditFileModal } from './components/EditFileModal';
import { ChunksModal } from './components/ChunksModal';
import { DocPreviewModal } from './components/DocPreviewModal';
import {
  initialKnowledgeBases,
  type KnowledgeBaseItem,
  initialKbFiles,
  type KBFile,
  searchDatabase,
  type SearchResult,
  industryTree,
  type TreeItem,
} from './data/kbMock';

const flattenNodes = (nodes: TreeItem[]): TreeItem[] =>
  nodes.reduce(
    (acc, n) => acc.concat(n, n.children ? flattenNodes(n.children) : []),
    [] as TreeItem[]
  );

const addNode = (nodes: TreeItem[], parentId: string, newNode: TreeItem): TreeItem[] =>
  parentId === 'root'
    ? [...nodes, newNode]
    : nodes.map((n) =>
        n.id === parentId
          ? { ...n, children: [...(n.children || []), newNode] }
          : n.children
            ? { ...n, children: addNode(n.children, parentId, newNode) }
            : n
      );
const editNode = (nodes: TreeItem[], id: string, label: string): TreeItem[] =>
  nodes.map((n) =>
    n.id === id
      ? { ...n, label }
      : n.children
        ? { ...n, children: editNode(n.children, id, label) }
        : n
  );
const delNode = (nodes: TreeItem[], id: string): TreeItem[] =>
  nodes
    .filter((n) => n.id !== id)
    .map((n) => (n.children ? { ...n, children: delNode(n.children, id) } : n));

/* ─── 树节点渲染 ─── */
function TreeItems({
  items,
  sel,
  exp,
  onSel,
  onToggle,
  onEdit,
  onDel,
}: {
  items: TreeItem[];
  sel: string;
  exp: string[];
  onSel: (id: string) => void;
  onToggle: React.Dispatch<React.SetStateAction<string[]>>;
  onEdit: (id: string, label: string) => void;
  onDel: (id: string, label: string) => void;
}) {
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = exp.includes(item.id);
        const isSelected = sel === item.id;
        return (
          <li key={item.id} className="space-y-1">
            <div
              className={cn(
                'flex items-center justify-between gap-1 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all group/node',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground/70 hover:bg-accent'
              )}
            >
              <div
                className="flex items-center gap-2 truncate flex-1 min-w-0"
                onClick={() => {
                  onSel(item.id);
                  if (hasChildren)
                    onToggle((p) =>
                      p.includes(item.id) ? p.filter((x) => x !== item.id) : [...p, item.id]
                    );
                }}
              >
                {hasChildren ? (
                  <ChevronRight
                    size={13}
                    className={cn('transition-transform shrink-0', isExpanded && 'rotate-90')}
                  />
                ) : (
                  <span className="w-3 shrink-0" />
                )}
                {hasChildren ? (
                  <FolderIcon size={14} className="shrink-0 text-amber-500" />
                ) : (
                  <FileText size={14} className="shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{item.label}</span>
              </div>
              <div
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'flex items-center gap-0.5 shrink-0 opacity-0 group-hover/node:opacity-100 transition-opacity',
                  isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                )}
              >
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onEdit(item.id, item.label)}
                  title="重命名"
                >
                  <Edit2 size={11} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDel(item.id, item.label)}
                  title="删除"
                  className="hover:text-destructive"
                >
                  <Trash2 size={11} />
                </Button>
              </div>
            </div>
            {hasChildren && isExpanded && (
              <div className="pl-4 border-l border-border ml-3.5 space-y-1">
                <TreeItems
                  items={item.children!}
                  sel={sel}
                  exp={exp}
                  onSel={onSel}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDel={onDel}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ─── 主页面 ─── */
export function KnowledgeBasePage() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selKb, setSelKb] = useState<KnowledgeBaseItem | null>(null);
  const [kbFiles, setKbFiles] = useState(initialKbFiles);
  const [selNode, setSelNode] = useState('1-1');
  const [expNodes, setExpNodes] = useState<string[]>(['1', '2', '3']);
  const [treeData, setTreeData] = useState<TreeItem[]>(industryTree);
  // modals
  const [catModal, setCatModal] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    id: string | null;
    label: string;
    parentId: string;
  }>({ open: false, mode: 'add', id: null, label: '', parentId: 'root' });
  const [delTarget, setDelTarget] = useState<{ id: string; label: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  /* ─── 解析进度模拟 ─── */
  useEffect(() => {
    const timer = setInterval(() => {
      setKbFiles((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach((kbId) => {
          next[kbId] = next[kbId].map((f) => {
            if (f.status === 'parsing' && f.progress < 100) {
              changed = true;
              const inc = Math.min(100, +(f.progress + Math.random() * 15 + 8).toFixed(2));
              return {
                ...f,
                progress: inc,
                status: inc >= 100 ? ('success' as const) : ('parsing' as const),
                chunks: inc >= 100 ? f.chunks + Math.floor(Math.random() * 3 + 1) : f.chunks,
              };
            }
            return f;
          });
        });
        return changed ? next : prev;
      });
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={cn('flex h-full min-h-0 gap-8 overflow-hidden', view === 'detail' && 'gap-0')}>
      {/* 侧栏 — 详情时隐藏 */}
      {view === 'list' && (
        <aside className="w-64 shrink-0 flex flex-col bg-card/60 border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 px-1.5 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <BookOpen size={16} />
            </div>
            <h4 className="text-sm font-bold text-foreground">业务分类树</h4>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            <TreeItems
              items={treeData}
              sel={selNode}
              exp={expNodes}
              onSel={setSelNode}
              onToggle={setExpNodes}
              onEdit={(id, label) =>
                setCatModal({ open: true, mode: 'edit', id, label, parentId: 'root' })
              }
              onDel={(id, label) => setDelTarget({ id, label })}
            />
          </div>
          <div className="pt-4 mt-4 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setCatModal({ open: true, mode: 'add', id: null, label: '', parentId: selNode })
              }
              className="w-full justify-center gap-1.5 text-xs font-bold"
            >
              <Plus size={13} /> 新增目录节点
            </Button>
          </div>
        </aside>
      )}

      <main className={view === 'detail' ? 'flex-1' : 'flex-1 flex flex-col min-w-0'}>
        {view === 'detail' && selKb ? (
          <DetailView
            kb={selKb}
            files={kbFiles[selKb.id] || []}
            kbId={selKb.id}
            onBack={() => setView('list')}
            onKbFilesChange={setKbFiles}
          />
        ) : (
          <ListView
            kbs={initialKnowledgeBases}
            onOpen={(kb) => {
              setSelKb(kb);
              setView('detail');
            }}
            onCreate={() => setCreateOpen(true)}
          />
        )}
      </main>

      {/* 分类新增/编辑 */}
      <CategoryDialog
        modal={catModal}
        onClose={() => setCatModal((p) => ({ ...p, open: false }))}
        onSave={(label, id) => {
          if (catModal.mode === 'add') {
            const n: TreeItem = { id: 'n' + Date.now(), label };
            setTreeData((p) => addNode(p, catModal.parentId, n));
            setExpNodes((p) => [...p, catModal.parentId]);
          } else if (id) setTreeData((p) => editNode(p, id, label));
          setCatModal((p) => ({ ...p, open: false }));
        }}
        flatNodes={flattenNodes(treeData)}
      />

      {/* 分类删除 */}
      <Dialog open={Boolean(delTarget)} onOpenChange={(o) => !o && setDelTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">确认删除分类节点</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground leading-relaxed">
            删除节点{' '}
            <span className="text-destructive bg-destructive/10 px-1.5 py-0.5 rounded font-bold">
              "{delTarget?.label}"
            </span>{' '}
            将一并删除所有下级子分类，无法撤销。
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setDelTarget(null)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => {
                if (delTarget) {
                  setTreeData((p) => delNode(p, delTarget.id));
                  setDelTarget(null);
                }
              }}
            >
              确认删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新建知识库 */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>配置知识库资源</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                知识库名称
              </label>
              <Input placeholder="例如: 某区域技术规范文档库" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                关联节点
              </label>
              <div className="px-4 py-2.5 bg-muted border border-border rounded-xl text-xs font-bold text-muted-foreground flex items-center gap-2">
                <FolderIcon size={14} />
                {selNode || '通用根节点'}
              </div>
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
            <Button size="sm" className="flex-1" onClick={() => setCreateOpen(false)}>
              立即创建
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
  onOpen,
  onCreate,
}: {
  kbs: KnowledgeBaseItem[];
  onOpen: (kb: KnowledgeBaseItem) => void;
  onCreate: () => void;
}) {
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
              className="pl-9 w-56 h-9 bg-background border-border rounded-xl text-xs"
            />
          </div>
          <Button size="sm" className="text-xs gap-1.5 rounded-xl shadow-sm" onClick={onCreate}>
            <Plus size={15} /> 新建知识库
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {kbs.map((kb) => (
            <div
              key={kb.id}
              className="bg-card/60 border border-border/60 rounded-2xl p-6 hover:shadow-md hover:border-primary/30 transition-all flex flex-col relative group"
            >
              <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon-xs" className="text-muted-foreground">
                  <Settings2 size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-destructive"
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
                  <p className="text-xs font-bold text-foreground">{kb.creator}</p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider">
                    创建日期
                  </p>
                  <p className="text-xs font-bold text-foreground">{kb.createTime}</p>
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
      </div>
    </>
  );
}

/* ─── 详情 ─── */
function DetailView({
  kb,
  files,
  kbId,
  onBack,
  onKbFilesChange,
}: {
  kb: KnowledgeBaseItem;
  files: KBFile[];
  kbId: string;
  onBack: () => void;
  onKbFilesChange: React.Dispatch<React.SetStateAction<Record<string, KBFile[]>>>;
}) {
  const [tab, setTab] = useState<'files' | 'search' | 'config'>('files');
  const [search, setSearch] = useState('');
  const filtered = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex h-full gap-6"
    >
      <aside className="w-64 shrink-0 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-border">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-xl uppercase">
            {kb.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold truncate text-foreground">{kb.name}</h4>
            <p className="text-2xs text-muted-foreground mt-0.5">{files.length} 个文件</p>
            <p className="text-2xs text-muted-foreground mt-0.5">创建于 {kb.createTime}</p>
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
          <FileTab
            files={filtered}
            all={files}
            kbId={kbId}
            search={search}
            onSearch={setSearch}
            onUpdate={onKbFilesChange}
          />
        )}
        {tab === 'search' && <SearchTab />}
        {tab === 'config' && <ConfigTab kb={kb} />}
      </div>
    </motion.div>
  );
}

/* ─── 文件表格 ─── */
function FileTab({
  files,
  all,
  kbId,
  search,
  onSearch,
  onUpdate,
}: {
  files: KBFile[];
  all: KBFile[];
  kbId: string;
  search: string;
  onSearch: (v: string) => void;
  onUpdate: React.Dispatch<React.SetStateAction<Record<string, KBFile[]>>>;
}) {
  const [actFile, setActFile] = useState<KBFile | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [chunksOpen, setChunksOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const columns = React.useMemo(
    () =>
      [
        createSelectColumn<KBFile>(),
        {
          id: 'name',
          header: '名称',
          cell: ({ row }) => (
            <div className="flex items-center gap-3 max-w-[210px]">
              <div
                className={cn(
                  'w-8 h-8 rounded flex items-center justify-center font-bold text-2xs shrink-0',
                  row.original.name.endsWith('.pdf')
                    ? 'bg-red-50 text-destructive'
                    : 'bg-blue-50 text-blue-600'
                )}
              >
                {row.original.name.endsWith('.pdf') ? 'PDF' : 'WORD'}
              </div>
              <span className="text-xs font-semibold text-foreground truncate">
                {row.original.name}
              </span>
            </div>
          ),
        },
        {
          id: 'uploadDate',
          header: '上传日期',
          cell: ({ row }) => (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {row.original.uploadDate}
            </span>
          ),
        },
        {
          id: 'enabled',
          header: '启用',
          cell: ({ row }) => (
            <Switch
              checked={row.original.enabled}
              onCheckedChange={() => {}}
              className="data-[state=checked]:bg-success"
            />
          ),
        },
        {
          id: 'chunks',
          header: '分块数',
          cell: ({ row }) => (
            <span className="text-xs text-foreground font-bold font-mono">
              {row.original.chunks}
            </span>
          ),
        },
        {
          id: 'metadata',
          header: '元数据',
          cell: ({ row }) => (
            <span className="text-xs text-muted-foreground">
              {row.original.metadataFields} fields
            </span>
          ),
        },
        {
          id: 'parser',
          header: '解析',
          cell: ({ row }) => (
            <span className="text-xs text-foreground font-bold">{row.original.parser}</span>
          ),
        },
        {
          id: 'progress',
          header: '解析进度',
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              {row.original.status === 'parsing' ? (
                <>
                  <Progress
                    value={row.original.progress}
                    className="flex-1 h-1.5 bg-muted [&>div]:bg-success [&>div]:animate-pulse"
                  />
                  <span className="text-2xs font-bold text-success font-mono">
                    {row.original.progress.toFixed(1)}%
                  </span>
                </>
              ) : row.original.status === 'success' ? (
                <span className="text-2xs font-bold text-success flex items-center gap-1">
                  <Check size={10} /> 完成
                </span>
              ) : (
                <span className="text-2xs font-bold text-destructive">解析挂起</span>
              )}
            </div>
          ),
        },
        {
          id: 'actions',
          header: '动作',
          cell: ({ row }) => (
            <div className="inline-flex gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                title="维护分块"
                onClick={() => {
                  setActFile(row.original);
                  setChunksOpen(true);
                }}
              >
                <Key size={13} />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                title="修改解析属性"
                onClick={() => {
                  setActFile(row.original);
                  setEditOpen(true);
                }}
              >
                <Edit2 size={13} />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                title="全文预览"
                onClick={() => {
                  setActFile(row.original);
                  setPreviewOpen(true);
                }}
              >
                <Eye size={13} />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                title="下载"
                onClick={() => toast.success(`正在下载 [${row.original.name}]`)}
              >
                <Download size={13} />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                title="移除"
                onClick={() => {
                  onUpdate((p) => ({
                    ...p,
                    [kbId]: (p[kbId] || []).filter((f) => f.id !== row.original.id),
                  }));
                  toast.success(`已移除文件 [${row.original.name}]`);
                }}
                className="hover:text-destructive"
              >
                <Trash2 size={13} />
              </Button>
            </div>
          ),
        },
      ] as ColumnDef<KBFile>[],
    [kbId, onUpdate]
  );

  return (
    <>
      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="px-8 py-4 h-16 flex items-center justify-between border-b border-border shrink-0">
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            <span className="px-4 py-1.5 bg-background rounded-lg text-xs font-bold shadow-sm">
              文件
            </span>
            <span className="px-4 py-1.5 text-muted-foreground text-xs font-bold">知识库</span>
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
                onChange={(e) => onSearch(e.target.value)}
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
            selectable
            showPagination={false}
            showViewOptions={false}
            toolbar={(table) => {
              const selected = table.getFilteredSelectedRowModel().rows;
              if (selected.length === 0) return null;
              return (
                <div className="mx-0 mb-4 px-6 py-3 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between text-xs font-bold text-primary">
                  <div className="flex items-center gap-2">
                    <Layers size={14} />
                    <span>已勾选 {selected.length} 个文件</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="xs">
                      批量启用
                    </Button>
                    <Button variant="destructive" size="xs">
                      批量移除
                    </Button>
                  </div>
                </div>
              );
            }}
          />
          {files.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
              <FileText size={48} className="opacity-30 mb-3" />
              <p className="text-sm font-bold">零匹配文件</p>
            </div>
          )}
        </div>
        <div className="px-8 py-4 bg-muted/30 border-t border-border flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-muted-foreground">
            页面显示 {files.length} 项 (总库 {all.length} 个)
          </span>
        </div>
      </div>
      <AddFileModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onConfirm={(name, parser, metaCount) =>
          onUpdate((prev) => {
            const newFile: KBFile = {
              id: 'f-' + Date.now(),
              name,
              uploadDate: new Date().toLocaleDateString(),
              enabled: true,
              chunks: 0,
              metadataFields: metaCount,
              parser,
              progress: 0.01,
              status: 'parsing',
            };
            return { ...prev, [kbId]: [newFile, ...(prev[kbId] || [])] };
          })
        }
      />
      <EditFileModal
        open={editOpen}
        file={actFile}
        onClose={() => setEditOpen(false)}
        onConfirm={(f) =>
          onUpdate((prev) => ({
            ...prev,
            [kbId]: (prev[kbId] || []).map((x) => (x.id === f.id ? f : x)),
          }))
        }
      />
      <ChunksModal open={chunksOpen} file={actFile} onClose={() => setChunksOpen(false)} />
      <DocPreviewModal open={previewOpen} file={actFile} onClose={() => setPreviewOpen(false)} />
    </>
  );
}

/* ─── 检索测试 ─── */
function SearchTab() {
  const [query, setQuery] = useState('高处作业的反违章管理和安全带佩戴标准是什么？');
  const [threshold, setThreshold] = useState(0.2);
  const [weight, setWeight] = useState(0.3);
  const [rerank, setRerank] = useState('BAAI/bge-reranker-v2-m3');
  const [kg, setKg] = useState(true);
  const [searching, setSearching] = useState(false);
  const [ran, setRan] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const doSearch = () => {
    if (!query.trim()) return;
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      setRan(true);
      setResults([...searchDatabase].sort((a, b) => b.similarity - a.similarity));
    }, 850);
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
            <div>
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
            </div>
            <div>
              <label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block">
                Rerank 深度排序模型
              </label>
              <Select value={rerank} onValueChange={setRerank}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAAI/bge-reranker-v2-m3">
                    BAAI/bge-reranker-v2-m3 (多语种)
                  </SelectItem>
                  <SelectItem value="Coherer-Rerank-3.5">Cohere Rerank v3.5 (长文本)</SelectItem>
                  <SelectItem value="No-Reranker">不开启（一阶段召回）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between py-1 border-t border-border">
              <label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest">
                知识图谱关联检索
              </label>
              <Switch checked={kg} onCheckedChange={setKg} />
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
              onClick={doSearch}
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
                {(Math.random() * 40 + 20).toFixed(0)} ms · {results.length} 条
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
                  key={idx}
                  className="p-4 bg-card border border-border rounded-2xl space-y-3 shadow-sm hover:border-primary/30 transition-all"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-2xs">
                        {item.location}
                      </Badge>
                      <span className="text-2xs text-muted-foreground">{item.docName}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-success/10 text-success rounded text-xs font-bold font-mono shrink-0">
                      {item.similarity}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                    {item.content}
                  </p>
                  <div className="flex items-center justify-between text-2xs text-muted-foreground border-t border-border/50 pt-2">
                    <span>
                      字符数: <strong className="text-foreground">{item.characterCount}</strong>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80 font-bold h-auto p-0 text-2xs"
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
function ConfigTab({ kb }: { kb: KnowledgeBaseItem }) {
  return (
    <div className="flex-1 bg-card border border-border rounded-2xl p-8 flex flex-col overflow-y-auto">
      <header className="mb-8 shrink-0">
        <h2 className="text-xl font-bold tracking-tight text-foreground">知识库配置</h2>
        <p className="text-xs text-muted-foreground mt-1">
          管理和调整知识库配置参数，包括嵌入模型、解析策略等。
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-muted/30 border border-border p-6 rounded-2xl space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <span className="w-1.5 h-4 bg-primary rounded-full" /> 基础属性配置
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 py-2">
              <div>
                <label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block ml-1 mb-1.5">
                  知识库头像
                </label>
                <div className="w-16 h-16 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 cursor-pointer bg-background shadow-sm">
                  <Plus size={18} />
                  <span className="text-[9px] mt-1 font-bold">上传</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground font-medium leading-relaxed">
                支持 JPG, PNG，建议 128x128 像素。
              </div>
            </div>
            <div>
              <label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block ml-1 mb-1.5">
                知识库名称
              </label>
              <Input defaultValue={kb.name} className="h-10 text-sm" />
            </div>
            <div>
              <label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block ml-1 mb-1.5">
                简介说明
              </label>
              <Textarea className="h-28 text-xs resize-none" defaultValue={kb.description} />
            </div>
          </div>
        </div>
        <div className="bg-muted/30 border border-border p-6 rounded-2xl space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <span className="w-1.5 h-4 bg-purple-500 rounded-full" /> 算法与关联模型
          </h3>
          <div className="space-y-5">
            <div>
              <label className="text-2xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
                嵌入向量模型
              </label>
              <Select defaultValue="bge-small">
                <SelectTrigger className="w-full h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bge-small">BAAI/bge-small-zh-v1.5 (默认)</SelectItem>
                  <SelectItem value="bge-large">BAAI/bge-large-zh-v1.5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-2xs font-bold text-muted-foreground uppercase tracking-widest">
                  相似度阈值
                </span>
                <span className="px-1.5 py-0.5 bg-background border border-border rounded text-2xs font-bold font-mono">
                  0.25
                </span>
              </div>
              <Slider defaultValue={[0.25]} min={0} max={1} step={0.05} className="w-full" />
              <p className="text-2xs text-muted-foreground mt-1">
                仅当匹配度大于此值才注入 Prompt。
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-6 mt-8 border-t border-border">
        <Button variant="outline" size="sm" className="text-xs rounded-xl">
          重置更改
        </Button>
        <Button size="sm" className="text-xs rounded-xl shadow-sm">
          保存配置
        </Button>
      </div>
    </div>
  );
}

/* ─── 分类 Dialog ─── */
function CategoryDialog({
  modal,
  onClose,
  onSave,
  flatNodes,
}: {
  modal: { open: boolean; mode: string; id: string | null; label: string; parentId: string };
  onClose: () => void;
  onSave: (label: string, id?: string | null) => void;
  flatNodes: TreeItem[];
}) {
  const [val, setVal] = useState(modal.label);
  const [pid, setPid] = useState(modal.parentId);
  return (
    <Dialog open={modal.open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {modal.mode === 'add' ? '新增业务分类节点' : '编辑业务分类节点'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block ml-1 mb-1.5">
              节点名称
            </label>
            <Input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="请输入节点名称"
              className="h-10"
            />
          </div>
          {modal.mode === 'add' && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block ml-1 mb-1.5">
                归属父节点
              </label>
              <Select value={pid} onValueChange={setPid}>
                <SelectTrigger className="w-full h-10 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {flatNodes.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="root">无（一级节点）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
              取消
            </Button>
            <Button size="sm" className="flex-1" onClick={() => onSave(val, modal.id)}>
              确认保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
