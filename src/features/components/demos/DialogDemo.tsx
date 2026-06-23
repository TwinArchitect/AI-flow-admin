import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DialogDemo() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">表单对话框</h3>
        <Dialog>
          <DialogTrigger asChild><Button>编辑用户信息</Button></DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>编辑用户信息</DialogTitle>
              <DialogDescription>修改以下字段后点击保存，更改将立即生效。</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="dlg-username">用户名</Label>
                <Input id="dlg-username" defaultValue="张三" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dlg-email">邮箱</Label>
                <Input id="dlg-email" defaultValue="zhangsan@example.com" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">取消</Button>
              <Button>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">确认对话框</h3>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          <Trash2 size={16} className="mr-1" />删除项目
        </Button>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
            </DialogHeader>
            <div className="flex gap-3 p-3 rounded-md bg-destructive/10">
              <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">此操作不可撤销，数据将被永久删除。</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>取消</Button>
              <Button variant="destructive" onClick={() => setConfirmOpen(false)}>确认删除</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
