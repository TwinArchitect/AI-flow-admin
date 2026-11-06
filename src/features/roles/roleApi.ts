import { http } from '@/api/client';
import { prepareMenus } from '@/features/permissions/routes';
import type { PermissionMenu } from '@/types/auth';

export interface Role {
  id: string;
  name: string;
  code: string;
  tenantId?: string;
  isSystem?: number;
  roleType?: number;
  dsType?: number;
  dsScope?: string;
  createTime?: string;
}

export type RoleValues = Pick<Role, 'name' | 'code'> & { dsType: number; dsScope: string };
const base = '/gpt/auth/role';
const menuBase = '/gpt/auth/menu';

export const queryRoles = (query: { pageNum: number; pageSize: number; name: string }) =>
  http.post<{ records: Role[]; total: number }>(`${base}/query`, { ...query, name: query.name || undefined }).then(result => result.data);

export const saveRole = (values: RoleValues, role?: Role) =>
  http.post(`${base}/${role ? 'update' : 'save'}`, {
    ...values,
    ...(role
      ? { id: role.id, roleType: role.roleType, isSystem: role.isSystem }
      : { createTime: new Date().toLocaleString('sv-SE') }),
  });

export const deleteRole = (id: string) => http.post(`${base}/deleteBatch`, [id]);

export const applyRoleMenus = (id: string, ids: string[]) =>
  http.post(`${base}/apply`, { id, agentOpenSysMenus: ids.map(id => ({ id })) });

function menuIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(item => {
    if (typeof item === 'string' || typeof item === 'number') return [String(item)];
    if (!item || typeof item !== 'object') return [];
    const node = item as PermissionMenu;
    return [...(node.id == null ? [] : [String(node.id)]), ...menuIds(node.children ?? node.childList)];
  });
}

function filterMenus(nodes: PermissionMenu[], allowed: Set<string>): PermissionMenu[] {
  return nodes.flatMap(node => {
    const children = filterMenus(node.children ?? [], allowed);
    return allowed.has(String(node.id)) || children.length ? [{ ...node, children }] : [];
  });
}

export async function loadRoleMenus(role: Role, admin: boolean, currentTenant?: string) {
  const tenant = role.tenantId || currentTenant;
  const tenantQuery = new URLSearchParams(tenant ? { tenantId: tenant } : {});
  const roleQuery = new URLSearchParams(tenantQuery);
  roleQuery.set('roleId', role.id);
  const [tree, scope, assigned] = await Promise.all([
    http.get<unknown>(`${menuBase}/query${admin ? '/super' : ''}`),
    !admin && tenant ? http.get<unknown>(`/gpt/auth/sys/tenant/query/menuList?${tenantQuery}`) : undefined,
    tenant ? http.get<unknown>(`/gpt/auth/sys/tenant/query/roleMenuList?${roleQuery}`) : undefined,
  ]);
  const allowed = new Set(menuIds(scope?.data));
  const menus = prepareMenus(tree.data);
  return {
    menus: allowed.size ? filterMenus(menus, allowed) : menus,
    selected: [...new Set(menuIds(assigned?.data))],
  };
}
