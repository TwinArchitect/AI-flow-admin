import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareMenus, menuPaths, canAccess, menuNavigation, routeOutcome } from './routes.ts';

test('knowledge API documentation inherits knowledge permission only', () => {
  assert.equal(canAccess('/agents/knowledge/api-doc', new Set(['/agents/knowledge'])), true);
  assert.equal(canAccess('/agents/knowledge/api-doc', new Set(['/agents/models'])), false);
  assert.equal(canAccess('/agents/knowledge/api-doc', new Set()), false);
});

test('different accounts receive disjoint routes; module parents never grant every child', () => {
  const a = menuPaths(prepareMenus([{ id: 1, path: '/agent/models' }]));
  const b = menuPaths(prepareMenus([{ id: 2, path: '/agent/mine' }]));
  assert.equal(canAccess('/agents/models?tab=edit', a), true);
  assert.equal(canAccess('/agents/models', b), false);
  assert.equal(canAccess('/agents/myAgents', a), false);
  assert.equal(canAccess('/agents/models/unknown', a), false);
});
test('empty permissions fail closed, including standalone pages', () => {
  for (const route of ['/agents/models', '/workflows']) {
    assert.equal(canAccess(route, new Set()), false);
  }
});
test('component examples bypass menu permissions; login remains enforced by PrivateRoute', () => {
  assert.equal(canAccess('/components', new Set()), true);
  assert.equal(canAccess('/components/pagination', new Set()), true);
  assert.equal(canAccess('/components-other', new Set()), false);
});
test('hidden routes remain accessible but buttons do not grant navigation', () => {
  const menus = prepareMenus([{ id: 1, path: '/agent/models', hidden: 1 }, { id: 2, path: '/agent/mine', type: 1 }]);
  assert.equal(canAccess('/agents/models', menuPaths(menus)), true);
  assert.equal(canAccess('/agents/myAgents', menuPaths(menus)), false);
  assert.deepEqual(menuNavigation(menus), []);
});
test('flat and childList payloads retain backend configured unimplemented pages', () => {
  const menus = prepareMenus({ records: [{ id: '1', name: '智能体', path: '/agent' }, { id: '2', parentId: '1', path: '/agent/center/mine', name: '我的智能体' }, { id: '3', parentId: '1', path: '/video/new-page' }] });
  assert.deepEqual([...menuPaths(menus)], ['/agent', '/agents/myAgents', '/video/new-page']);
  assert.equal(menuNavigation(menus)[0].children.length, 2);
  assert.equal(canAccess('/agents/knowledge', menuPaths(prepareMenus([{ id: 1, childList: [{ id: 2, path: '/agent/knowledge/base' }] }]))), true);
});
test('known standalone pages are allowed only within an authorized session', () => {
  const paths = new Set(['/agents/myAgents']);
  assert.equal(canAccess('/workflows?id=1', paths), true);
  assert.equal(canAccess('/agents/orchestration', paths), true);
  assert.equal(canAccess('/agents/AgentPlaza/chat', paths), false);
  assert.equal(canAccess('/agents/AgentPlaza/chat', new Set(['/agents/AgentPlaza'])), true);
  assert.equal(canAccess('/agents/httpTools', paths), false);
});

test('fixed dashboard and status pages do not require menu grants', () => {
  for (const path of ['/', '/403', '/404']) assert.equal(canAccess(path, new Set()), true);
});
test('configured missing pages, forbidden implemented pages and unknown URLs stay distinct', () => {
  const grants = new Set(['/future/page']);
  assert.equal(routeOutcome('/future/page', grants, false), 'developing');
  assert.equal(routeOutcome('/agents/models', grants, true), 'forbidden');
  assert.equal(routeOutcome('/random/missing', grants, false), 'not-found');
  assert.equal(routeOutcome('/components/missing', grants, false), 'not-found');
  assert.equal(routeOutcome('/agents/models', new Set(['/agents/models']), true), 'allowed');
});
test('backend navigation preserves names, hierarchy and sorting while hiding buttons and hidden nodes', () => {
  const menus = prepareMenus([{ id: 1, name: '后台分类', children: [
    { id: 2, name: '后配置页面', path: '/future/page', sort: 2 },
    { id: 3, name: '先显示', path: '/first', sort: 1 },
    { id: 4, path: '/hidden', hidden: 1 },
    { id: 5, path: '/button', type: 1 },
    { id: 6, path: '//external.invalid' },
  ] }]);
  const nav = menuNavigation(menus);
  assert.equal(nav[0].label, '后台分类');
  assert.deepEqual(nav[0].children.map(node => node.label), ['先显示', '后配置页面']);
  assert.equal(menuPaths(menus).has('/hidden'), true);
  assert.equal(menuPaths(menus).has('//external.invalid'), false);
});
