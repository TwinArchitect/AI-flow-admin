import { useState } from 'react';
import { Plus, Trash2, Download, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ButtonDemo() {
  const [loading, setLoading] = useState(false);
  function handleLoading() {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  }
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">变体</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">尺寸</h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><Plus size={16} /></Button>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">带图标</h3>
        <div className="flex flex-wrap gap-3">
          <Button><Mail size={16} className="mr-1" />发送邮件</Button>
          <Button variant="outline"><Download size={16} className="mr-1" />下载</Button>
          <Button variant="destructive"><Trash2 size={16} className="mr-1" />删除</Button>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">状态</h3>
        <div className="flex flex-wrap gap-3">
          <Button disabled>禁用</Button>
          <Button onClick={handleLoading} disabled={loading}>
            {loading && <Loader2 size={16} className="mr-1 animate-spin" />}
            {loading ? '加载中...' : '点击加载'}
          </Button>
        </div>
      </section>
    </div>
  );
}
