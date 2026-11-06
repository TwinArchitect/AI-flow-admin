import type { PermissionMenu } from '@/types/auth';

const aliases: Record<string, string> = {
  '/users': '/system/user',
  '/home': '/', '/agent/overview': '/agents/overview', '/agent/mine': '/agents/myAgents',
  '/agent/center/mine': '/agents/myAgents', '/agent/center': '/agents/AgentPlaza',
  '/agent/center/square': '/agents/AgentPlaza', '/agent/square': '/agents/AgentPlaza',
  '/agent/model': '/agents/models', '/agent/models': '/agents/models',
  '/agent/knowledge/base': '/agents/knowledge', '/agent/knowledge': '/agents/knowledge',
  '/agent/kb/settings': '/agents/knowledge/settings', '/agent/tags': '/agents/tags',
  '/agent/knowledge/api-doc': '/agents/knowledge/api-doc',
  '/agent/basic': '/agents/tags', '/agent/basic/tag': '/agents/tags',
  '/agent/memory': '/agents/memory', '/agent/plugins/http': '/agents/httpTools',
  '/agent/plugin/http': '/agents/httpTools', '/agent/plugins/mcp': '/agents/mcpTools',
  '/agent/plugin/mcp': '/agents/mcpTools', '/agent/mobile-overview': '/agents/mobile-overview',
  '/agent/chat': '/agents/AgentPlaza/chat', '/agent/orchestration': '/agents/orchestration',
  '/agent/center/audit': '/agents/audit', '/agent/audit': '/agents/audit',
};
const inheritedPermissions: Record<string, string[]> = {
  '/agents/knowledge/api-doc': ['/agents/knowledge'],
  '/agents/AgentPlaza/chat': ['/agents/AgentPlaza'],
  '/agents/orchestration': ['/agents/myAgents'],
  '/workflows': ['/agents/myAgents'],
  '/agents': ['/agents/myAgents'],
};
export function normalizePath(path: string) {
  const value = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return aliases[value] || value;
}
export function prepareMenus(raw: unknown): PermissionMenu[] {
  if (!Array.isArray(raw)) {
    if (!raw || typeof raw !== 'object') return [];
    const value = raw as Record<string, unknown>;
    return prepareMenus(value.children ?? value.childList ?? value.records ?? value.data);
  }
  const nodes = raw.filter((node): node is PermissionMenu => Boolean(node && typeof node === 'object'));
  if (nodes.some(node => (node.children ?? node.childList)?.length)) {
    return nodes.map(node => ({ ...node, children: prepareMenus(node.children ?? node.childList ?? []) }));
  }
  const map = new Map(nodes.map(node => [String(node.id), { ...node, children: [] as PermissionMenu[] }]));
  const roots: PermissionMenu[] = [];
  for (const node of nodes) {
    const current = map.get(String(node.id))!;
    let parent = map.get(String(node.parentId));
    const seen = new Set([String(node.id)]);
    let cursor = parent;
    while (cursor) {
      if (seen.has(String(cursor.id))) { parent = undefined; break; }
      seen.add(String(cursor.id)); cursor = map.get(String(cursor.parentId));
    }
    if (parent) parent.children.push(current); else roots.push(current);
  }
  return roots;
}
export function menuPaths(menus: PermissionMenu[]): Set<string> {
  const paths = new Set<string>();
  const visit = (items: PermissionMenu[]) => items.forEach(node => {
    if (Number(node.type ?? 0) === 0 && node.path && isLocalMenuPath(node.path)) paths.add(normalizePath(node.path));
    visit(node.children ?? []);
  });
  visit(menus); return paths;
}
export function canAccess(path: string, paths: Set<string>) {
  const normalized = normalizePath(path);
  if (normalized === '/' || normalized === '/403' || normalized === '/404' || isComponentExample(normalized)) return true;
  return paths.has(normalized) || (inheritedPermissions[normalized]?.some(parent => paths.has(parent)) ?? false);
}
export interface NavigationItem { label: string; path: string; children?: NavigationItem[] }
// 仅接受站内路径，不把后端菜单当作可执行 URL。
export function isLocalMenuPath(path: string) {
  return path.startsWith('/') && !path.startsWith('//') && !/[\\\x00-\x1f]/.test(path);
}
export function isComponentExample(path: string) {
  const normalized = normalizePath(path);
  return normalized === '/components' || normalized.startsWith('/components/');
}
export function menuNavigation(menus: PermissionMenu[]): NavigationItem[] {
  return [...menus].sort((a,b) => Number(a.sort ?? 0)-Number(b.sort ?? 0)).flatMap(node => {
    if (Number(node.type ?? 0) !== 0 || Number(node.hidden ?? 0) === 1) return [];
    const children = menuNavigation(node.children ?? []);
    const path = node.path && isLocalMenuPath(node.path) ? normalizePath(node.path) : '';
    const item: NavigationItem = { label: node.name || node.title || children[0]?.label || path, path, ...(children.length ? { children } : {}) };
    return item.path || children.length ? [item] : [];
  });
}

export function menuTitle(path: string, menus: PermissionMenu[]): string | undefined {
  for (const node of menus) {
    if (node.path && normalizePath(node.path) === normalizePath(path)) return node.name || node.title;
    const nested = menuTitle(path, node.children ?? node.childList ?? []);
    if (nested) return nested;
  }
}
export function menuBreadcrumbs(path: string, menus: PermissionMenu[]): string[] {
  const normalized = normalizePath(path);
  const find = (nodes: PermissionMenu[]): string[] => {
    for (const node of nodes) {
      if (Number(node.type ?? 0) !== 0) continue;
      const label = node.name || node.title;
      const children = find(node.children ?? node.childList ?? []);
      if (children.length) return label ? [label, ...children] : children;
      if (node.path && normalizePath(node.path) === normalized) return label ? [label] : [];
    }
    return [];
  };
  const exact = find(menus);
  if (exact.length) return exact;
  const parent = inheritedPermissions[normalized]?.[0];
  return parent ? menuBreadcrumbs(parent, menus) : [];
}
export function routeOutcome(path: string, paths: Set<string>, implemented: boolean) {
  if (!implemented) return paths.has(normalizePath(path)) ? 'developing' : 'not-found';
  return canAccess(path, paths) ? 'allowed' : 'forbidden';
}
