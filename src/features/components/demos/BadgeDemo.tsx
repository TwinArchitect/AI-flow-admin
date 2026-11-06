import { Badge } from '@/components/ui/badge';

export function BadgeDemo() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">变体</h3>
        <div className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">语义色</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">运行中</Badge>
          <Badge variant="warning">待处理</Badge>
          <Badge variant="danger">已停止</Badge>
          <Badge variant="info">测试中</Badge>
          <Badge variant="accent">草稿</Badge>
          <Badge variant="muted">隐藏</Badge>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">尺寸</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">标准</Badge>
          <Badge variant="secondary" size="compact">紧凑</Badge>
        </div>
      </section>
    </div>
  );
}
