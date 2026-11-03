const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
// Run this isolated TypeScript contract without loading the React application.
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const c = require('./datasetSearchNodeContract.ts');
const node = config => ({ id: 'kb', type: 'knowledge', position: { x: 1, y: 2 }, data: { label: '知识库', config: { ...c.createDefaultDatasetSearchConfig(), usingReRank: false, searchInput: { valueMode: 'input', value: 'test' }, ...config } } });
const roundTrip = value => c.parseDatasetSearchModule(c.serializeDatasetSearchNode(value)).data.config;

test('static cross-dataset document selections round trip with IDs, names and error branch', () => {
  const value = node({ datasets: [{ datasetId: 'a', name: 'A' }, { datasetId: 'b', name: 'B' }], retrievalScope: 'files', documents: [{ documentId: 'd1', datasetId: 'a', name: 'one' }, { documentId: 'd2', datasetId: 'b', name: 'two' }], catchError: true });
  const result = roundTrip(value);
  assert.deepEqual(result.documents, value.data.config.documents);
  assert.deepEqual(result.datasets.map(({ datasetId, name }) => ({ datasetId, name })), value.data.config.datasets);
  assert.equal(result.catchError, true);
  assert.deepEqual(c.validateDatasetSearchNode(value), []);
});
test('dynamic dataset/file references survive persistence and enter the dependency ledger', () => {
  const value = node({ datasetInputMode: 'reference', datasetIds: { valueMode: 'reference', value: '{{start.kbs}}' }, retrievalScope: 'files', documentIds: { valueMode: 'reference', value: '{{start.docs}}' }, searchInput: { valueMode: 'reference', value: '{{start.question}}' } });
  const result = roundTrip(value);
  assert.equal(result.datasetIds.value, '{{start.kbs}}');
  assert.equal(result.documentInputMode, 'reference');
  assert.equal(result.documentIds.value, '{{start.docs}}');
  assert.deepEqual(c.getDatasetSearchReferences(value).map(item => item.value), ['{{start.kbs}}', '{{start.docs}}', '{{start.question}}']);
  assert.deepEqual(c.validateDatasetSearchNode(value), []);
});
test('invalid empty scopes and foreign documents fail validation', () => {
  assert.ok(c.validateDatasetSearchNode(node({ datasets: [{ datasetId: 'a' }], retrievalScope: 'files' })).some(error => error.includes('至少选择一个文件')));
  assert.ok(c.validateDatasetSearchNode(node({ datasets: [{ datasetId: 'a' }], retrievalScope: 'files', documents: [{ documentId: 'd', datasetId: 'b' }] })).some(error => error.includes('不属于')));
  assert.ok(c.validateDatasetSearchNode(node({ datasetInputMode: 'reference', datasetIds: { valueMode: 'reference', value: 'a,b' } })).some(error => error.includes('知识库 ID')));
});
test('legacy dataset strings and comma-separated document IDs restore under one dataset', () => {
  const module = c.serializeDatasetSearchNode(node({ datasets: [{ datasetId: 'a' }] }));
  module.inputs = module.inputs.filter(item => !['datasetSelection', 'documentSelection', 'datasetInputMode', 'retrievalScope', 'documentIds'].includes(item.key));
  module.inputs.find(item => item.key === 'datasets').value = ['a'];
  module.inputs.push({ key: 'documentIds', selectedTypeIndex: 0, value: 'one, two' }, { key: 'retrievalScope', value: 'files' });
  const result = c.parseDatasetSearchModule(module).data.config;
  assert.equal(result.datasetInputMode, 'select');
  assert.deepEqual(result.documents.map(item => item.documentId), ['one', 'two']);
  assert.equal(result.documents[0].datasetId, 'a');
});
test('all-files mode ignores inactive file references and duplicate documents normalize once', () => {
  const value = node({ datasets: [{ datasetId: 'a' }], documentInputMode: 'reference', documentIds: { valueMode: 'reference', value: '{{missing.docs}}' }, documents: [{ documentId: 'd', datasetId: 'a' }, { documentId: 'd', datasetId: 'a' }] });
  assert.deepEqual(c.getDatasetSearchReferences(value), []);
  assert.deepEqual(c.validateDatasetSearchNode(value), []);
  assert.equal(c.normalizeDatasetSearchConfig(value.data.config).documents.length, 1);
});

test('restores search input by actual render type, including reordered legacy fields', () => {
  const module = c.serializeDatasetSearchNode(node({ datasets: [{ datasetId: 'a' }] }));
  const field = module.inputs.find(item => item.key === 'datasetSearchInput');
  for (const [renderTypeList, selectedTypeIndex, value] of [
    [['textarea', 'reference'], 0, '固定检索词'],
    [['input'], undefined, '单输入历史配置'],
    [['textarea', 'reference'], 99, '越界回退首项'],
    [['reference', 'textarea'], 1, '标准固定文本'],
  ]) {
    Object.assign(field, { renderTypeList, selectedTypeIndex, value });
    assert.deepEqual(c.parseDatasetSearchModule(module).data.config.searchInput, { valueMode: 'input', value });
  }
  Object.assign(field, { renderTypeList: ['textarea', 'reference'], selectedTypeIndex: 1, value: [['start', 'question'], ['previous', 'text']] });
  const restored = c.parseDatasetSearchModule(module);
  assert.deepEqual(restored.data.config.searchInput, { valueMode: 'reference', value: '{{start.question}} {{previous.text}}' });
  assert.deepEqual(c.serializeDatasetSearchNode(restored).inputs.find(item => item.key === 'datasetSearchInput').value, [['start', 'question'], ['previous', 'text']]);
});

test('normalizes search weights to reference precision and bounds through persistence', () => {
  const value = node({ datasets: [{ datasetId: 'a' }], similarity: 0.456, embeddingWeight: 0.384, rerankWeight: 0.999, limit: 51 });
  const restored = roundTrip(value);
  assert.equal(restored.similarity, 0.46);
  assert.equal(restored.embeddingWeight, 0.38);
  assert.equal(restored.rerankWeight, 1);
  assert.equal(restored.limit, 50);
  const bounded = c.normalizeDatasetSearchConfig({ similarity: -1, embeddingWeight: 2, rerankWeight: -0.1, limit: 0 });
  assert.deepEqual([bounded.similarity, bounded.embeddingWeight, bounded.rerankWeight, bounded.limit], [0, 1, 0, 1]);
});

test('restores historical rerank booleans without enabling explicitly disabled configurations', () => {
  const module = c.serializeDatasetSearchNode(node({ datasets: [{ datasetId: 'a' }] }));
  const field = module.inputs.find(item => item.key === 'usingReRank');
  for (const value of [false, 'false', 0]) {
    field.value = value;
    const restored = c.parseDatasetSearchModule(module);
    assert.equal(restored.data.config.usingReRank, false);
    assert.deepEqual(c.validateDatasetSearchNode(restored), []);
    assert.equal(c.serializeDatasetSearchNode(restored).inputs.find(item => item.key === 'usingReRank').value, false);
  }
  for (const value of [true, 'true', 1, undefined, null, 'invalid']) {
    field.value = value;
    assert.equal(c.parseDatasetSearchModule(module).data.config.usingReRank, true);
  }
  module.inputs = module.inputs.filter(item => item.key !== 'usingReRank');
  assert.equal(c.parseDatasetSearchModule(module).data.config.usingReRank, true);
});
