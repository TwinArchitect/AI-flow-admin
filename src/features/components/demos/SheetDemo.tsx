import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SheetDemo() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">方向</h3>
        <div className="flex flex-wrap gap-3">
          {(['right', 'left', 'top', 'bottom'] as const).map((side) => (
            <Sheet key={side}>
              <SheetTrigger asChild>
                <Button variant="outline">{side}</Button>
              </SheetTrigger>
              <SheetContent side={side}>
                <SheetHeader>
                  <SheetTitle>从 {side} 滑入</SheetTitle>
                  <SheetDescription>这是一个从 {side} 方向滑入的抽屉组件。</SheetDescription>
                </SheetHeader>
                <div className="py-4 text-sm text-muted-foreground">内容区域</div>
              </SheetContent>
            </Sheet>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">表单抽屉（常见用法）</h3>
        <Sheet>
          <SheetTrigger asChild>
            <Button>新建用户</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>新建用户</SheetTitle>
              <SheetDescription>填写以下信息创建新用户账户。</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="sheet-name">姓名</Label>
                <Input id="sheet-name" placeholder="请输入姓名" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sheet-email">邮箱</Label>
                <Input id="sheet-email" type="email" placeholder="请输入邮箱" />
              </div>
            </div>
            <SheetFooter>
              <Button className="w-full">创建用户</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </section>
    </div>
  );
}
