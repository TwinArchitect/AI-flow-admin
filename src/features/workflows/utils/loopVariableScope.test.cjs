const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const scope = require('./loopVariableScope.ts');
const loop = require('../contracts/loopNodeContract.ts');
const refs = require('./variableRefs.ts');
const start = require('../contracts/startNodeContract.ts');
const execution = require('./workflowNodeExecution.ts');
function load(file, dependencies) {
  const loaded = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname + '/' + file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports: loaded, require: (path) => {
    const key = path.split('/').pop();
    if (!(key in dependencies)) throw new Error(`Unexpected dependency ${path}`);
    return dependencies[key];
  } });
  return loaded;
}
// Contract/schema seam avoids importing React registry components into Node tests.
const moduleFor = (type) => ({
  backendRunnable: true,
  getOutputs: (node) => type === 'loop' ? loop.loopOutputs() : type === 'reply' ? [] : node.data.outputs ?? [],
  getReferences: (node) => type === 'loop' ? loop.getLoopReferences(node) : node.data.references ?? [],
  validate: (node) => type === 'loop' ? loop.validateLoopNode(node) : [],
});
const deps = { loopVariableScope: scope, variableRefs: refs, startNodeContract: start, loopNodeContract: loop,
  registry: { getNodeModule: moduleFor, getNodeConnectionRules: () => ({ allowIncoming: true, allowOutgoing: true, deletable: true }) } };
const picker = load('availableVariables.ts', deps);
const validator = load('workflowValidation.ts', deps);
const n = (id, type, parentId, outputs = [], config = {}) => ({ id, parentId, position: { x: 0, y: 0 }, data: { nodeType: type, label: id, config, outputs } });
const out = (key, valueType = 'string') => ({ key, label: key, valueType });
function graph() {
  const nodes = [n('start', 'start', undefined, [out('userChatInput')], { variables: [] }), n('source', 'code', undefined, [out('items', 'arrayNumber'), out('text')]),
    n('loop1', 'loop', undefined, [], { loopRunInputArray: '{{source.items}}', loopOutputSource: '{{reply1.text}}' }),
    n('entry1', 'loopStart', 'loop1', [out('currentIndex', 'number')]), n('body1', 'code', 'loop1', [out('value'), out('items', 'array')]), n('reply1', 'reply', 'loop1'),
    n('loop2', 'loop', undefined, [], { loopRunInputArray: '{{source.items}}', loopOutputSource: '{{body2.value}}' }), n('entry2', 'loopStart', 'loop2'), n('body2', 'code', 'loop2', [out('value')]), n('end', 'end')];
  const pairs = [['start', 'source'], ['source', 'loop1'], ['loop1', 'loop2'], ['loop2', 'end'], ['entry1', 'body1'], ['body1', 'reply1'], ['entry2', 'body2']];
  return { nodes, edges: pairs.map(([source, target]) => ({ id: source + '-' + target, source, target })) };
}
test('loop body sees same-layer and parent upstream, excludes parent/sibling body/non-upstream', () => {
  const { nodes, edges } = graph();
  const visible = scope.getVariableUpstreamNodes('reply1', nodes, edges).map((node) => node.id);
  assert.ok(visible.includes('body1') && visible.includes('source') && visible.includes('start'));
  assert.ok(!visible.includes('loop1') && !visible.includes('body2') && !visible.includes('loop2'));
});
test('reply text is available only as the containing loop collection source', () => {
  const { nodes, edges } = graph();
  const collection = picker.getAvailableVariablesForNode('loop1', nodes, edges);
  assert.ok(collection.some((item) => item.ref === '{{reply1.text}}' && item.scope === 'loopChild'));
  assert.ok(!collection.some((item) => item.nodeId === 'body2'));
  assert.ok(!picker.getAvailableVariablesForNode('end', nodes, edges).some((item) => item.nodeId === 'reply1'));
  assert.equal(picker.resolveNodeOutputs(nodes.find((node) => node.id === 'reply1')).length, 0);
  assert.equal(validator.validateWorkflowForBackend(nodes, edges).length, 0);
});
test('validation rejects sibling body and collection-only reply outputs in ordinary references', () => {
  const { nodes, edges } = graph();
  nodes.find((node) => node.id === 'body1').data.references = [{ value: '{{body2.value}}', context: 'sibling' }];
  nodes.find((node) => node.id === 'reply1').data.references = [{ value: '{{loop1.results}}', context: 'unfinished-parent' }];
  const errors = validator.validateWorkflowForBackend(nodes, edges);
  assert.ok(errors.some((error) => error.includes('sibling')));
  assert.ok(errors.some((error) => error.includes('unfinished-parent')));
});
test('collection child permission never leaks into array input; legacy outputs get actionable errors', () => {
  const { nodes, edges } = graph();
  nodes.find((node) => node.id === 'loop1').data.config.loopRunInputArray = '{{body1.items}}';
  nodes.find((node) => node.id === 'end').data.references = [{ value: '{{loop1.oldScalar}}', context: 'legacy' }];
  const errors = validator.validateWorkflowForBackend(nodes, edges);
  assert.ok(errors.some((error) => error.includes('循环数组')));
  assert.ok(errors.some((error) => error.includes('oldScalar') && error.includes('results') && error.includes('字符串数组')));
});
test('deleting a loop includes all descendants without traversing unrelated branches', () => {
  const removed = scope.collectNodesRemovedWithDescendants([{ id: 'loop' }, { id: 'inner', parentId: 'loop' }, { id: 'leaf', parentId: 'inner' }, { id: 'other' }], ['loop']);
  assert.deepEqual([...removed].sort(), ['inner', 'leaf', 'loop']);
});
test('node_started resets per-iteration samples, flow-io preserves running, failed event wins over code', () => {
  const payload = { nodeId: 'body', flowNodeType: 'code', statusCode: 0 };
  let states = execution.applyWorkflowNodeSseEvent({ body: { status: 'success', debugOutputs: { old: 1 } } }, 'node_started', payload);
  assert.equal(states.body.status, 'running'); assert.equal(states.body.debugOutputs, undefined);
  states = execution.applyWorkflowNodeSseEvent(states, 'flow-io', { ...payload, inputs: { a: 1 } });
  assert.equal(states.body.status, 'running'); assert.equal(states.body.debugInputs.a, 1);
  states = execution.applyWorkflowNodeSseEvent(states, 'node_failed', { ...payload, statusCode: 200, log: 'failed' });
  assert.equal(states.body.status, 'error');
});
test('finished/interrupted flows settle running nodes without erasing completed samples', () => {
  const states = { running: { status: 'running' }, done: { status: 'success', debugOutputs: { value: 1 } } };
  assert.equal(execution.settleWorkflowNodeStates(states, ['running', 'done'], 'success').running.status, 'error');
  assert.equal(execution.settleWorkflowNodeStates(states, ['running', 'done'], 'cancelled').running.status, 'cancelled');
  assert.equal(execution.settleWorkflowNodeStates(states, ['running', 'done'], 'success').done.debugOutputs.value, 1);
});
