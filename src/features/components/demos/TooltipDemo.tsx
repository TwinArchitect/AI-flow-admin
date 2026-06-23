import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Info, Settings, Trash2 } from 'lucide-react';

export function TooltipDemo() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">基础</h3>
        <Tooltip>
          <TooltipTrigger asChild><Button variant="outline">悬停查看提示</Button></TooltipTrigger>
          <TooltipContent><p>这是一个工具提示</p></TooltipContent>
        </Tooltip>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">方向</h3>
        <div className="flex gap-3">
          {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
            <Tooltip key={side}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">{side}</Button>
              </TooltipTrigger>
              <TooltipContent side={side}><p>方向：{side}</p></TooltipContent>
            </Tooltip>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">图标按钮场景</h3>
        <div className="flex gap-2">
          {[{ icon: Info, tip: '查看详情' }, { icon: Settings, tip: '系统设置' }, { icon: Trash2, tip: '删除' }].map(({ icon: Icon, tip }) => (
            <Tooltip key={tip}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon"><Icon size={18} /></Button>
              </TooltipTrigger>
              <TooltipContent><p>{tip}</p></TooltipContent>
            </Tooltip>
          ))}
        </div>
      </section>
    </div>
  );
}
