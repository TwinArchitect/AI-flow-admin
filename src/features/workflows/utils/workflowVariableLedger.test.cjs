const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const loaded = {};
// Isolate aggregation from React/registry; node output schemas are provided by the existing contract adapter.
vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname + '/workflowVariableLedger.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, {
  exports: loaded,
  require(path) {
    if (path.endsWith('startNodeContract')) return { VARIABLE_NODE_ID: 'VARIABLE_NODE_ID', normalizeStartConfig: (config) => config };
    if (path.endsWith('variableRefs')) return { buildVariableRef: (id, key) => `{{${id}.${key}}}` };
    if (path.endsWith('availableVariables')) return { resolveNodeOutputs: (node) => node.data.outputs ?? [] };
    throw new Error(`Unexpected import ${path}`);
  },
});
const start = { id: 'start', data: { nodeType: 'start', label: '开始', config: { variables: [
  { key: 'files', label: 'files', valueType: 'file', defaultValue: '' },
  { key: 'tag', label: '标签', valueType: 'string', defaultValue: '默认文本' },
] }, outputs: [{ key: 'userChatInput', label: '用户问题', valueType: 'string' }, { key: 'tag', label: '标签', valueType: 'string' }] } };
const node = (id, type = 'number') => ({ id, data: { nodeType: 'code', label: '代码执行', config: {}, outputs: [{ key: 'result', label: '结果', valueType: type }] } });
const build = (states = {}, extra = []) => loaded.buildWorkflowVariableLedger([start, ...extra], [], states);
test('globals/start dedup, default detail and file runtime schema before running', () => {
  const entries = build();
  assert.equal(entries.length, 3);
  assert.ok(entries.every((entry) => entry.sampleStatus === 'no_run'));
  const files = entries.find((entry) => entry.outputKey === 'files');
  assert.equal(files.fileFieldSpecs.length, 5);
  assert.equal(loaded.getLedgerDetailValue(files)[0].mime, '');
  assert.equal(loaded.getLedgerDisplayValue(entries.find((entry) => entry.outputKey === 'tag')), '默认文本');
});
test('global samples fall back to start event and retain file enrichment', () => {
  const entries = build({ start: { status: 'success', debugOutputs: { tag: '运行值', files: [{ fileId: 'f1', name: '照片', url: '/photo', mime: 'image/png' }] } } });
  const files = entries.find((entry) => entry.outputKey === 'files');
  assert.equal(files.sampleStatus, 'sampled');
  assert.equal(loaded.getLedgerDisplayValue(files)[0].url, '/photo');
  assert.match(files.formatSummary, /含 url/);
  assert.equal(entries.find((entry) => entry.outputKey === 'tag').sampleValue, '运行值');
});
test('null global sample is not overwritten by the start fallback', () => {
  const entries = build({ VARIABLE_NODE_ID: { status: 'success', debugOutputs: { tag: null } }, start: { status: 'success', debugOutputs: { tag: '错误回退' } } });
  const tag = entries.find((entry) => entry.outputKey === 'tag');
  assert.equal(tag.sampleValue, null); assert.equal(tag.runtimeType, 'null'); assert.equal(tag.sampleStatus, 'sampled');
});
test('zero/false samples remain sampled; absent nodes are not executed; duplicate labels differ', () => {
  const entries = build({ a: { status: 'success', debugOutputs: { result: 0 } }, b: { status: 'success', debugOutputs: { result: false } } }, [node('a'), node('b', 'boolean'), node('c')]);
  assert.equal(entries.find((entry) => entry.nodeId === 'a').sampleValue, 0);
  assert.equal(entries.find((entry) => entry.nodeId === 'b').typeMismatch, false);
  assert.equal(entries.find((entry) => entry.nodeId === 'c').sampleStatus, 'not_executed');
  assert.notEqual(entries.find((entry) => entry.nodeId === 'a').nodeLabel, entries.find((entry) => entry.nodeId === 'b').nodeLabel);
});
test('JSON structured samples, genuine mismatches and project array/any types', () => {
  const entries = build({ a: { status: 'success', debugOutputs: { result: 'bad' } }, b: { status: 'success', debugOutputs: { result: '[1,2]' } }, c: { status: 'success', debugOutputs: { result: { x: 1 } } } }, [node('a'), node('b', 'arrayNumber'), node('c', 'any')]);
  assert.equal(entries.find((entry) => entry.nodeId === 'a').typeMismatch, true);
  assert.equal(entries.find((entry) => entry.nodeId === 'b').runtimeType, 'array');
  assert.equal(entries.find((entry) => entry.nodeId === 'b').typeMismatch, false);
  assert.equal(entries.find((entry) => entry.nodeId === 'c').typeMismatch, false);
  assert.equal(loaded.summarizeVariableLedger(entries).mismatched, 1);
});
