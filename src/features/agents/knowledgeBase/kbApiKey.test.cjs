const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function service() {
  const calls = [];
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(require.resolve('./api/kbApiKeyApi.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const http = Object.fromEntries(['get', 'post'].map((method) => [method, async (...args) => { calls.push([method, ...args]); return { data: method === 'get' ? [] : { id: 'mock-id', apiKey: 'mock-only' } }; }]));
  new Function('require', 'exports', code)(() => ({ http }), exports);
  return { api: exports, calls };
}
test('key lifecycle matches reference methods and endpoints without real credentials', async () => {
  const { api, calls } = service();
  assert.deepEqual(await api.listKbApiKeys(), []);
  await api.createKbApiKey({ keyName: 'test', expireTime: '2026-12-01 12:00:00' });
  await api.disableKbApiKey('key/id'); await api.enableKbApiKey('key/id'); await api.deleteKbApiKey('key/id');
  assert.deepEqual(calls, [
    ['get', '/gpt/kb/api-keys'],
    ['post', '/gpt/kb/api-keys', { keyName: 'test', expireTime: '2026-12-01 12:00:00' }],
    ['post', '/gpt/kb/api-keys/key%2Fid/disable', {}],
    ['post', '/gpt/kb/api-keys/key%2Fid/enable', {}],
    ['post', '/gpt/kb/api-keys/key%2Fid'],
  ]);
});
test('missing IDs cannot submit actions and expiry preserves local wall time', () => {
  const { api, calls } = service();
  for (const action of ['disableKbApiKey', 'enableKbApiKey', 'deleteKbApiKey']) assert.throws(() => api[action](' '), /缺少密钥 ID/);
  assert.equal(calls.length, 0);
  assert.equal(api.formatKeyExpiry('2026-12-01T12:30'), '2026-12-01 12:30:00');
  assert.equal(api.formatKeyExpiry('2026-12-01T12:30:45'), '2026-12-01 12:30:45');
  assert.equal(api.formatKeyExpiry(''), undefined);
});
