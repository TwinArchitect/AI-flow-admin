import { useState } from 'react';
import { Search, LayoutDashboard, Users, Settings, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem,
  CommandList, CommandSeparator, CommandShortcut,
} from '@/components/ui/command';

export function CommandDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">内嵌模式</h3>
        <Command className="rounded-lg border max-w-sm">
          <CommandInput placeholder="搜索..." />
          <CommandList>
            <CommandEmpty>未找到结果</CommandEmpty>
            <CommandGroup heading="页面">
              <CommandItem><LayoutDashboard size={16} className="mr-2" />仪表盘</CommandItem>
              <CommandItem><Workflow size={16} className="mr-2" />工作流</CommandItem>
              <CommandItem><Users size={16} className="mr-2" />用户管理</CommandItem>
              <CommandItem><Settings size={16} className="mr-2" />系统设置</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="操作">
              <CommandItem>新建工作流<CommandShortcut>⌘N</CommandShortcut></CommandItem>
              <CommandItem>搜索用户<CommandShortcut>⌘F</CommandShortcut></CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">命令面板（Dialog 模式）</h3>
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Search size={16} className="mr-2" />打开命令面板
          <span className="ml-2 text-xs text-muted-foreground border rounded px-1.5 py-0.5">⌘K</span>
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="p-0 max-w-md">
            <Command>
              <CommandInput placeholder="输入命令或搜索..." />
              <CommandList>
                <CommandEmpty>未找到结果</CommandEmpty>
                <CommandGroup heading="快捷操作">
                  <CommandItem onSelect={() => setOpen(false)}><LayoutDashboard size={16} className="mr-2" />前往仪表盘</CommandItem>
                  <CommandItem onSelect={() => setOpen(false)}><Workflow size={16} className="mr-2" />新建工作流</CommandItem>
                  <CommandItem onSelect={() => setOpen(false)}><Users size={16} className="mr-2" />邀请用户</CommandItem>
                  <CommandItem onSelect={() => setOpen(false)}><Settings size={16} className="mr-2" />系统设置</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
