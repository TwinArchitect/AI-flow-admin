const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function api(fetcher) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(require.resolve('./api/datasetApi.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'exports', code)((name) => name === '@/api/client' ? { http: {} } : { authFetch: fetcher }, exports);
  return exports;
}
const preview = { sha256: 'checked-hash', targetModel: 'embedding', targetDimension: 2560 };
test('preview sends only the selected file as multipart to encoded target', async () => {
  let call;
  const service = api(async (...args) => { call = args; return new Response(JSON.stringify({ code: 0, data: preview })); });
  const file = new File(['zip'], 'test.zip');
  assert.deepEqual(await service.previewDatasetImport('kb/id', file), preview);
  assert.equal(call[0], '/gpt/kb/dataset/kb%2Fid/import/preview');
  assert.equal(call[1].method, 'POST'); assert.equal(call[1].body.get('file').name, 'test.zip'); assert.equal(call[1].headers, undefined);
});
test('confirmation binds file to checked sha/model/dimension and returns task IDs', async () => {
  let form;
  const result = { documentIds: ['doc'], taskIds: ['task'], chunkCount: 3 };
  const service = api(async (_url, options) => { form = options.body; return new Response(JSON.stringify({ code: 200, data: result })); });
  assert.deepEqual(await service.importDatasetArchive('kb', new File(['zip'], 'test.zip'), preview), result);
  assert.equal(form.get('sha256'), 'checked-hash'); assert.equal(form.get('targetModel'), 'embedding'); assert.equal(form.get('targetDimension'), '2560');
});
test('preview propagates backend validation failures', async () => {
  const service = api(async () => new Response(JSON.stringify({ code: 500, message: '内容包缺少 manifest' })));
  await assert.rejects(service.previewDatasetImport('kb', new File(['bad'], 'bad.zip')), /内容包缺少 manifest/);
});
test('export rejects JSON errors even with HTTP 200 and preserves readable backend reason', async () => {
  const service = api(async () => new Response(JSON.stringify({ code: 500, message: '请完成解析后导出' }), { headers: { 'content-type': 'application/json' } }));
  await assert.rejects(service.exportDatasetArchive('kb', 'test', false), /请完成解析后导出/);
});
test('ZIP export sends original-file flag, sanitizes filename and releases object URL', async () => {
  const previousDocument = global.document; const previousWindow = global.window;
  const create = URL.createObjectURL; const revoke = URL.revokeObjectURL;
  const anchor = { click() { this.clicked = true; }, remove() {} };
  let path; let revoked;
  global.document = { createElement: () => anchor, body: { appendChild() {} } };
  global.window = { setTimeout: (callback) => callback() };
  URL.createObjectURL = () => 'blob:test'; URL.revokeObjectURL = (url) => { revoked = url; };
  try {
    const service = api(async (url) => { path = url; return new Response(new Blob(['zip']), { headers: { 'content-type': 'application/zip' } }); });
    await service.exportDatasetArchive('kb/id', 'test/name', true);
    assert.equal(path, '/gpt/kb/dataset/kb%2Fid/export?includeOriginals=true'); assert.equal(anchor.download, 'test_name.zip'); assert.equal(anchor.clicked, true); assert.equal(revoked, 'blob:test');
  } finally { global.document = previousDocument; global.window = previousWindow; URL.createObjectURL = create; URL.revokeObjectURL = revoke; }
});
