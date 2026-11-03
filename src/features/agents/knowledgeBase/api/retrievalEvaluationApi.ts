import { http } from '@/api/client';
import type { RetrievalEvaluationCase, RetrievalEvaluationRun } from '../types';
const BASE = '/gpt/kb/retrieval/evaluations';

export function saveRetrievalEvaluationCase(payload: { datasetId: string; name?: string; question: string; expectedDocumentIds?: string[]; expectedChunkIds?: string[]; topK?: number }) {
  return http.post<RetrievalEvaluationCase>(BASE, payload).then((response) => response.data);
}
export function listRetrievalEvaluationCases(datasetId: string) {
  return http.get<RetrievalEvaluationCase[]>(`${BASE}/${encodeURIComponent(datasetId)}`).then((response) => response.data);
}
export function runRetrievalEvaluations(datasetId: string) {
  return http.post<RetrievalEvaluationRun>(`${BASE}/run/${encodeURIComponent(datasetId)}`).then((response) => response.data);
}
export function deleteRetrievalEvaluationCase(id: string) {
  return http.delete<void>(`${BASE}/${encodeURIComponent(id)}`).then((response) => response.data);
}
