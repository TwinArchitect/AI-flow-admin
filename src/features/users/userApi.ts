import { http } from '@/api/client';
import { authFetch } from '@/lib/authSession';

export interface Department { id: string; name?: string; title?: string; type?: number | string; valueType?: string; children?: Department[]; childList?: Department[] }
export interface UserRole { id: string; name: string; code: string; tenantId?: string }
export interface ManagedUser {
  id: string; username: string; nickName?: string; nickname?: string; phone?: string; email?: string;
  sex?: number; platform?: string; enabled?: number; tenantId?: string; createTime?: string;
  sysRoles?: UserRole[]; agentOpenSysDeparts?: Department[];
}
export interface UserValues { username: string; nickName: string; phone: string; email: string; sex: number; platform: string; enabled: number; sysRoles: { id: string }[]; agentOpenSysDeparts: { id: string }[] }
const BASE = '/gpt/auth/user';
export const queryUsers = (query: { pageNum: number; pageSize: number; name?: string; deptId?: string }) => http.post<{ records: ManagedUser[]; total: number }>(`${BASE}/query`, { ...query, name: query.name || undefined, deptId: query.deptId || undefined }).then(r => r.data);
export const getUser = (id: string) => http.get<ManagedUser>(`${BASE}/get/${encodeURIComponent(id)}`).then(r => r.data);
export const queryDepartments = () => http.post<Department[]>('/gpt/auth/depart/query/tree?isLoadUser=false').then(r => r.data);
export const queryRoles = () => http.get<UserRole[]>('/gpt/auth/role/query/list').then(r => r.data);
export const saveUser = (values: UserValues, id?: string) => http.post(`${BASE}/${id ? 'update' : 'save'}`, { ...values, ...(id ? { id } : { createTime: new Date().toLocaleString('sv-SE') }) }).then(r => r.data);
export const disableUsers = (enabled: number, ids: string[]) => http.post(`${BASE}/disableUser?${new URLSearchParams([['enabled', String(enabled)], ...ids.map(id => ['ids', id])])}`).then(r => r.data);
export const deleteUsers = (ids: string[]) => http.post(`${BASE}/deleteBatch`, ids).then(r => r.data);
export const resetPassword = (id: string) => http.post(`${BASE}/resetPassword`, { id }).then(r => r.data);
export const unlockUser = (id: string) => http.post<boolean>(`${BASE}/unlock?userId=${encodeURIComponent(id)}`).then(r => r.data);
export function flattenDepartments(nodes: Department[], level = 0): (Department & { level: number })[] {
  return nodes.flatMap(node => [{ ...node, level }, ...flattenDepartments(node.children ?? node.childList ?? [], level + 1)]);
}
export async function downloadTemplate() {
  const response = await authFetch(`${BASE}/templates/download`);
  if (!response.ok || response.headers.get('content-type')?.includes('application/json')) throw new Error('模板下载失败');
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a'); link.href = url; link.download = '用户导入模板.xls';
  document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function importUsers(file: File) {
  const body = new FormData(); body.append('file', file);
  const response = await authFetch(`${BASE}/templates/upload`, { method: 'POST', body });
  const result = await response.json();
  if (!response.ok || ![0, 200].includes(result.code)) throw new Error(result.message || '导入失败');
  return result.data;
}
