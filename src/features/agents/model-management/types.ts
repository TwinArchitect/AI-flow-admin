export type ModelType = 'llm' | 'multimodal';
export type ModelVendor = 'openai' | 'dify' | 'ollama';

export type AgentOpenModel = {
  id: string;
  model: string;
  url: string;
  params?: string;
  type?: ModelType;
  vendor?: ModelVendor;
  status?: number;
  authToken?: string;
  remark?: string;
  tenantId?: string;
  creator?: string;
  createTime?: string;
};

export type ModelQuery = {
  pageNum: number;
  pageSize: number;
  model?: string;
  type?: ModelType;
  status?: number;
};

export type ModelSavePayload = {
  id?: string;
  model: string;
  url: string;
  type?: ModelType;
  vendor?: ModelVendor;
  status?: number;
  authToken?: string;
  remark?: string;
  params?: string;
};

export type ModelDebugPayload = {
  id: string;
  prompt?: string;
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
