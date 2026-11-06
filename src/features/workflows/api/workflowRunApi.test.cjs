const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadApi(response, onRequest = () => {}) {
  const exported = {};
  const script = ts.transpileModule(fs.readFileSync(__dirname + '/workflowRunApi.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(script, { exports: exported, Headers, TextDecoder,
    require: (path) => path.includes('authSession') ? { authFetch: async (...args) => { onRequest(...args); return response; } }
      : { parseSseToConversationDeltas: () => [] },
  });
  return exported;
}
const finished = (status, error) => `event: workflow_finished\ndata: ${JSON.stringify({ event: 'workflow_finished', data: { status, outputs: { answer: 'OK' }, error } })}\n\n`;
const request = { appId: 'acceptance', message: [{ role: 'user', content: 'test' }] };

test('square conversations send the snapshot flag together with their agent and group IDs', async () => {
  let body;
  const response = new Response(finished('succeeded'));
  await loadApi(response, (_url, options) => { body = JSON.parse(options.body); }).runWorkflowStream({
    request: { ...request, fromSquare: true, chatGroupId: 'square-group' }, onNodeEvent() {},
  });
  assert.equal(body.fromSquare, true);
  assert.equal(body.appId, 'acceptance');
  assert.equal(body.chatGroupId, 'square-group');
});

test('terminal event completes and cancels an SSE stream that never closes', async () => {
  let cancelled = false;
  const response = new Response(new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode(finished('succeeded'))); },
    cancel() { cancelled = true; },
  }));
  let timer;
  try {
    const result = await Promise.race([
      loadApi(response).runWorkflowStream({ request, onNodeEvent() {} }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('waited for EOF after terminal event')), 1000); }),
    ]);
    assert.equal(result.outputs.answer, 'OK');
    assert.equal(cancelled, true);
  } finally { clearTimeout(timer); }
});
test('failed terminal event exposes the server error without waiting for EOF', async () => {
  const response = new Response(new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode(finished('failed', '输入变量不能为空: customer'))); },
  }));
  await assert.rejects(loadApi(response).runWorkflowStream({ request, onNodeEvent() {} }), /输入变量不能为空: customer/);
});
test('a connection ending without a terminal event remains an error', async () => {
  const response = new Response('event: heartbeat\ndata: {}\n\n');
  await assert.rejects(loadApi(response).runWorkflowStream({ request, onNodeEvent() {} }), /未收到 workflow_finished/);
});
test('a terminal event split across network chunks still releases the stream once', async () => {
  const encoded = new TextEncoder().encode(finished('succeeded'));
  let events = 0;
  const response = new Response(new ReadableStream({ start(controller) {
    for (const [start, end] of [[0, 9], [9, 25], [25, encoded.length - 1], [encoded.length - 1, encoded.length]]) {
      controller.enqueue(encoded.slice(start, end));
    }
  } }));
  const result = await loadApi(response).runWorkflowStream({ request, onNodeEvent() {}, onWorkflowFinished() { events++; } });
  assert.equal(result.outputs.answer, 'OK');
  assert.equal(events, 1);
});
test('message-wrapped terminal events and CRLF separators preserve final outputs', async () => {
  const body = `event: message\r\ndata: ${JSON.stringify({ event: 'workflow_finished', data: { status: 'succeeded', outputs: { answer: '最终结果' } } })}\r\n\r\n`;
  const response = new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(body)); } }));
  const result = await loadApi(response).runWorkflowStream({ request, onNodeEvent() {} });
  assert.equal(result.outputs.answer, '最终结果');
});
