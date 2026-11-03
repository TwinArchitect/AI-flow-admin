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
  modelId?: string;
  baseUrl?: string;
  apiPath?: string;
}

export interface KbModelConfig {
  id?: string;
  tenantId?: string;
  embeddingModelId?: string;
  rerankModelId?: string;
  llmModelId?: string;
  taggingModelId?: string;
  vlmModelId?: string;
  ocrModelId?: string;
  parserModelId?: string;
  embeddingModel?: KbModelBinding;
  rerankModel?: KbModelBinding;
  llmModel?: KbModelBinding;
  taggingModel?: KbModelBinding;
  vlmModel?: KbModelBinding;
  ocrModel?: KbModelBinding;
  parserModel?: KbModelBinding;
  configured?: boolean;
}

export type KbModelConfigSave = Pick<
  KbModelConfig,
  'id' | 'taggingModelId' | 'embeddingModelId' | 'rerankModelId' | 'llmModelId' | 'vlmModelId' | 'ocrModelId' | 'parserModelId'
>;

export type DatasetStatus = 'ACTIVE' | 'DISABLED';
export type ParserType = 'native' | 'ocr' | 'mineru' | 'remote';
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
  autoTagEnabled?: boolean;
  documentKnowledgeTagEnabled?: boolean;
  documentSummaryEnabled?: boolean;
  documentSummaryMaxChars?: number;
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
  | 'TAGGING'
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
  knowledgeTags?: string[];
  knowledgeSummary?: string | null;
  enrichmentStatus?: string | null;
}

export interface DocumentEnrichment {
  documentId: string;
  datasetId?: string;
  aiSummary?: string | null;
  manualSummary?: string | null;
  effectiveSummary?: string | null;
  aiTags?: string[];
  manualAddedTags?: string[];
  suppressedAiTags?: string[];
  effectiveTags?: string[];
  status?: string | null;
  contentVersion?: string | number | null;
  modelId?: string | null;
  generatedAt?: string | null;
  errorMessage?: string | null;
}

export interface DocumentEnrichmentUpdate {
  manualSummary?: string | null;
  manualAddedTags?: string[];
  suppressedAiTags?: string[];
}

export interface DocumentListItem extends KnowledgeDocument {
  chunkCount?: number;
  metadata?: Record<string, unknown> | string | null;
  metaData?: unknown;
  meta_data?: unknown;
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
  assetType?: MediaAssetType;
  pageNum?: number;
  bbox?: MediaAssetBbox;
  structureContent?: MediaAssetStructureContent;
  structurePath?: string;
  source?: string;
  confidence?: number;
  tags?: string[];
}

export type MediaAssetType = 'IMAGE' | 'TABLE' | 'FORMULA' | 'SEAL' | 'SIGNATURE';
export type MediaAssetBbox = Record<string, unknown> | number[] | string;
export type MediaAssetStructureContent = Record<string, unknown> | unknown[] | string;
export interface DocumentElementList { total: number; records: MediaAsset[] }

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
  dense_candidate_k?: number;
  keyword_candidate_k?: number;
  fusion_candidate_k?: number;
  rerank_candidate_k?: number;
  trace?: boolean;
  tag_match?: 'all' | 'any';
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
  fusion_similarity?: number;
  rerank_similarity?: number;
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
  trace?: RetrievalTrace;
}

export interface RetrievalTrace {
  duration_ms: number;
  dense_candidate_k: number;
  keyword_candidate_k: number;
  fusion_candidate_k: number;
  rerank_candidate_k: number;
  dense_hits: number;
  keyword_hits: number;
  fusion_hits: number;
  after_threshold_hits: number;
  rerank_applied: boolean;
  rerank_reason?: string;
  returned_hits: number;
  warnings?: string[];
  tag_match?: 'all' | 'any';
  metadata_logic?: 'and' | 'or';
}
export interface RetrievalEvaluationCase {
  id: string;
  dataset_id: string;
  name: string;
  question: string;
  expected_document_ids: string[];
  expected_chunk_ids: string[];
  top_k: number;
  enabled: boolean;
}
export interface RetrievalEvaluationRun { case_count: number; hit_at_k: number; mrr: number }

export interface MineruProbeResult {
  compatible: boolean; summary?: string; baseUrl?: string; accessMode?: string; protocol?: string; checks?: string[]; diagnostics?: string[];
}
