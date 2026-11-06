import { useState } from 'react';
import { ChevronRight, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { type Department, type ManagedUser, type UserRole, type UserValues } from './userApi';

export function UserFormDialog({ user, roles, departments, busy, onClose, onSave }: { user: ManagedUser | null; roles: UserRole[]; departments: Department[]; busy: boolean; onClose: () => void; onSave: (values: UserValues) => void }) {
  const [values, setValues] = useState<UserValues>(() => ({ username: user?.username ?? '', nickName: user?.nickName || user?.nickname || '', phone: user?.phone ?? '', email: user?.email ?? '', sex: user?.sex ?? 0, platform: user?.platform || 'web', enabled: user?.enabled ?? 0, sysRoles: (user?.sysRoles ?? []).map(({ id }) => ({ id })), agentOpenSysDeparts: (user?.agentOpenSysDeparts ?? []).map(({ id }) => ({ id })) }));
  const [collapsedDepartments, setCollapsedDepartments] = useState<string[]>([]);
  const set = (key: keyof UserValues, value: string | number) => setValues(prev => ({ ...prev, [key]: value }));
  const toggle = (key: 'sysRoles' | 'agentOpenSysDeparts', id: string, checked: boolean) => setValues(prev => ({ ...prev, [key]: checked ? [...prev[key].filter(item => item.id !== id), { id }] : prev[key].filter(item => item.id !== id) }));
  function renderDepartments(nodes: Department[], depth = 0) {
    return nodes.filter(node => String(node.valueType) !== '2').map(node => {
      const children = (node.children ?? node.childList ?? []).filter(child => String(child.valueType) !== '2');
      const expanded = !collapsedDepartments.includes(node.id);
      const name = node.name || node.title || node.id;
      return <div key={node.id}>
        <div className="flex items-center gap-1" style={{ paddingLeft: depth * 16 }}>
          {children.length > 0 ? (
            <Button type="button" variant="ghost" size="icon-xs" aria-expanded={expanded} aria-label={`${expanded ? '收起' : '展开'} ${name}`}
              onClick={() => setCollapsedDepartments(previous => expanded ? [...previous, node.id] : previous.filter(id => id !== node.id))}>
              <ChevronRight size={14} className={expanded ? 'rotate-90' : ''} />
            </Button>
          ) : <span className="size-6 shrink-0" />}
          <label className="flex min-w-0 items-center gap-2 py-1.5 text-sm">
            <Checkbox disabled={busy} checked={values.agentOpenSysDeparts.some(item => item.id === node.id)} onCheckedChange={checked => toggle('agentOpenSysDeparts', node.id, checked === true)} />
            <Folder size={14} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{name}</span>
          </label>
        </div>
        {expanded && renderDepartments(children, depth + 1)}
      </div>;
    });
  }
  const departmentRows = renderDepartments(departments);
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="sm:max-w-3xl" showCloseButton={!busy}>
    <DialogHeader><DialogTitle>{user ? '编辑用户' : '新增用户'}</DialogTitle><DialogDescription>{user ? '维护用户资料、角色与所属部门' : '新增用户使用后端默认密码，可配置角色与所属部门'}</DialogDescription></DialogHeader>
    <form id="user-form" className="space-y-5" onSubmit={event => { event.preventDefault(); if (!busy) onSave({ ...values, username: values.username.trim(), platform: values.platform || 'web' }); }}>
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        {([['username', '登录账号', '请输入唯一登录账号'], ['nickName', '用户昵称', '请输入昵称'], ['phone', '手机号码', '请输入手机号'], ['email', '邮箱', '请输入邮箱']] as const).map(([key, label, placeholder]) => <div key={key} className="space-y-2"><Label htmlFor={`user-${key}`}>{label}{key === 'username' && ' *'}</Label><Input id={`user-${key}`} value={values[key]} placeholder={placeholder} required={key === 'username'} readOnly={key === 'username' && !!user} type={key === 'email' ? 'email' : 'text'} onChange={event => set(key, event.target.value)} /></div>)}
        <div className="space-y-2"><Label>性别</Label><Select value={String(values.sex)} onValueChange={value => set('sex', Number(value))} disabled={busy}><SelectTrigger aria-label="用户性别"><SelectValue /></SelectTrigger><SelectContent>{['未知', '男', '女'].map((label, i) => <SelectItem key={i} value={String(i)}>{label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="user-platform">平台</Label><Input id="user-platform" value={values.platform} onChange={event => set('platform', event.target.value)} /></div>
        <div className="space-y-2"><Label>状态</Label><Select value={String(values.enabled)} onValueChange={value => set('enabled', Number(value))} disabled={busy}><SelectTrigger aria-label="用户状态"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">启用</SelectItem><SelectItem value="1">禁用</SelectItem></SelectContent></Select></div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>角色</Label><div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">{roles.length ? roles.map(role => <label key={role.id} className="flex items-center gap-2 text-sm"><Checkbox disabled={busy} checked={values.sysRoles.some(item => item.id === role.id)} onCheckedChange={checked => toggle('sysRoles', role.id, checked === true)} /><span>{role.name}<span className="ml-2 text-xs text-muted-foreground">{role.code}</span></span></label>) : <p className="text-sm text-muted-foreground">暂无角色数据</p>}</div></div>
      <div className="space-y-2"><Label>所属部门</Label><div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">{departmentRows.length ? departmentRows : <p className="text-sm text-muted-foreground">暂无部门数据</p>}</div><p className="text-xs text-muted-foreground">可在部门树中选择多个所属部门</p></div></div>
    </form>
    <DialogFooter><Button variant="outline" disabled={busy} onClick={onClose}>取消</Button><Button form="user-form" type="submit" disabled={busy || !values.username.trim()}>{busy ? '保存中…' : '保存'}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
