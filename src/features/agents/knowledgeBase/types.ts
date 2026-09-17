export interface KbPageResult<T> {
  total: number;
  page: number;
  size: number;
  records: T[];
}

export interface BaseEntity {
  id: string;
  tenantId?: string;
  creator?: string;
  createTime?: string;
}

export type KbModelCategory = 'embedding' | 'rerank' | 'llm' | 'multimodal' | 'ocr' | 'parser';

export interface KbModelOption {
  id: string;
  name?: string;
  model?: string;
  category?: KbModelCategory;
  vendor?: string;
  dimension?: number;
  status?: number;
}

export interface KbModelBinding extends KbModelOption {
  baseUrl?: string;
  apiPath?: string;
}

export interface KbModelConfig {
  id?: string;
  tenantId?: string;
  embeddingModelId?: string;
  rerankModelId?: string;
  llmModelId?: string;
  vlmModelId?: string;
  ocrModelId?: string;
  parserModelId?: string;
  embeddingModel?: KbModelBinding;
  rerankModel?: KbModelBinding;
  llmModel?: KbModelBinding;
  vlmModel?: KbModelBinding;
  ocrModel?: KbModelBinding;
  parserModel?: KbModelBinding;
  configured?: boolean;
}

export type KbModelConfigSave = Pick<
  KbModelConfig,
  'id' | 'embeddingModelId' | 'rerankModelId' | 'llmModelId' | 'vlmModelId' | 'ocrModelId' | 'parserModelId'
>;

export type DatasetStatus = 'ACTIVE' | 'DISABLED';
export type ParserType = 'native' | 'ocr' | 'remote';
export type ChunkStrategyType =
  | 'naive'
  | 'one'
  | 'table'
  | 'qa'
  | 'book'
  | 'manual'
  | 'laws'
  | 'paper'
  | 'presentation'
  | 'picture'
  | 'email'
  | 'tag';

export interface KnowledgeDataset extends BaseEntity {
  name: string;
  treeId?: string | null;
  description?: string | null;
  embeddingModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  parserType?: ParserType;
  parserConfig?: string | null;
  chunkStrategy?: ChunkStrategyType;
  status?: DatasetStatus;
}

export interface DatasetListItem extends KnowledgeDataset {
  documentCount?: number;
  chunkCount?: number;
}

export interface DatasetPageQuery {
  name?: string;
  treeId?: string;
  status?: DatasetStatus;
  page?: number;
  size?: number;
}

export interface DatasetStats {
  datasetId: string;
  documentCount: number;
  chunkCount: number;
  readyDocumentCount: number;
  parsingDocumentCount: number;
}

export type DocumentStatus =
  | 'NEW'
  | 'UPLOADED'
  | 'PARSING'
  | 'PARSED'
  | 'CHUNKING'
  | 'EMBEDDING'
  | 'INDEXING'
  | 'READY'
  | 'FAILED'
  | 'CANCELLED';

export interface KnowledgeDocument extends BaseEntity {
  datasetId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath?: string;
  fileMd5?: string;
  status: DocumentStatus;
  currentVersion?: number;
  errorMessage?: string | null;
  progressPercent?: number;
  progressMessage?: string | null;
  searchEnabled?: boolean;
}

export interface DocumentListItem extends KnowledgeDocument {
  chunkCount?: number;
}

export interface DocumentDetail extends DocumentListItem {
  taskStatus?: string;
  retryCount?: number;
  taskError?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface DocumentProgress {
  documentId: string;
  status: DocumentStatus;
  progressPercent: number;
  progressMessage?: string | null;
  errorMessage?: string | null;
  taskStatus?: string;
  retryCount?: number;
  taskError?: string | null;
  chunkCount?: number;
}

export interface DocumentParseSubmit {
  documentId: string;
  taskIds: string[];
  skipped?: boolean;
  message?: string;
}

export type ChunkType = 'text' | 'image' | 'mixed';

export interface MediaAsset {
  assetId: string;
  mimeType?: string;
  width?: number;
  height?: number;
  previewUrl?: string;
  caption?: string;
  ocrText?: string;
}

export interface KnowledgeChunk extends BaseEntity {
  datasetId: string;
  documentId: string;
  nodeId?: string;
  documentVersion?: number;
  chunkType?: ChunkType;
  content: string;
  tokenSize?: number;
  chunkIndex?: number;
  pageStart?: number;
  pageEnd?: number;
  available?: boolean;
  tags?: string[];
  importantKeywords?: string[];
  questions?: string[];
  hasImage?: boolean;
  mediaAssets?: MediaAsset[];
}

export interface ChunkQuery {
  datasetId: string;
  documentId?: string;
  documentIds?: string[];
  keyword?: string;
  tag?: string;
  tags?: string[];
  available?: boolean;
  page?: number;
  size?: number;
}

export interface ChunkUpdate {
  content?: string;
  tags?: string[];
  importantKeywords?: string[];
  questions?: string[];
}

export interface RetrievalRequest {
  question: string;
  dataset_ids: string[];
  document_ids?: string[];
  page?: number;
  page_size?: number;
  top_k?: number;
  similarity_threshold?: number;
  vector_similarity_weight?: number;
  keyword?: boolean;
  highlight?: boolean;
  rerank_id?: string;
  rerank_enabled?: boolean;
  hybrid_enabled?: boolean;
  tags?: string[];
  question_expansion_enabled?: boolean;
  metadata_condition?: {
    logic?: string;
    conditions?: Array<{
      name: string;
      comparison_operator: string;
      value: string | number | boolean;
    }>;
  };
}

export interface RetrievalChunk {
  id: string;
  content: string;
  document_id: string;
  document_keyword?: string;
  kb_id: string;
  similarity: number;
  term_similarity?: number;
  vector_similarity?: number;
  highlight?: string | null;
  image_id?: string | null;
  important_keywords?: string[];
  tag_kwd?: string[];
  positions?: unknown[];
  url?: string | null;
  doc_type?: string | null;
  document_metadata?: unknown | null;
  page_start?: number;
  page_end?: number;
  questions?: string[];
  chunk_type?: ChunkType;
  media_assets?: MediaAsset[];
}

export interface RetrievalDocumentAggregation {
  doc_id: string;
  doc_name: string;
  count: number;
}

export interface RetrievalResult {
  chunks: RetrievalChunk[];
  doc_aggs: RetrievalDocumentAggregation[];
  total: number;
}
