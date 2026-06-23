import { useState } from 'react';
import { MultiSelect } from '@/components/ui/multi-select';
import { Label } from '@/components/ui/label';

const frameworks = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'SolidJS' },
  { value: 'qwik', label: 'Qwik' },
];

const roles = [
  { value: 'admin', label: '管理员' },
  { value: 'editor', label: '编辑' },
  { value: 'viewer', label: '查看者' },
  { value: 'guest', label: '访客', disabled: true },
];

export function MultiSelectDemo() {
  const [selected1, setSelected1] = useState<string[]>([]);
  const [selected2, setSelected2] = useState<string[]>(['admin']);
  const [selected3, setSelected3] = useState<string[]>([]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">基础多选</h3>
        <div className="space-y-1.5">
          <Label>技术栈</Label>
          <MultiSelect options={frameworks} value={selected1} onChange={setSelected1} placeholder="请选择技术栈" />
          <p className="text-xs text-muted-foreground">已选：{selected1.length > 0 ? selected1.join(', ') : '无'}</p>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">含禁用选项</h3>
        <div className="space-y-1.5">
          <Label>用户角色</Label>
          <MultiSelect options={roles} value={selected2} onChange={setSelected2} placeholder="请选择角色" />
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">限制最多选 2 项</h3>
        <div className="space-y-1.5">
          <Label>最多选择 2 个框架</Label>
          <MultiSelect
            options={frameworks}
            value={selected3}
            onChange={setSelected3}
            maxCount={2}
            placeholder="最多选 2 项"
          />
          <p className="text-xs text-muted-foreground">已选 {selected3.length}/2</p>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">禁用状态</h3>
        <MultiSelect options={frameworks} value={['react', 'vue']} disabled />
      </section>
    </div>
  );
}
