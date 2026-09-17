export type ModelCategory = 'llm' | 'multimodal' | 'embedding' | 'rerank' | 'ocr' | 'parser';
export type ModelType = 'llm' | 'multimodal';
export type ModelVendor = 'openai' | 'dify' | 'ollama' | 'deepdoc' | 'mineru_http';

export type AgentOpenModel = {
  id: string;
  model: string;
  name?: string;
  url?: string;
  baseUrl?: string;
  apiPath?: string;
  dimension?: number;
  params?: string;
  type?: ModelType;
  category?: ModelCategory;
  vendor?: ModelVendor;
  status?: number;
  isDefault?: number;
  authToken?: string;
  remark?: string;
  tenantId?: string;
  creator?: string;
  createTime?: string;
};

export type ModelCategoryItem = {
  code: ModelCategory;
  label: string;
  defaultApiPath: string;
  count: number;
};

export type ModelCategoriesResult = {
  total: number;
  categories: ModelCategoryItem[];
};

export type ModelQuery = {
  pageNum: number;
  pageSize: number;
  model?: string;
  category?: ModelCategory;
  type?: ModelType;
  status?: number;
};

export type ModelSavePayload = {
  id?: string;
  model: string;
  name?: string;
  url?: string;
  baseUrl?: string;
  apiPath?: string;
  dimension?: number;
  type?: ModelType;
  category?: ModelCategory;
  vendor?: ModelVendor;
  status?: number;
  isDefault?: number;
  authToken?: string;
  remark?: string;
  params?: string;
};

export type ModelDebugPayload = {
  id: string;
  prompt?: string;
  text?: string;
  query?: string;
  documents?: string[];
  imageBase64?: string;
  timeoutSeconds?: number;
};

export type ModelDebugResult = {
  success: boolean;
  httpStatus?: number;
  costMs?: number;
  requestUrl?: string;
  content?: string;
  reasoningContent?: string;
  responseBody?: string;
  errorMessage?: string;
};
