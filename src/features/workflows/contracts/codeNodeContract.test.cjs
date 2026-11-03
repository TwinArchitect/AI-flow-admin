const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const c = require('./codeNodeContract.ts');
const { normalizeCodeSource } = require('../utils/normalizeCodeSource.ts');
const { sanitizePastedText } = require('../utils/sanitizePastedText.ts');
const { highlightCode } = require('../utils/codeSyntaxHighlight.ts');
const node = config => ({ id: 'code', position: { x: 1, y: 2 }, data: { label: '代码', config: { ...c.createDefaultCodeConfig(), ...config } } });

test('preserves JavaScript comments and Python literal escapes', () => {
  const js = 'var x = 1; // return x;';
  const py = 'def main():\n    return "a\\nb\\nc"';
  assert.equal(normalizeCodeSource(js), js);
  assert.equal(normalizeCodeSource(py, 'py'), py);
});
test('round trips source, ordered references, extraction aliases, types and error handling', () => {
  const value = node({ code: 'return { total: arg0 };', catchError: true, inputVariables: [{ id: 'in', key: 'data', label: 'data', value: '{{start.number}}', required: true, valueType: 'number' }], outputVariables: [{ id: 'out', key: 'sum', label: '$.total', valueType: 'number' }] });
  const module = c.serializeCodeNode(value);
  assert.equal(module.outputs.find(v => v.id === 'out').key, 'total');
  assert.equal(module.outputs.find(v => v.id === 'out').label, 'sum');
  const restored = c.parseCodeModule(module);
  assert.equal(restored.data.config.code, value.data.config.code);
  assert.equal(restored.data.config.catchError, true);
  assert.equal(restored.data.config.inputVariables[0].value, '{{start.number}}');
  assert.deepEqual(restored.data.config.outputVariables, [{ id: 'out', key: 'sum', label: 'total', valueType: 'number' }]);
  assert.deepEqual(c.validateCodeNode(restored), []);
  assert.equal(c.getCodeReferences(restored)[0].value, '{{start.number}}');
});
test('restores Python aliases, inferred inputs and historical output types', () => {
  for (const language of ['py', 'python', 'python3']) {
    const restored = c.parseCodeModule({ nodeId: 'code', name: '代码', position: { x: 0, y: 0 }, inputs: [{ key: 'codeType', value: language }, { key: 'code', value: 'def main(first, second):\n    return {}' }], outputs: [{ key: 'data.id', label: 'id', type: 'static' }, { key: 'legacy' }, { key: 'out_value', type: 'dynamic' }] });
    assert.equal(restored.data.config.codeType, 'py');
    assert.deepEqual(restored.data.config.inputVariables.map(v => v.key), ['first', 'second']);
    assert.deepEqual(restored.data.config.outputVariables.map(v => v.key), ['id', 'legacy']);
  }
});
test('sanitizes rich text paste and escapes markup before highlighting', () => {
  assert.equal(sanitizePastedText('“a”\u00a0\u200b'), '"a" ');
  assert.ok(!highlightCode('<script>alert(1)</script>', 'js').includes('<script>'));
});
