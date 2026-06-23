import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PopoverDemo() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">基础</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">打开 Popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <p className="text-sm text-muted-foreground">这是一个基础的 Popover 浮层，可以放置任意内容。</p>
          </PopoverContent>
        </Popover>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">表单场景</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">设置宽度</Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">调整宽度</h4>
              <div className="space-y-1.5">
                <Label htmlFor="pop-width">宽度 (px)</Label>
                <Input id="pop-width" defaultValue="320" type="number" />
              </div>
              <Button size="sm" className="w-full">应用</Button>
            </div>
          </PopoverContent>
        </Popover>
      </section>
    </div>
  );
}
