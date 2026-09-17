import type { ChunkQuery, DatasetPageQuery, RetrievalRequest } from '../types';
import type { DocumentPageQuery } from '../api/documentApi';

export const knowledgeBaseKeys = {
  all: ['knowledge-base'] as const,
  modelConfig: () => [...knowledgeBaseKeys.all, 'model-config'] as const,
  modelOptions: (category: string) => [...knowledgeBaseKeys.all, 'model-options', category] as const,
  datasets: () => [...knowledgeBaseKeys.all, 'datasets'] as const,
  datasetList: (params: DatasetPageQuery) => [...knowledgeBaseKeys.datasets(), 'list', params] as const,
  datasetDetail: (datasetId: string) => [...knowledgeBaseKeys.datasets(), 'detail', datasetId] as const,
  datasetStats: (datasetId: string) => [...knowledgeBaseKeys.datasets(), 'stats', datasetId] as const,
  documents: (datasetId: string) => [...knowledgeBaseKeys.all, 'documents', datasetId] as const,
  documentList: (datasetId: string, params: DocumentPageQuery) => [
    ...knowledgeBaseKeys.documents(datasetId), 'list', params,
  ] as const,
  documentDetail: (documentId: string) => [...knowledgeBaseKeys.all, 'document', documentId] as const,
  documentProgress: (documentId: string) => [
    ...knowledgeBaseKeys.documentDetail(documentId), 'progress',
  ] as const,
  chunks: (params: ChunkQuery) => [...knowledgeBaseKeys.all, 'chunks', params] as const,
  retrieval: (payload: RetrievalRequest) => [...knowledgeBaseKeys.all, 'retrieval', payload] as const,
};
