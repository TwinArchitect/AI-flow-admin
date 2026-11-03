const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function compile(file, dependencies = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'exports', source)((name) => { if (name in dependencies) return dependencies[name]; throw new Error(`Unexpected dependency ${name}`); }, exports);
  return exports;
}
const contracts = compile('./kbContracts.ts');
test('legacy strategies fall back while all current strategies remain unchanged', () => {
  for (const value of [undefined, null, '', 'ast', 'sliding']) assert.equal(contracts.normalizeChunkStrategy(value), 'naive');
  for (const value of ['naive', 'one', 'table', 'qa', 'book', 'manual', 'laws', 'paper', 'presentation', 'picture', 'email', 'tag']) assert.equal(contracts.normalizeChunkStrategy(value), value);
});
test('media tags match the reference cap without restricting chunk tags', () => {
  const tags = [' #Foo，', 'foo', '', ...Array.from({length: 12}, (_, i) => `标签${i}`)];
  assert.equal(contracts.normalizeMediaTags(tags).length, 10);
  assert.deepEqual(contracts.normalizeMediaTags(tags).slice(0, 2), ['Foo', '标签0']);
  assert.equal(contracts.normalizeMediaTags(['x'.repeat(21)])[0].length, 20);
  assert.ok(contracts.normalizeChunkTags(tags).length > 10);
});
test('all accepted image formats enter image preview and confidence uses percentages', () => {
  for (const ext of ['ico', 'heic', 'heif', 'avif', 'png', 'jpg']) assert.ok(contracts.KB_IMAGE_EXTENSIONS.has(ext));
  assert.equal(contracts.formatMediaConfidence(0.956), '96%');
  assert.equal(contracts.formatMediaConfidence(95.6), '96%');
  assert.equal(contracts.formatMediaConfidence(0), '0%');
  assert.equal(contracts.formatMediaConfidence(NaN), null);
  assert.equal(contracts.formatMediaConfidence(undefined), null);
});
test('preview decodes a message-only JSON error instead of exposing raw JSON', async () => {
  const service = compile('./api/documentApi.ts', {
    '@/api/client': { http: {} },
    '@/lib/authSession': { authFetch: async () => new Response(JSON.stringify({ message: '该文档未包含原始文件，请查看分块内容' }), { status: 400, headers: { 'content-type': 'application/json' } }) },
    '../kbContracts': contracts,
    '../mediaNormalization': compile('./mediaNormalization.ts'),
  });
  await assert.rejects(service.fetchDocumentBlob('test'), (error) => error.message === '该文档未包含原始文件，请查看分块内容');
});
test('metadata counts object and JSON payloads while rejecting malformed values', () => {
  assert.equal(contracts.documentMetadataFieldCount({ purpose: 'test', title: 'test' }), 2);
  assert.equal(contracts.documentMetadataFieldCount('{"purpose":"test"}'), 1);
  for (const value of [null, undefined, [], 'bad', 'null', '[]']) assert.equal(contracts.documentMetadataFieldCount(value), 0);
});
test('chunk tags trim punctuation, deduplicate case-insensitively and enforce 20 characters', () => {
  assert.deepEqual(contracts.normalizeChunkTags([' #Foo，', 'foo', '', '、服务规范；', '123456789012345678901']), ['Foo', '服务规范', '12345678901234567890']);
});
test('parse skip precedence follows reference including legacy empty task arrays', () => {
  assert.equal(contracts.isParseSubmitSkipped({ skipped: true, taskIds: ['x'] }), true);
  assert.equal(contracts.isParseSubmitSkipped({ skipped: false, taskIds: [] }), false);
  assert.equal(contracts.isParseSubmitSkipped({ taskIds: [] }), true);
  assert.equal(contracts.isParseSubmitSkipped(null), false);
  assert.equal(contracts.isParseSubmitSkipped({}), false);
});
test('TAGGING remains an active processing stage', () => assert.ok(contracts.ACTIVE_DOCUMENT_STATUSES.includes('TAGGING')));
function api(result, status = 'READY') {
  const calls = [];
  const http = {
    post: async (...args) => { calls.push(['post', ...args]); return { data: result }; },
    get: async (...args) => { calls.push(['get', ...args]); return { data: { status } }; },
  };
  return { calls, ...compile('./api/documentApi.ts', { '@/api/client': { http }, '@/lib/authSession': {}, '../kbContracts': contracts, '../mediaNormalization': compile('./mediaNormalization.ts') }) };
}
test('unchanged incremental reparse checks READY progress for a null legacy response', async () => {
  const service = api(null);
  assert.equal((await service.submitDocumentParse('doc', 'READY', false)).skipped, true);
  assert.equal(service.calls[1][1], '/gpt/kb/document/progress/doc');
});
test('changed incremental reparse recognizes a running pipeline', async () => {
  const service = api({ taskIds: ['task'] }, 'PARSING');
  assert.equal((await service.submitDocumentParse('doc', 'READY', false)).skipped, false);
});
test('explicit skip does not issue a progress request', async () => {
  const service = api({ taskIds: [] });
  assert.equal((await service.submitDocumentParse('doc', 'READY', false)).skipped, true);
  assert.equal(service.calls.length, 1);
});
test('force sends force=true, accepts legacy response and avoids incremental skip fallback', async () => {
  const service = api(null);
  assert.equal((await service.submitDocumentParse('doc', 'READY', true)).skipped, false);
  assert.equal(service.calls[0][3].params.force, true);
  assert.equal(service.calls.length, 1);
});
test('first parse accepts legacy null without requiring taskIds', async () => {
  const service = api(null);
  assert.equal((await service.submitDocumentParse('doc', 'UPLOADED', false)).skipped, false);
  assert.equal(service.calls.length, 1);
});

test('elements requests use encoded IDs and fall back to legacy images on failure', async () => {
  const calls = [];
  const http = { get: async (url) => {
    calls.push(url);
    if (url.includes('/elements/')) throw new Error('legacy server');
    return { data: { list: [{ id: 'asset', asset_type: 'stamp', page_num: '2' }] } };
  } };
  const service = compile('./api/documentApi.ts', { '@/api/client': { http }, '@/lib/authSession': {}, '../kbContracts': contracts, '../mediaNormalization': compile('./mediaNormalization.ts') });
  const result = await service.listDocumentElements('doc/id');
  assert.deepEqual(calls, ['/gpt/kb/document/elements/doc%2Fid', '/gpt/kb/document/images/doc%2Fid']);
  assert.equal(result.records[0].assetType, 'SEAL'); assert.equal(result.records[0].pageNum, 2);
});

test('successful elements request does not call legacy images', async () => {
  const calls = [];
  const http = { get: async (url) => { calls.push(url); return { data: { records: [{ assetId: 'table', assetType: 'TABLE' }], total: 1 } }; } };
  const service = compile('./api/documentApi.ts', { '@/api/client': { http }, '@/lib/authSession': {}, '../kbContracts': contracts, '../mediaNormalization': compile('./mediaNormalization.ts') });
  assert.equal((await service.listDocumentElements('doc')).total, 1);
  assert.equal(calls.length, 1);
});
