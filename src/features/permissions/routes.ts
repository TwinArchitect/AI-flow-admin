import type { PermissionMenu } from '@/types/auth';

const aliases: Record<string, string> = {
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
};
const pages = new Set(['/', '/agents/overview', '/agents/myAgents', '/agents/AgentPlaza', '/agents/models',
  '/agents/knowledge', '/agents/knowledge/settings', '/agents/tags', '/agents/memory',
  '/agents/httpTools', '/agents/mcpTools', '/agents/mobile-overview']);
// 与参照的会话、编排功能页白名单一致；不扩大到整个 /agents 前缀。
const standalone = new Set(['/agents/AgentPlaza/chat', '/agents/orchestration', '/workflows']);
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
    if (Number(node.type ?? 0) === 0 && node.path && pages.has(normalizePath(node.path))) paths.add(normalizePath(node.path));
    visit(node.children ?? []);
  });
  visit(menus); return paths;
}
export function canAccess(path: string, paths: Set<string>) {
  const normalized = normalizePath(path);
  if (isComponentExample(normalized)) return true;
  if (!paths.size) return false;
  if (normalized === '/agents/knowledge/api-doc') return paths.has('/agents/knowledge');
  return paths.has(normalized) || standalone.has(normalized)
    || (normalized === '/agents' && paths.has('/agents/myAgents'));
}
export interface NavigationItem { label: string; path: string; children?: NavigationItem[] }
export function isComponentExample(path: string) {
  const normalized = normalizePath(path);
  return normalized === '/components' || normalized.startsWith('/components/');
}
export function menuNavigation(menus: PermissionMenu[]): NavigationItem[] {
  return [...menus].sort((a,b) => Number(a.sort ?? 0)-Number(b.sort ?? 0)).flatMap(node => {
    if (Number(node.type ?? 0) !== 0 || Number(node.hidden ?? 0) === 1) return [];
    const children = menuNavigation(node.children ?? []);
    const path = node.path ? normalizePath(node.path) : '';
    const item: NavigationItem = { label: node.name || node.title || children[0]?.label || path, path: pages.has(path) ? path : children[0]?.path || '', ...(children.length ? { children } : {}) };
    return item.path ? [item] : [];
  });
}
