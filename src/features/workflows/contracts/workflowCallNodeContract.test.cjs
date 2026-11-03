const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const c = require('./workflowCallNodeContract.ts');
const target = { agentId: 'child', agentName: '子流程' };
const setting = {
  chatConfig: { variables: [{ key: 'files', valueType: 'file' }, { key: 'tag', valueType: 'string' }, { key: 'attachment', valueType: 'file' }] },
  modules: [{ flowNodeType: 'workflowEnd', outputs: [{ key: 'echo', label: '回显', valueType: 'string' }, { key: 'system_error_text', type: 'error' }] }],
};
const asNode = config => ({ id: 'call', position: { x: 1, y: 2 }, data: { label: '子流程', config } });

test('target schema excludes system files but preserves custom file and end output', () => {
  const config = c.buildWorkflowCallFromSetting(JSON.stringify(JSON.stringify(setting)), target);
  assert.deepEqual(config.inputMappings.map(v => v.key), ['userChatInput', 'tag', 'attachment']);
  assert.equal(config.inputMappings[0].required, true);
  assert.equal(config.inputMappings[2].valueType, 'file');
  assert.deepEqual(config.exposedOutputs.map(v => v.key), ['echo']);
});
test('constants, references, target metadata and catchError survive save and restore', () => {
  const config = c.buildWorkflowCallFromSetting(setting, target);
  config.inputMappings[0].field = { valueMode: 'input', value: ' exact question ' };
  config.inputMappings[1].field = { valueMode: 'reference', value: '{{code.tag}}' };
  config.inputMappings[2].field = { valueMode: 'reference', value: '{{VARIABLE_NODE_ID.files}}' };
  config.catchError = true;
  const module = c.serializeWorkflowCallNode(asNode(config));
  assert.equal(module.agentId, target.agentId);
  assert.equal(module.publishedOnly, true);
  assert.deepEqual(module.inputs.find(v => v.key === 'tag').value, ['code', 'tag']);
  assert.equal(module.outputs.at(-1).type, 'error');
  const result = c.normalizeWorkflowCallConfig(c.parseWorkflowCallModule(module).data.config);
  assert.deepEqual(result.inputMappings.map(v => v.field), config.inputMappings.map(v => v.field));
  assert.deepEqual(result.exposedOutputs, config.exposedOutputs);
  assert.equal(result.catchError, true);
});
test('schema refresh keeps binding and row ID by key even when variables reorder; replacement resets', () => {
  const config = c.buildWorkflowCallFromSetting(setting, target);
  config.inputMappings[1].id = 'stable-tag';
  config.inputMappings[1].field = { valueMode: 'input', value: 'tag-value' };
  const reordered = { ...setting, chatConfig: { variables: [...setting.chatConfig.variables].reverse() } };
  const refreshed = c.buildWorkflowCallFromSetting(reordered, target, config);
  assert.equal(refreshed.inputMappings.find(v => v.key === 'tag').id, 'stable-tag');
  assert.equal(refreshed.inputMappings.find(v => v.key === 'tag').field.value, 'tag-value');
  assert.ok(c.buildWorkflowCallFromSetting(reordered, { ...target, agentId: 'other' }).inputMappings.every(v => v.field.value === ''));
});
test('legacy end inputs and input-only render metadata restore correctly', () => {
  const config = c.buildWorkflowCallFromSetting({ modules: [{ flowNodeType: 'workflowEnd', outputs: [], inputs: [{ key: 'resultRef' }, { key: 'legacy', valueType: 'string' }] }] }, target);
  assert.deepEqual(config.exposedOutputs.map(v => v.key), ['legacy']);
  const module = c.serializeWorkflowCallNode(asNode(config));
  const input = module.inputs.find(v => v.key === 'userChatInput');
  input.renderTypeList = ['input']; input.selectedTypeIndex = 999; input.value = 'literal';
  const restored = c.normalizeWorkflowCallConfig(c.parseWorkflowCallModule(module).data.config);
  assert.deepEqual(restored.inputMappings[0].field, { valueMode: 'input', value: 'literal' });
});
test('arrayString reference protocol uses nested pair and restores a single variable', () => {
  const config = c.normalizeWorkflowCallConfig({ inputMappings: [{ id: 'a', key: 'names', label: '名称', valueType: 'arrayString', field: { valueMode: 'reference', value: '{{code.names}}' } }] });
  const module = c.serializeWorkflowCallNode(asNode(config));
  assert.deepEqual(module.inputs.find(v => v.key === 'names').value, [['code', 'names']]);
  const restored = c.normalizeWorkflowCallConfig(c.parseWorkflowCallModule(module).data.config);
  assert.equal(restored.inputMappings.find(v => v.key === 'names').field.value, '{{code.names}}');
});
test('legacy canvas nodes derive the same target schema as modules, including resultRef', () => {
  const legacy = { chatConfig: setting.chatConfig, nodes: [{ id: 'old-end', type: 'end', data: { config: { outputVariables: [{ key: 'echo', value: '{{start.userChatInput}}' }, { key: '', value: '' }] } } }] };
  const result = c.buildWorkflowCallFromSetting(JSON.stringify(legacy), target);
  assert.deepEqual(result.inputMappings.map(v => v.key), ['userChatInput', 'tag', 'attachment']);
  assert.deepEqual(result.exposedOutputs, [{ key: 'echo', label: 'echo', valueType: 'string' }]);
  const resultRef = c.buildWorkflowCallFromSetting({ nodes: [{ id: 'end', type: 'workflowEnd', data: { config: { resultRef: '{{start.userChatInput}}' } } }] }, target);
  assert.deepEqual(resultRef.exposedOutputs.map(v => v.key), ['result']);
  const both = c.buildWorkflowCallFromSetting({ ...legacy, modules: setting.modules }, target);
  assert.equal(both.exposedOutputs[0].label, '回显');
});
