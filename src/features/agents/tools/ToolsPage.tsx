import { useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ToolCard } from './components/ToolCard';
import { ToolFormModal } from './components/ToolFormModal';
import { INITIAL_TOOLS, type Tool } from './data/toolsMock';

interface ToolsPageProps {
  /** HTTP | MCP */
  type: 'HTTP' | 'MCP';
  /** Banner 主图标 */
  icon: LucideIcon;
  /** Banner 装饰色（渐变用 token class） */
  gradient: string;
  /** Badge 色 */
  badgeClass: string;
  /** Banner 标题 */
  title: string;
  /** Banner 描述 */
  description: string;
}

const ITEMS_PER_PAGE = 8;

export function ToolsPage({
  type,
  icon: Icon,
  gradient,
  badgeClass,
  title,
  description,
}: ToolsPageProps) {
  const [tools, setTools] = useState<Tool[]>(() => INITIAL_TOOLS.filter((t) => t.type === type));
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editTool, setEditTool] = useState<Partial<Tool> | null>(null);

  const filtered = tools.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSave = (form: Partial<Tool>) => {
    if (form.id) {
      setTools((prev) => prev.map((t) => (t.id === form.id ? ({ ...t, ...form } as Tool) : t)));
    } else {
      const prefix = type === 'HTTP' ? 'http-' : 'mcp-';
      setTools((prev) => [
        {
          ...form,
          id: prefix + Date.now(),
          type,
          author: '用户自定义',
          usage: '0',
          status: 'active',
        } as Tool,
        ...prev,
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="shrink-0 space-y-6">
        {/* Banner */}
        <div
          className={cn(
            'relative h-44 rounded-[32px] overflow-hidden border border-border',
            gradient
          )}
        >
          <div className="absolute inset-0 flex items-center px-8 md:px-12 z-10">
            <div className="max-w-2xl space-y-2">
              <Badge
                variant="secondary"
                className={cn('text-2xs font-bold uppercase tracking-wider border', badgeClass)}
              >
                {type} Center
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                {description}
              </p>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-15 pointer-events-none flex items-center justify-center">
            <Icon size={120} className="text-primary/40" strokeWidth={0.5} />
          </div>
        </div>

        {/* 操作栏 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-muted/30 p-5 rounded-3xl border border-border">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Badge variant="outline" className="text-2xs font-bold">
              当前 {filtered.length} 款 {type} 工具
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="text"
                placeholder={`搜索${type}工具名称或类别...`}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 h-9 bg-background border-border rounded-2xl text-xs"
              />
            </div>
            <Button
              size="sm"
              className="w-full sm:w-auto text-xs gap-2 rounded-2xl shadow-sm"
              onClick={() => {
                setEditTool({ type, method: 'POST', status: 'active' });
                setFormOpen(true);
              }}
            >
              <Plus size={15} /> 注册{type}工具
            </Button>
          </div>
        </div>
      </div>

      {/* 工具列表 */}
      <div className="flex-1 min-h-0 overflow-y-auto mt-8 pr-1 pb-2">
        {paged.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {paged.map((tool) => (
                <motion.div
                  key={tool.id}
                  layout
                  layoutId={`tool-${tool.id}`}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                >
                  <ToolCard
                    tool={tool}
                    onEdit={() => {
                      setEditTool(tool);
                      setFormOpen(true);
                    }}
                    onDelete={() => setTools((prev) => prev.filter((t) => t.id !== tool.id))}
                    onToggle={() =>
                      setTools((prev) =>
                        prev.map((t) =>
                          t.id === tool.id
                            ? ({
                                ...t,
                                status: t.status === 'active' ? 'offline' : 'active',
                              } as Tool)
                            : t
                        )
                      )
                    }
                    onDebug={() => {}}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 bg-card border border-border rounded-3xl space-y-4">
            <div className="text-muted-foreground text-sm font-bold">暂未登记符合要求的工具</div>
          </div>
        )}
      </div>

      {/* 分页 */}
      <div className="shrink-0 mt-4 flex items-center justify-between gap-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          共 {filtered.length} 项，当前第 {page} / {totalPages} 页
        </p>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-xs"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} />
          </Button>
          <span className="px-3 text-xs font-bold text-foreground">
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

      <ToolFormModal
        open={formOpen}
        tool={editTool}
        onClose={() => {
          setFormOpen(false);
          setEditTool(null);
        }}
        onSave={handleSave}
        pageType={type}
      />
    </div>
  );
}
