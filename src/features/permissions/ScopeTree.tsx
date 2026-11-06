import { useState } from 'react';
import { ChevronRight, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { PermissionMenu } from '@/types/auth';

export type TreeNode = { id: string; name: string; children: TreeNode[] };
export function menuNodes(nodes: PermissionMenu[]): TreeNode[] {
  return nodes.filter(node => node.id != null).map(node => ({
    id: String(node.id), name: node.title || node.name || node.path || String(node.id),
    children: menuNodes(node.children ?? []),
  }));
}
function descendantIds(node: TreeNode): string[] {
  return [node.id, ...node.children.flatMap(descendantIds)];
}

export function ScopeTree({ nodes, selected, onChange, cascade, busy, label, empty, className }: {
  nodes: TreeNode[]; selected: string[]; onChange: (ids: string[]) => void;
  cascade?: boolean; busy: boolean; label: string; empty: string; className?: string;
}) {
  const [collapsed, setCollapsed] = useState<string[]>([]);
  function render(items: TreeNode[], depth = 0) {
    return items.map(node => {
      const expanded = !collapsed.includes(node.id);
      return <div key={node.id}>
        <div className="flex items-center gap-1 rounded-md hover:bg-accent" style={{ paddingLeft: depth * 16 }}>
          {node.children.length > 0 ? (
            <Button type="button" variant="ghost" size="icon-xs" aria-expanded={expanded}
              aria-label={`${expanded ? '收起' : '展开'} ${node.name}`}
              onClick={() => setCollapsed(previous => expanded ? [...previous, node.id] : previous.filter(id => id !== node.id))}>
              <ChevronRight size={14} className={expanded ? 'rotate-90' : ''} />
            </Button>
          ) : <span className="size-6 shrink-0" />}
          <label className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-sm">
            <Checkbox disabled={busy} checked={selected.includes(node.id)} onCheckedChange={checked => {
              const ids = cascade ? descendantIds(node) : [node.id];
              onChange(checked === true ? [...new Set([...selected, ...ids])] : selected.filter(id => !ids.includes(id)));
            }} />
            <Folder size={14} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{node.name}</span>
          </label>
        </div>
        {expanded && render(node.children, depth + 1)}
      </div>;
    });
  }
  return <div role="group" aria-label={label} className={cn('overflow-y-auto rounded-lg border border-border p-2', cascade ? 'max-h-[420px]' : 'max-h-56', className)}>
    {nodes.length ? render(nodes) : <p className="p-3 text-sm text-muted-foreground">{empty}</p>}
  </div>;
}

