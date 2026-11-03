const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function compile(path, dependencies = {}) {
  const result = {};
  const source = ts.transpileModule(fs.readFileSync(require.resolve(path), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'exports', source)((key) => { if (!(key in dependencies)) throw new Error(key); return dependencies[key]; }, result);
  return result;
}
const { normalizeRetrievalChunk } = compile('./retrievalContracts.ts');
test('score normalization prefers snake case including zero and retains other fields', () => {
  const value = normalizeRetrievalChunk({ id: 'c', vector_similarity: 0, vectorSimilarity: .8, fusionSimilarity: .6, content: 'text' });
  assert.equal(value.vector_similarity, 0); assert.equal(value.fusion_similarity, .6); assert.equal(value.content, 'text');
});
test('non-finite scores fall back to camel case without coercing strings', () => {
  const value = normalizeRetrievalChunk({ term_similarity: NaN, termSimilarity: .4, rerank_similarity: Infinity, rerankSimilarity: '0.8' });
  assert.equal(value.term_similarity, .4); assert.equal(value.rerank_similarity, undefined);
});
test('evaluation persists reference camelCase payload and uses encoded dataset route', async () => {
  const calls = [];
  const http = { post: async (...args) => { calls.push(args); return { data: { case_count: 1, hit_at_k: 1, mrr: 1 } }; } };
  const service = compile('./api/retrievalEvaluationApi.ts', { '@/api/client': { http } });
  const payload = { datasetId: 'kb', question: 'question', expectedDocumentIds: ['doc'], expectedChunkIds: ['chunk'], topK: 10 };
  await service.saveRetrievalEvaluationCase(payload);
  assert.deepEqual(calls[0], ['/gpt/kb/retrieval/evaluations', payload]);
  assert.equal((await service.runRetrievalEvaluations('kb/id')).mrr, 1);
  assert.equal(calls[1][0], '/gpt/kb/retrieval/evaluations/run/kb%2Fid');
});
