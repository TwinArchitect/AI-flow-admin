import type { AgentOpenModel, ModelCategory, ModelType, ModelVendor } from './types';

export const ALL_MODEL_CATEGORIES: ModelCategory[] = ['llm', 'multimodal', 'embedding', 'rerank', 'ocr', 'parser'];

export const MODEL_CATEGORY_DEFAULT_API_PATH: Record<ModelCategory, string> = {
  llm: '/v1/chat/completions',
  multimodal: '/v1/chat/completions',
  embedding: '/v1/embeddings',
  rerank: '/v1/rerank',
  ocr: '/v1/ocr/extract',
  parser: '/v1/parser/parse',
};

export const MODEL_CATEGORY_LABELS: Record<ModelCategory, string> = {
  llm: '大语言模型',
  multimodal: '多模态模型',
  embedding: '向量模型',
  rerank: '重排模型',
  ocr: 'OCR 模型',
  parser: '解析模型',
};

export const VENDOR_LABELS: Record<ModelVendor, string> = {
  openai: 'OpenAI 兼容',
  dify: 'Dify',
  ollama: 'Ollama',
  deepdoc: 'DeepDoc',
  mineru_http: 'MinerU HTTP',
};

export function modelCategoryLabel(category?: string) {
  return category && category in MODEL_CATEGORY_LABELS
    ? MODEL_CATEGORY_LABELS[category as ModelCategory]
    : category || '-';
}

export function resolveModelCategory(model: AgentOpenModel): ModelCategory {
  if (model.category && ALL_MODEL_CATEGORIES.includes(model.category)) return model.category;
  return model.type === 'multimodal' ? 'multimodal' : 'llm';
}

export function syncTypeFromCategory(category: ModelCategory): ModelType | undefined {
  return category === 'llm' || category === 'multimodal' ? category : undefined;
}

export function categoryRequiresModel(category: ModelCategory) {
  return ['llm', 'multimodal', 'embedding', 'rerank'].includes(category);
}

export function categoryPrefersBaseUrl(category: ModelCategory) {
  return category !== 'llm' && category !== 'multimodal';
}

export function defaultVendorForCategory(category: ModelCategory): ModelVendor {
  return category === 'ocr' ? 'deepdoc' : 'openai';
}

export function vendorsForCategory(category: ModelCategory): ModelVendor[] {
  return category === 'ocr' ? ['deepdoc', 'mineru_http'] : ['openai', 'dify', 'ollama'];
}

export function modelAddressDisplay(model: AgentOpenModel) {
  if (model.url?.trim()) return model.url.trim();
  const base = model.baseUrl?.trim();
  const path = model.apiPath?.trim();
  if (base && path) return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  return base || '-';
}

export function vendorLabel(vendor?: string) {
  return vendor && vendor in VENDOR_LABELS ? VENDOR_LABELS[vendor as ModelVendor] : vendor || '-';
}

export function isModelActive(status?: number) {
  return status === 0 || status === undefined;
}

export function maskAuthToken(token?: string) {
  if (!token) return '';
  if (token.length <= 8) return '****';
  return `${token.slice(0, 3)}****${token.slice(-4)}`;
}

export function validateParamsJson(params?: string) {
  if (!params?.trim()) return null;
  try {
    const parsed = JSON.parse(params);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? null
      : '扩展参数须为 JSON 对象';
  } catch {
    return '扩展参数 JSON 格式不正确';
  }
}

export function formatParamsForEdit(params?: string) {
  if (!params?.trim()) return '';
  try {
    return JSON.stringify(JSON.parse(params), null, 2);
  } catch {
    return params;
  }
}

export function validateUrl(url?: string) {
  if (!url?.trim()) return '调用地址不能为空';
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? null
      : '调用地址须为 http/https URL';
  } catch {
    return '调用地址格式不正确';
  }
}
