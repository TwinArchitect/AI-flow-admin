const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const contract = require('./concatNodeContract.ts');
const { TEMPLATE_EXAMPLES } = require('../utils/templateExamples.ts');
const node = config => ({ id: 'template', position: { x: 1, y: 2 }, data: { label: '模板', config } });
const input = (key, valueType = 'string', value = '{{start.userChatInput}}') => ({ id: key, key, label: key, required: true, valueType, value });
const base = inputs => ({ nodeId: 'template', name: '模板', position: { x: 0, y: 0 }, inputs });

test('round-trips every supported reference type without rewriting Jinja attributes or filters', () => {
  for (const valueType of contract.TEMPLATE_VALUE_TYPES) {
    const config = { template: '{{ order.customer | upper }}', inputVariables: [input('order', valueType)] };
    const serialized = contract.serializeConcatNode(node(config));
    const restored = contract.parseConcatModule(serialized).data.config;
    assert.equal(serialized.flowNodeType, 'templateTransform');
    assert.deepEqual(serialized.inputs.find(v => v.key === 'order').value, ['start', 'userChatInput']);
    assert.equal(restored.inputVariables[0].valueType, valueType);
    assert.equal(restored.inputVariables[0].value, '{{start.userChatInput}}');
    assert.equal(restored.template, config.template);
    assert.equal(serialized.outputs[0].key, 'system_text');
    assert.ok(serialized.inputs.find(v => v.key === 'order').customInputConfig.selectValueTypeList.includes('datasetQuote'));
  }
});
test('legacy textarea with mapped context keeps named inputs and dotted Jinja expressions', () => {
  const restored = contract.parseConcatModule(base([
    { key: 'system_textareaInput', value: '{{ order.customer }}' },
    { key: 'order', value: ['start', 'order'], required: true, valueType: 'object' },
  ])).data.config;
  assert.equal(restored.template, '{{ order.customer }}');
  assert.equal(restored.inputVariables[0].key, 'order');
  assert.equal(restored.inputVariables[0].value, '{{start.order}}');
});
test('legacy direct upstream references migrate with repeated references deduplicated', () => {
  const restored = contract.parseConcatModule(base([{ key: 'system_textareaInput', value: '{{start.userChatInput}} / {{start.userChatInput}}' }])).data.config;
  assert.equal(restored.inputVariables.length, 1);
  assert.equal(restored.inputVariables[0].value, '{{start.userChatInput}}');
  assert.equal(restored.template, '{{ arg1 }} / {{ arg1 }}');
});
test('static templates, optional unbound inputs and explicit empty templates keep their semantics', () => {
  assert.deepEqual(contract.validateConcatNode(node({ template: '固定文本', inputVariables: [] })), []);
  assert.deepEqual(contract.validateConcatNode(node({ template: '{{ optional }}', inputVariables: [{ ...input('optional'), required: false, value: '' }] })), []);
  const restored = contract.parseConcatModule(base([{ key: 'template', value: '' }])).data.config;
  assert.equal(restored.template, '');
  assert.ok(contract.validateConcatNode(node(restored)).some(v => v.includes('模板内容不能为空')));
});
test('required references, unnamed and duplicate input names are rejected', () => {
  const invalid = contract.validateConcatNode(node({ template: '{{ arg1 }}', inputVariables: [input(''), input('arg1', 'string', ''), input('arg1')] }));
  assert.ok(invalid.some(v => v.includes('未命名')));
  assert.ok(invalid.some(v => v.includes('不能重复')));
  assert.ok(invalid.some(v => v.includes('必填')));
});
test('reference examples include complete condition, loop, filters and suggested context keys', () => {
  assert.equal(TEMPLATE_EXAMPLES.length, 4);
  assert.ok(TEMPLATE_EXAMPLES[1].template.includes('order.amount | round(2)'));
  assert.ok(TEMPLATE_EXAMPLES[2].template.includes('item.score | round(2)'));
  assert.ok(TEMPLATE_EXAMPLES[3].inputKeys.includes('score'));
  assert.ok(TEMPLATE_EXAMPLES.every(v => v.description && v.inputKeys.length));
});
test('missing historical template falls back without losing mappings; duplicate row IDs stay unique', () => {
  const restored = contract.parseConcatModule(base([{ key: 'arg1', value: ['start', 'userChatInput'], valueType: 'string' }])).data.config;
  assert.equal(restored.template, '{{ arg1 }}');
  assert.equal(restored.inputVariables[0].value, '{{start.userChatInput}}');
  const normalized = contract.normalizeConcatConfig({ template: 'text', inputVariables: [
    { ...input('a'), id: 'template-input-1' }, { ...input('b'), id: 'template-input-1' },
  ] });
  assert.equal(new Set(normalized.inputVariables.map(v => v.id)).size, 2);
});
