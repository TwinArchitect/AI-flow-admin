import { Separator } from '@/components/ui/separator';

export function SeparatorDemo() {
  return (
    <div className="space-y-8 max-w-sm">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">水平分割线</h3>
        <div className="space-y-4">
          <div><h4 className="text-sm font-medium">标题一</h4><p className="text-sm text-muted-foreground">内容区域</p></div>
          <Separator />
          <div><h4 className="text-sm font-medium">标题二</h4><p className="text-sm text-muted-foreground">内容区域</p></div>
          <Separator />
          <div><h4 className="text-sm font-medium">标题三</h4><p className="text-sm text-muted-foreground">内容区域</p></div>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">垂直分割线</h3>
        <div className="flex items-center gap-4 text-sm">
          <span>首页</span>
          <Separator orientation="vertical" className="h-4" />
          <span>关于</span>
          <Separator orientation="vertical" className="h-4" />
          <span>联系我们</span>
        </div>
      </section>
    </div>
  );
}
