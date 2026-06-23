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
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">运行中</Badge>
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">待处理</Badge>
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">已停止</Badge>
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">测试中</Badge>
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">草稿</Badge>
        </div>
      </section>
    </div>
  );
}
