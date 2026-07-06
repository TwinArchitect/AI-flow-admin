import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { NODE_DEF_MAP, NODE_FALLBACK_ICON, NODE_ICON_MAP } from '../config/nodeDefs';
import { useWorkflowCanvasStore } from '../store/useWorkflowCanvasStore';
import { EndConfigPanel } from './config-panels/EndConfigPanel';
import { HttpConfigPanel } from './config-panels/HttpConfigPanel';
import { LlmConfigPanel } from './config-panels/LlmConfigPanel';
import { PlaceholderConfigPanel } from './config-panels/PlaceholderConfigPanel';
import { StartConfigPanel } from './config-panels/StartConfigPanel';
import { Field } from './config-panels/shared/Field';

function NodeSpecificConfig({
  nodeId,
  nodeType,
  config,
  def,
}: {
  nodeId: string;
  nodeType: string;
  config: Record<string, unknown>;
  def: (typeof NODE_DEF_MAP)[keyof typeof NODE_DEF_MAP];
}) {
  const updateNodeConfig = useWorkflowCanvasStore((state) => state.updateNodeConfig);
  const onUpdate = (patch: Record<string, unknown>) => updateNodeConfig(nodeId, patch);

  switch (nodeType) {
    case 'start':
      return <StartConfigPanel config={config} onUpdate={onUpdate} />;
    case 'llm':
      return <LlmConfigPanel config={config} onUpdate={onUpdate} />;
    case 'end':
      return <EndConfigPanel config={config} onUpdate={onUpdate} />;
    case 'http':
      return <HttpConfigPanel config={config} onUpdate={onUpdate} />;
    default:
      return <PlaceholderConfigPanel def={def} />;
  }
}

export function NodeConfigPanel() {
  const {
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    deleteNode,
    updateNodeLabel,
  } = useWorkflowCanvasStore();
  const node = nodes.find((item) => item.id === selectedNodeId);

  if (!node) return null;

  const def = NODE_DEF_MAP[node.data.nodeType];
  const Icon = NODE_ICON_MAP[node.data.nodeType] ?? NODE_FALLBACK_ICON;
  const isProtected = node.data.nodeType === 'start' || node.data.nodeType === 'end';

  return (
    <aside className="absolute bottom-0 right-0 top-0 z-20 flex w-[360px] flex-col border-l border-border bg-card shadow-xl">
      <div className="flex h-14 items-center gap-3 border-b border-border px-4">
        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', def.iconTone)}>
          <Icon size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{node.data.label}</div>
          <div className="text-[10px] uppercase text-muted-foreground">{node.data.nodeType}</div>
        </div>
        {!isProtected && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => deleteNode(node.id)}
            aria-label="删除节点"
          >
            <Trash2 size={14} />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setSelectedNodeId(null)}
          aria-label="关闭配置面板"
        >
          <X size={14} />
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <Field label="节点名称">
          <Input
            value={node.data.label}
            onChange={(event) => updateNodeLabel(node.id, event.target.value)}
          />
        </Field>

        <NodeSpecificConfig
          nodeId={node.id}
          nodeType={node.data.nodeType}
          config={node.data.config}
          def={def}
        />
      </div>
    </aside>
  );
}
