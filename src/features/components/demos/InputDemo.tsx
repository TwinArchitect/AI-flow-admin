import { useState } from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function InputDemo() {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-6 max-w-sm">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">类型</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>文本</Label>
            <Input placeholder="请输入内容" />
          </div>
          <div className="space-y-1.5">
            <Label>密码</Label>
            <div className="relative">
              <Input type={show ? 'text' : 'password'} placeholder="请输入密码" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>搜索</Label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="搜索..." />
            </div>
          </div>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">状态</h3>
        <div className="space-y-3">
          <Input placeholder="默认" />
          <Input placeholder="禁用" disabled />
          <Input placeholder="只读" readOnly defaultValue="只读内容" />
          <Input placeholder="错误" className="border-destructive focus-visible:ring-destructive" />
        </div>
      </section>
    </div>
  );
}
