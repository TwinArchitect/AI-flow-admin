import type { WorkflowNodeDef } from '../../types';

export function PlaceholderConfigPanel({ def }: { def: WorkflowNodeDef }) {
  return (
    <div className="rounded-md border border-dashed border-border px-4 py-10 text-center">
      <div className="text-sm font-medium text-foreground">{def.name} 配置</div>
      <p className="mt-1 text-xs text-muted-foreground">
        该节点的详细配置面板将在真实业务字段确定后补充。
      </p>
    </div>
  );
}
