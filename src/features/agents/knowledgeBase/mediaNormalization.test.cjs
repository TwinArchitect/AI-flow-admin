const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(require.resolve('./mediaNormalization.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const api = {};
new Function('exports', source)(api);
test('snake case elements normalize structured JSON, page, dimensions and tags', () => {
  const asset = api.normalizeMediaAsset({ id: 42, asset_type: 'equation', page_num: '3', width: '80', structure_content: '{"latex":"x^2"}', bbox: '[0,0,1,1]', tags: '["公式","验收"]', preview_url: '/preview/42' });
  assert.equal(asset.assetId, '42'); assert.equal(asset.assetType, 'FORMULA'); assert.equal(asset.pageNum, 3);
  assert.deepEqual(asset.structureContent, { latex: 'x^2' }); assert.deepEqual(asset.bbox, [0, 0, 1, 1]); assert.deepEqual(asset.tags, ['公式', '验收']);
});
test('camelCase tables retain structure, confidence and source', () => {
  const asset = api.normalizeMediaAsset({ assetId: 'table', assetType: 'TABLE', structureContent: { rows: [['a', 'b']] }, confidence: '0.9', source: 'MINERU' });
  assert.equal(asset.assetType, 'TABLE'); assert.equal(asset.confidence, 0.9); assert.equal(asset.source, 'MINERU'); assert.deepEqual(asset.structureContent.rows, [['a', 'b']]);
});
test('legacy list and records envelopes preserve totals and aliases', () => {
  assert.equal(api.normalizeDocumentElementList({ list: [{ id: 'seal', element_type: 'stamp' }] }).records[0].assetType, 'SEAL');
  assert.equal(api.normalizeDocumentElementList({ total: '4', records: [{ id: 'signature', assetType: 'SIGNATURE' }] }).total, 4);
});
test('missing or invalid optional structures do not fabricate elements', () => {
  assert.deepEqual(api.normalizeDocumentElementList(null), { total: 0, records: [] });
  assert.equal(api.normalizeMediaAsset({ id: 'legacy' }).assetType, 'IMAGE');
  assert.equal(api.normalizeMediaAsset({ confidence: 'invalid' }).confidence, undefined);
});
