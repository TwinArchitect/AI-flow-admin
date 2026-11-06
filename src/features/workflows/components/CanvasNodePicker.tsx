import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { getNodeModule, REGISTERED_NODE_CATEGORIES } from '../nodes/registry';
import type { WorkflowNodeType } from '../types';

export function CanvasNodePicker({ point, onClose, onSelect }: {
  point: { x: number; y: number } | null;
  onClose: () => void;
  onSelect: (type: WorkflowNodeType) => void;
}) {
  return <Popover open={!!point} onOpenChange={open => { if (!open) onClose(); }}>
    <PopoverAnchor asChild><span className="pointer-events-none fixed size-px" style={{ left: point?.x ?? 0, top: point?.y ?? 0 }} /></PopoverAnchor>
    <PopoverContent align="start" sideOffset={0} collisionPadding={12} className="w-72 overflow-hidden p-0" aria-label="添加画布节点" onCloseAutoFocus={event => event.preventDefault()}>
      <Command><CommandInput autoFocus placeholder="搜索节点名称或功能…" aria-label="搜索画布节点" /><CommandList className="max-h-[min(360px,60vh)]"><CommandEmpty>没有匹配的节点</CommandEmpty>
        {REGISTERED_NODE_CATEGORIES.map(category => <CommandGroup key={category.title} heading={category.title}>{category.items.map(node => {
          const Icon = getNodeModule(node.type).icon;
          return <CommandItem key={node.type} value={`${node.type} ${node.name} ${node.description}`} onSelect={() => onSelect(node.type)} className="gap-3 py-2.5"><Icon size={17} className="shrink-0 text-primary-text" /><span className="min-w-0"><span className="block text-xs font-medium">{node.name}</span><span className="block truncate text-[10px] text-muted-foreground">{node.description}</span></span></CommandItem>;
        })}</CommandGroup>)}
      </CommandList></Command>
    </PopoverContent>
  </Popover>;
}
