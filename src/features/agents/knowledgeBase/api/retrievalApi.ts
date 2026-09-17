import { http } from '@/api/client';
import type { RetrievalRequest, RetrievalResult } from '../types';

export function searchKnowledgeBase(payload: RetrievalRequest) {
  return http.post<RetrievalResult>('/gpt/kb/retrieval', payload)
    .then((response) => response.data);
}
