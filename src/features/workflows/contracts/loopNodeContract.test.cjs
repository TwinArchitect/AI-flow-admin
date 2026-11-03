const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const c = require('./loopNodeContract.ts');
const node = (config) => ({ id: 'loop', position: { x: 12, y: 34 }, data: { label: '循环', nodeType: 'loop', config } });
test('default and conditional configurations retain mode and use fixed results output', () => {
  assert.equal(c.createDefaultLoopConfig().loopRunMode, 'array');
  assert.equal(c.normalizeLoopConfig({ loopRunMode: 'conditional' }).loopRunMode, 'conditional');
  assert.equal(c.loopOutputs({ customOutputs: [{ key: 'old' }] })[0].key, 'results');
  assert.equal(c.loopOutputs()[0].valueType, 'arrayString');
});
test('new modules round-trip array reference, source, mode, child IDs and dimensions', () => {
  const original = c.normalizeLoopConfig({ loopRunMode: 'conditional', loopRunInputArray: '{{source.items}}', loopOutputSource: '{{reply.text}}', childrenNodeIds: ['entry', 'reply'], nodeWidth: 920, nodeHeight: 620 });
  const module = c.serializeLoopNode(node(original));
  assert.deepEqual(module.inputs.find((input) => input.key === 'loopRunInputArray').value, [['source', 'items']]);
  assert.deepEqual(module.inputs.find((input) => input.key === 'loopOutputSource').value, ['reply', 'text']);
  assert.equal(module.inputs.some((input) => input.key === 'loopCustomOutputs'), false);
  assert.deepEqual(module.outputs.map((output) => output.key).sort(), ['results', 'system_error_text']);
  const restored = c.normalizeLoopConfig(c.parseLoopNode(module).data.config);
  assert.deepEqual(restored, original);
});
test('historical draft first output migrates and does not preserve obsolete output definitions', () => {
  const config = c.normalizeLoopConfig({ customOutputs: [{ key: 'old', value: '{{body.answer}}' }, { key: 'second', value: '{{body.extra}}' }] });
  assert.equal(config.loopOutputSource, '{{body.answer}}');
  assert.equal('customOutputs' in config, false);
  assert.equal(c.normalizeLoopConfig({ loopOutputSource: '', customOutputs: [{ value: '{{body.answer}}' }] }).loopOutputSource, '');
});
test('old saved dynamic inputs migrate, explicit new source takes precedence', () => {
  const module = c.serializeLoopNode(node(c.createDefaultLoopConfig()));
  module.inputs = module.inputs.filter((input) => input.key !== 'loopOutputSource');
  module.inputs.push({ key: 'oldResult', value: ['body', 'answer'] });
  module.outputs = [{ id: 'oldResult', key: 'oldResult', type: 'dynamic', valueType: 'object' }];
  assert.equal(c.parseLoopNode(module).data.config.loopOutputSource, '{{body.answer}}');
  module.inputs.push({ key: 'loopOutputSource', value: ['newBody', 'text'] });
  assert.equal(c.parseLoopNode(module).data.config.loopOutputSource, '{{newBody.text}}');
});
test('array mode requires an array ref, conditional does not, both require a collection ref', () => {
  assert.equal(c.validateLoopNode(node({ loopRunMode: 'conditional', loopOutputSource: '{{body.text}}' })).length, 0);
  assert.equal(c.validateLoopNode(node({ loopRunMode: 'array', loopOutputSource: '{{body.text}}' })).length, 1);
  assert.equal(c.validateLoopNode(node({ loopRunMode: 'conditional' })).length, 1);
  assert.equal(c.getLoopReferences(node({ loopRunMode: 'conditional', loopRunInputArray: '{{stale.items}}', loopOutputSource: '{{body.text}}' })).length, 1);
});
test('loop start conditional mode survives serialization', () => {
  const start = { ...node(c.createDefaultLoopStartConfig('conditional')), data: { label: '循环开始', config: c.createDefaultLoopStartConfig('conditional') } };
  const module = c.serializeLoopStartNode(start);
  assert.equal(module.inputs.find((input) => input.key === 'loopRunMode').value, 'conditional');
  assert.equal(c.parseLoopStartNode(module).data.config.loopRunMode, 'conditional');
});
