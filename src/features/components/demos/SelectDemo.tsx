import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function SelectDemo() {
  return (
    <div className="space-y-6 max-w-sm">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">基础</h3>
        <div className="space-y-1.5">
          <Label>选择角色</Label>
          <Select>
            <SelectTrigger><SelectValue placeholder="请选择角色" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">管理员</SelectItem>
              <SelectItem value="editor">编辑</SelectItem>
              <SelectItem value="viewer">查看者</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">分组</h3>
        <Select>
          <SelectTrigger><SelectValue placeholder="选择城市" /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>华北</SelectLabel>
              <SelectItem value="beijing">北京</SelectItem>
              <SelectItem value="tianjin">天津</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>华东</SelectLabel>
              <SelectItem value="shanghai">上海</SelectItem>
              <SelectItem value="hangzhou">杭州</SelectItem>
              <SelectItem value="nanjing">南京</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">禁用</h3>
        <Select disabled>
          <SelectTrigger><SelectValue placeholder="禁用状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="a">选项 A</SelectItem>
          </SelectContent>
        </Select>
      </section>
    </div>
  );
}
