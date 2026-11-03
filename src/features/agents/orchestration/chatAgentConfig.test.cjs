const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const c = require('./chatAgentConfig.ts');
const { CHAT_FILE_ACCEPT, validateChatUploadFile } = require('./chatUpload.ts');
const fallback = { id: 'acceptance', name: '验收', intro: '说明' };
const variable = (key, valueType = 'string') => ({ id: key, key, label: key, valueType, required: false, defaultValue: '' });
const config = () => {
  const result = c.createDefaultChatAgentConfig(fallback);
  result.dialogue.plan = { modelId: 'llm', model: 'display-only' };
  return result;
};

test('new and historical chat configurations retain exactly one protected files input and thinking off', () => {
  for (const result of [config(), c.parseChatAgentSetting({ dialogue: {} }, fallback)]) {
    assert.equal(result.dialogue.enableThinking, false);
    assert.equal(result.dialogue.inputVariables.length, 1);
    assert.equal(result.dialogue.inputVariables[0].key, 'files');
    assert.equal(result.dialogue.inputVariables[0].valueType, 'file');
    assert.equal(result.dialogue.inputVariables[0].system, true);
  }
});
test('reference configuration round-trips variables, constraints, persona references and thinking', () => {
  const raw = config();
  raw.dialogue.enableThinking = true;
  raw.dialogue.inputVariables.push({ ...variable('customer'), required: true, description: '客户', maxLength: 12, defaultValue: 'Alice' },
    { ...variable('items', 'array'), defaultValue: '[1,2]' }, { ...variable('attachment', 'file'), defaultValue: '[{"fileId":"f","fileName":"a.txt"}]' });
  raw.basic.persona = '你好 {{VARIABLE_NODE_ID.customer}}';
  raw.dialogue.openingQuestions = ['', '  ', ''];
  const persisted = JSON.parse(c.buildChatAgentSettingString(raw));
  assert.deepEqual(persisted.dialogue.plan, { modelId: 'llm' });
  assert.deepEqual(persisted.dialogue.openingQuestions, []);
  assert.equal(persisted.dialogue.inputVariables.find(v => v.key === 'customer').maxLength, 12);
  const restored = c.parseChatAgentSetting(JSON.stringify(persisted), fallback);
  assert.equal(restored.dialogue.enableThinking, true);
  assert.equal(restored.basic.persona, raw.basic.persona);
  assert.equal(restored.dialogue.inputVariables.find(v => v.key === 'items').valueType, 'array');
  assert.equal(restored.dialogue.inputVariables.find(v => v.key === 'attachment').defaultValue, raw.dialogue.inputVariables[3].defaultValue);
  assert.equal(c.validateChatAgentConfig(restored), null);
});
test('zero or fewer than three opening questions do not block saving', () => {
  for (const questions of [[], ['', '', ''], ['一个问题'], ['一', '二']]) {
    const value = config(); value.dialogue.openingQuestions = questions;
    assert.equal(c.validateChatAgentConfig(value), null);
  }
});
test('name and model requirements remain; duplicate names, keys and invalid lengths are rejected', () => {
  const value = config(); value.dialogue.plan = null;
  assert.match(c.validateChatAgentConfig(value), /规划模型/);
  value.dialogue.plan = { modelId: 'llm' };
  value.dialogue.inputVariables.push(variable('a'), { ...variable('b'), label: 'a' });
  assert.match(c.validateChatAgentConfig(value), /名称重复/);
  value.dialogue.inputVariables = [variable('a'), { ...variable('a'), label: 'b' }];
  assert.match(c.validateChatAgentConfig(value), /引用键重复/);
  value.dialogue.inputVariables = [{ ...variable('a'), maxLength: -1 }];
  assert.match(c.validateChatAgentConfig(value), /正整数/);
});
test('system files defaults survive while repeated system inputs are removed', () => {
  const parsed = c.parseChatInputVariables([{ ...variable('files', 'file'), defaultValue: 'file-id' }, variable('files', 'file'), variable('customer')]);
  assert.equal(parsed.filter(v => v.key === 'files').length, 1);
  assert.equal(parsed[0].defaultValue, 'file-id');
  assert.equal(parsed.find(v => v.key === 'customer').label, 'customer');
});
test('persona optimization guard detects references; normal text stays optimizable', () => {
  assert.equal(c.hasChatPersonaVariableRefs('客户 {{VARIABLE_NODE_ID.customer}}'), true);
  assert.equal(c.hasChatPersonaVariableRefs('普通提示词'), false);
});
test('thinking can be turned back off without dropping variables or other skills', () => {
  const value = config(); value.dialogue.enableThinking = false;
  value.dialogue.inputVariables.push(variable('customer'));
  value.skills.mcpServers = [{ id: 'mcp', enabledToolNames: ['lookup'] }];
  value.skills.workflows = [{ id: 'flow', publishedOnly: true }];
  const persisted = JSON.parse(c.buildChatAgentSettingString(value));
  assert.equal(persisted.dialogue.enableThinking, false);
  assert.equal(persisted.dialogue.inputVariables.length, 2);
  assert.deepEqual(persisted.skills.mcpServers[0], { id: 'mcp', enabledToolNames: ['lookup'] });
  assert.deepEqual(persisted.skills.workflows[0], { id: 'flow', publishedOnly: true });
});
test('chat upload covers reference defaults and preserves existing spreadsheet, archive and video support', () => {
  for (const extension of ['pdf', 'doc', 'docx', 'txt', 'md', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'mp3', 'mp4', 'xlsx', 'zip', 'flv']) {
    assert.equal(validateChatUploadFile({ name: `sample.${extension}`, size: 16 }), null);
    assert.ok(CHAT_FILE_ACCEPT.split(',').includes(`.${extension}`));
  }
  assert.equal(validateChatUploadFile({ name: 'README.MD', size: 50 * 1024 * 1024 }), null);
  assert.match(validateChatUploadFile({ name: 'large.gif', size: 50 * 1024 * 1024 + 1 }), /50MB/);
  assert.match(validateChatUploadFile({ name: 'program.exe', size: 1 }), /不支持/);
});
test('debug explains missing required defaults without rejecting false, zero or optional variables', () => {
  const value = config();
  value.dialogue.inputVariables.push({ ...variable('customer'), required: true });
  assert.match(c.getChatDebugInputError(value), /customer/);
  value.dialogue.inputVariables[1].defaultValue = 'Bob';
  value.dialogue.inputVariables.push({ ...variable('count', 'number'), required: true, defaultValue: '0' },
    { ...variable('flag', 'boolean'), required: true, defaultValue: 'false' });
  assert.equal(c.getChatDebugInputError(value), null);
});
