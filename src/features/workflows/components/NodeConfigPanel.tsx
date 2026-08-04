import { useState } from 'react';
import { Braces, PanelRightClose, PanelRightOpen, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getNodeModule } from '../nodes/registry';
import { useWorkflowCanvasStore } from '../store/useWorkflowCanvasStore';
import { getAvailableVariablesForNode } from '../utils/availableVariables';
import { Field } from './config-panels/shared/Field';
import { JsonViewDialog } from './JsonViewDialog';

export function NodeConfigPanel({
  active,
  collapsed,
  onCollapsedChange,
  onClose,
}: {
  active: boolean;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onClose: () => void;
}) {
  const [jsonOpen, setJsonOpen] = useState(false);
  const {
    nodes,
    edges,
    selectedNodeId,
    deleteNode,
    updateNodeLabel,
    updateNodeConfig,
    removeEdgesBySourceHandle,
  } = useWorkflowCanvasStore();
  const node = nodes.find((item) => item.id === selectedNodeId);

  if (!node) return null;

  const module = getNodeModule(node.data.nodeType);
  const def = module.definition;
  const Icon = module.icon;
  const ConfigPanel = module.ConfigPanel;
  const isProtected = !module.connection.deletable;
  const variables = getAvailableVariablesForNode(node.id, nodes, edges);
  const nodeJson = module.serialize?.(node) ?? node;

  if (collapsed) {
    return (
      <aside className={cn(
        'flex h-full w-12 shrink-0 flex-col items-center border-l border-border bg-card py-2',
        !active && 'hidden',
      )}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCollapsedChange(false)}
          aria-label="展开节点配置面板"
        >
          <PanelRightOpen size={15} />
        </Button>
        <div className={cn('mt-2 flex size-8 items-center justify-center rounded-md', def.iconTone)}>
          <Icon size={15} />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="mt-auto"
          onClick={onClose}
          aria-label="关闭节点配置面板"
        >
          <X size={15} />
        </Button>
      </aside>
    );
  }

  return (
    <>
      <aside className={cn(
        'h-full w-[420px] max-w-[45%] shrink-0 flex-col border-l border-border bg-card',
        active ? 'flex' : 'hidden',
      )}>
        <div className="flex h-14 items-center gap-3 border-b border-border px-4">
        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', def.iconTone)}>
          <Icon size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{node.data.label}</div>
          <div className="text-[10px] uppercase text-muted-foreground">{node.data.nodeType}</div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCollapsedChange(true)}
          aria-label="收缩节点配置面板"
        >
          <PanelRightClose size={14} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setJsonOpen(true)}
          aria-label="查看节点 JSON 配置"
        >
          <Braces size={14} />
        </Button>
        {!isProtected && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              deleteNode(node.id);
              onClose();
            }}
            aria-label="删除节点"
          >
            <Trash2 size={14} />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="关闭配置面板"
        >
          <X size={14} />
        </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <Field label="节点 ID">
          <div className="rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            {node.id}
          </div>
        </Field>

        <Field label="节点名称">
          <Input
            value={node.data.label}
            onChange={(event) => updateNodeLabel(node.id, event.target.value)}
          />
        </Field>

        <ConfigPanel
          nodeId={node.id}
          config={node.data.config}
          variables={variables}
          onUpdate={(patch) => updateNodeConfig(node.id, patch)}
          onRemoveSourceHandle={removeEdgesBySourceHandle}
        />
        </div>
      </aside>
      <JsonViewDialog
        open={jsonOpen}
        onOpenChange={setJsonOpen}
        title="节点 JSON 配置"
        description={`nodeId: ${node.id} · 后端 Module 协议`}
        value={nodeJson}
      />
    </>
  );
}
