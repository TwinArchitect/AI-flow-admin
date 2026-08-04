import { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Tag,
  Undo2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MOCK_TAGS, PAGE_SIZE } from './data/tagMock';
import {
  AGENT_LABEL_CATEGORY_OPTIONS,
  agentLabelCategoryLabel,
  agentLabelStatusLabel,
  formatAgentLabelTime,
} from '@/types/agent';
import type { AgentLabel, AgentLabelCategory } from '@/types/agent';

type FilterStatus = 'all' | '1' | '0';
type FilterCategory = 'all' | AgentLabelCategory;

export function TagManagementPage() {
  const [tags, setTags] = useState<AgentLabel[]>(MOCK_TAGS);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTag, setEditTag] = useState<AgentLabel | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<AgentLabelCategory>('mine');
  const [formSort, setFormSort] = useState(0);
  const [formDesc, setFormDesc] = useState('');

  const filtered = tags.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      (t.description ?? '').toLowerCase().includes(appliedSearch.toLowerCase());
    const matchStatus = statusFilter === 'all' || String(t.status) === statusFilter;
    const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const stats = {
    total: tags.length,
    active: tags.filter((t) => t.status === 1).length,
    inactive: tags.filter((t) => t.status !== 1).length,
  };

  const openCreate = () => {
    setEditTag(null);
    setFormName('');
    setFormCategory('mine');
    setFormSort(0);
    setFormDesc('');
    setDialogOpen(true);
  };
  const openEdit = (tag: AgentLabel) => {
    setEditTag(tag);
    setFormName(tag.name);
    setFormCategory((tag.category as AgentLabelCategory) ?? 'mine');
    setFormSort(tag.sort ?? 0);
    setFormDesc(tag.description ?? '');
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast.error('标签名称不能为空');
      return;
    }
    if (editTag) {
      setTags((prev) =>
        prev.map((t) =>
          t.id === editTag.id
            ? {
                ...t,
                name: formName.trim(),
                description: formDesc.trim() || undefined,
                category: formCategory,
                sort: formSort,
              }
            : t
        )
      );
      toast.success(`更新标签「${formName}」成功`);
    } else {
      const newTag: AgentLabel = {
        id: 't-' + Date.now(),
        name: formName.trim(),
        description: formDesc.trim() || undefined,
        category: formCategory,
        sort: formSort,
        status: 0,
        createTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };
      setTags((prev) => [...prev, newTag]);
      toast.success(`新建标签「${formName}」成功`);
    }
    setDialogOpen(false);
  };

  const handleDelete = (tag: AgentLabel) => {
    setTags((prev) => prev.filter((t) => t.id !== tag.id));
    toast.success(`已删除标签「${tag.name}」`);
  };

  const handleToggleStatus = (tag: AgentLabel) => {
    const next = tag.status === 1 ? 0 : 1;
    setTags((prev) => prev.map((t) => (t.id === tag.id ? { ...t, status: next } : t)));
    toast.success(`标签「${tag.name}」已${next === 1 ? '开启' : '关闭'}`);
  };

  const resetFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };
  const hasFilters = appliedSearch || statusFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 mx-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <Tag className="text-primary" size={24} /> 标签维护
            </h1>
            <p className="text-xs text-muted-foreground mt-1">维护智能体分类标签</p>
          </div>
          <Button size="sm" className="text-xs gap-2 rounded-2xl shadow-sm" onClick={openCreate}>
            <Plus size={16} /> 新建标签
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: '标签总数',
              value: stats.total,
              icon: Tag,
              color: 'text-primary',
              bg: 'bg-primary/10',
            },
            {
              title: '已开启',
              value: stats.active,
              icon: CheckCircle2,
              color: 'text-success',
              bg: 'bg-success/10',
            },
            {
              title: '已关闭',
              value: stats.inactive,
              icon: X,
              color: 'text-muted-foreground',
              bg: 'bg-muted',
            },
          ].map((stat) => (
            <Card key={stat.title} className="p-0">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
                </div>
                <div
                  className={cn(
                    'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                    stat.bg,
                    stat.color
                  )}
                >
                  <stat.icon size={16} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 筛选栏 */}
        <div className="bg-muted/30 p-5 rounded-2xl border border-border space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-xl border border-border">
                <span className="text-xs text-muted-foreground font-bold whitespace-nowrap">
                  状态:
                </span>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v as FilterStatus);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="border-none bg-transparent h-auto p-0 text-xs font-bold shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部标签</SelectItem>
                    <SelectItem value="1">已开启</SelectItem>
                    <SelectItem value="0">已关闭</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-xl border border-border">
                <span className="text-xs text-muted-foreground font-bold whitespace-nowrap">
                  类别:
                </span>
                <Select
                  value={categoryFilter}
                  onValueChange={(v) => {
                    setCategoryFilter(v as FilterCategory);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="border-none bg-transparent h-auto p-0 text-xs font-bold shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类别</SelectItem>
                    {AGENT_LABEL_CATEGORY_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs gap-1 rounded-xl"
                >
                  <Undo2 size={13} /> 清除条件
                </Button>
              )}
            </div>
            <div className="relative w-full md:w-80 flex gap-2">
              <Input
                type="text"
                placeholder="搜索标签名称..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (setAppliedSearch(search.trim()), setPage(1))
                }
                className="pl-9 h-9 bg-background border-border rounded-2xl text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                className="text-xs rounded-2xl"
                onClick={() => {
                  setAppliedSearch(search.trim());
                  setPage(1);
                }}
              >
                搜索
              </Button>
            </div>
          </div>
        </div>

        {/* 表格 */}
        <Card className="rounded-2xl border-border overflow-hidden p-0">
          {paged.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      <TableHead className="px-6">名称</TableHead>
                      <TableHead className="px-4">描述</TableHead>
                      <TableHead className="px-4">类别</TableHead>
                      <TableHead className="px-4 text-center">排序</TableHead>
                      <TableHead className="px-4">创建时间</TableHead>
                      <TableHead className="px-4 text-center">状态</TableHead>
                      <TableHead className="px-6 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((tag) => (
                      <TableRow key={tag.id} className="group hover:bg-accent/40 text-xs">
                        <TableCell className="px-6">
                          <Badge
                            variant={tag.status === 1 ? 'default' : 'secondary'}
                            className={cn(
                              'text-xs font-bold',
                              tag.status !== 1 && 'text-muted-foreground'
                            )}
                          >
                            #{tag.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 text-muted-foreground max-w-[260px] truncate">
                          {tag.description || (
                            <span className="text-muted-foreground/40">（暂无描述）</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 text-muted-foreground">
                          {agentLabelCategoryLabel(tag.category)}
                        </TableCell>
                        <TableCell className="px-4 text-center font-mono text-muted-foreground">
                          {tag.sort ?? 0}
                        </TableCell>
                        <TableCell className="px-4 text-muted-foreground font-mono whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-muted-foreground/60" />
                            <span>{formatAgentLabelTime(tag.createTime)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span
                              className={cn(
                                'text-2xs font-bold',
                                tag.status === 1 ? 'text-primary' : 'text-muted-foreground'
                              )}
                            >
                              {agentLabelStatusLabel(tag.status)}
                            </span>
                            <Switch
                              checked={tag.status === 1}
                              onCheckedChange={() => handleToggleStatus(tag)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => openEdit(tag)}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Edit2 size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleDelete(tag)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="px-6 py-4 flex items-center justify-between border-t border-border">
                <span className="text-xs text-muted-foreground">
                  当前页 {paged.length} 条 / 共 {filtered.length} 个标签
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-xs"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="text-xs font-bold tabular-nums text-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Tag size={20} />
              </div>
              <h4 className="text-sm font-bold text-foreground mt-4">暂未发现匹配的标签</h4>
              <p className="text-xs text-muted-foreground mt-1">可调整筛选词或创建新标签</p>
            </div>
          )}
        </Card>

        {/* 创建/编辑 Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editTag ? '修改标签' : '新建标签'}</DialogTitle>
              <DialogDescription>
                {editTag
                  ? '修改后状态不变，请在列表中手动开启'
                  : '新建标签默认关闭，保存后可在列表中手动开启'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  标签名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="请输入标签名称"
                  maxLength={30}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  类别 <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {AGENT_LABEL_CATEGORY_OPTIONS.map((item) => (
                    <Button
                      key={item.value}
                      variant={formCategory === item.value ? 'default' : 'outline'}
                      size="xs"
                      type="button"
                      onClick={() => setFormCategory(item.value)}
                      className="rounded-xl text-xs font-bold"
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">排序</Label>
                <Input
                  type="number"
                  min={0}
                  value={formSort}
                  onChange={(e) => setFormSort(Math.max(0, Number(e.target.value) || 0))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">说明</Label>
                <Textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  maxLength={200}
                  className="text-xs resize-none"
                  placeholder="对该标签进行简要说明..."
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogOpen(false)}
                  className="text-xs"
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  disabled={!formName.trim()}
                  onClick={handleSave}
                  className="text-xs gap-2"
                >
                  {editTag ? '保存修改' : '保存设置'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
