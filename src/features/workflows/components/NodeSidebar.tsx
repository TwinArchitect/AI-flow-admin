import { useMemo, useState } from 'react';
import { PanelLeftClose, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getNodeModule, REGISTERED_NODE_CATEGORIES } from '../nodes/registry';
import type { WorkflowNodeDef } from '../types';

interface NodeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NodeSidebar({ isOpen, onClose }: NodeSidebarProps) {
  const [keyword, setKeyword] = useState('');

  const filteredCategories = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return REGISTERED_NODE_CATEGORIES;

    return REGISTERED_NODE_CATEGORIES.map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.name.toLowerCase().includes(normalized) ||
          item.description.toLowerCase().includes(normalized),
      ),
    })).filter((category) => category.items.length > 0);
  }, [keyword]);

  function handleDragStart(event: React.DragEvent, node: WorkflowNodeDef) {
    event.dataTransfer.setData('application/workflow-node-type', node.type);
    event.dataTransfer.effectAllowed = 'move';
  }

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col overflow-hidden border-r border-border bg-card transition-[width]',
        isOpen ? 'w-72' : 'w-0',
      )}
    >
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <div>
          <div className="text-sm font-semibold text-foreground">节点库</div>
          <div className="text-[10px] text-muted-foreground">拖拽节点到画布</div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="收起节点库">
          <PanelLeftClose size={15} />
        </Button>
      </div>

      <div className="border-b border-border p-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索节点..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-3">
        {filteredCategories.map((category) => (
          <section key={category.title} className="space-y-2">
            <div className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {category.title}
            </div>
            <div className="space-y-1">
              {category.items.map((node) => {
                const Icon = getNodeModule(node.type).icon;
                const outputHint = node.type === 'reply'
                  ? '主动聊天输出'
                  : node.type === 'llm'
                    ? '聊天输出 · 可配置'
                    : node.type === 'baseChart'
                      ? '主动展示图表'
                      : node.type === 'knowledge'
                        ? '可展示引用 · 正文需指定回复'
                        : node.type === 'end'
                          ? '最终数据返回 · 非主动聊天输出'
                          : '无主动聊天输出 · 可接指定回复 / 结束';

                return (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(event) => handleDragStart(event, node)}
                    className="group flex cursor-grab items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-accent active:cursor-grabbing"
                  >
                    <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', node.iconTone)}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-foreground">{node.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">{node.description}</div>
                      <div className="mt-1 whitespace-normal text-[10px] leading-relaxed text-primary">{outputHint}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
