import type { AgentOpenModel, ModelCategory, ModelType, ModelVendor } from './types';

export const ALL_MODEL_CATEGORIES: ModelCategory[] = ['llm', 'multimodal', 'embedding', 'rerank', 'ocr', 'parser'];

export const MODEL_CATEGORY_DEFAULT_API_PATH: Record<ModelCategory, string> = {
  llm: '/v1/chat/completions',
  multimodal: '/v1/chat/completions',
  embedding: '/v1/embeddings',
  rerank: '/v1/rerank',
  ocr: '/v1/ocr/extract',
  parser: '/v1/parse/jobs',
};

const MODEL_ENDPOINT_KNOWN_API_PATHS = [...new Set([...Object.values(MODEL_CATEGORY_DEFAULT_API_PATH), '/file_parse'])];

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
  dashscope: '阿里百炼 DashScope',
  deepseek: 'DeepSeek',
  vllm: 'vLLM / 自建 OpenAI 兼容',
  mineru: 'MinerU',
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
  if (category === 'ocr') return 'deepdoc';
  if (category === 'parser') return 'mineru';
  return 'openai';
}

export function resolveVendorForCategory(category: ModelCategory, vendor?: string): ModelVendor {
  const options = vendorsForCategory(category);
  if (vendor && options.includes(vendor as ModelVendor)) {
    return vendor as ModelVendor;
  }
  return defaultVendorForCategory(category);
}

export function vendorsForCategory(category: ModelCategory): ModelVendor[] {
  if (category === 'ocr') return ['deepdoc', 'mineru_http'];
  if (category === 'parser') return ['mineru'];
  return ['openai', 'dashscope', 'deepseek', 'vllm', 'dify', 'ollama'];
}

export function modelAddressDisplay(model: AgentOpenModel) {
  const base = model.baseUrl?.trim();
  const path = model.apiPath?.trim();
  if (base && path) return joinModelEndpoint(base, path);
  return model.url?.trim() || base || '-';
}

export type ModelEndpoint = {
  baseUrl: string;
  apiPath: string;
};

/** Base URL + API Path 是模型端点的唯一编辑形态。 */
export function joinModelEndpoint(baseUrl: string, apiPath: string) {
  const base = baseUrl.trim().replace(/\/+$/, '');
  const path = apiPath.trim();
  if (!base) return path;
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * 将旧的完整调用地址拆成可编辑的 Base URL + API Path。
 * 优先识别平台默认路径；非标准路径退化为将最后一个路径段视为 API Path，确保最终地址不变。
 */
export function splitLegacyModelUrl(url: string, fallbackApiPath: string): ModelEndpoint {
  const raw = url.trim();
  if (!raw) return { baseUrl: '', apiPath: fallbackApiPath };
  try {
    const parsed = new URL(raw);
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    const knownPaths = [...MODEL_ENDPOINT_KNOWN_API_PATHS]
      .sort((a, b) => b.length - a.length);
    const apiPath = knownPaths.find((path) => pathname.endsWith(path));
    if (apiPath) {
      const prefix = pathname.slice(0, -apiPath.length);
      return { baseUrl: `${parsed.origin}${prefix}`.replace(/\/$/, ''), apiPath };
    }
    const lastSlash = pathname.lastIndexOf('/');
    if (lastSlash > 0 && lastSlash < pathname.length - 1) {
      return {
        baseUrl: `${parsed.origin}${pathname.slice(0, lastSlash)}`,
        apiPath: pathname.slice(lastSlash)
      };
    }
  } catch {
    // 下方返回空 Base URL，由表单校验提示用户补齐。
  }
  return { baseUrl: '', apiPath: fallbackApiPath };
}

/** 优先使用结构化地址；兼容尚未迁移的完整 URL 存量配置。 */
export function resolveModelEndpoint(model: AgentOpenModel): ModelEndpoint {
  const fallbackApiPath = MODEL_CATEGORY_DEFAULT_API_PATH[resolveModelCategory(model)];
  if (model.baseUrl?.trim()) {
    const baseUrl = model.baseUrl.trim();
    const apiPath = model.apiPath?.trim() || fallbackApiPath;
    const basePath = (() => {
      try {
        return new URL(baseUrl).pathname.replace(/\/+$/, '');
      } catch {
        return '';
      }
    })();
    // 兼容旧配置误将完整调用地址填入 Base URL 的情况。
    if (MODEL_ENDPOINT_KNOWN_API_PATHS.some((path) => basePath.endsWith(path))) {
      return splitLegacyModelUrl(baseUrl, apiPath);
    }
    // 兼容旧配置中 Base URL 与 API Path 同时携带 /v1 的情况。
    if (basePath.endsWith('/v1') && apiPath.startsWith('/v1/')) {
      return { baseUrl: baseUrl.replace(/\/v1\/?$/, ''), apiPath };
    }
    return {
      baseUrl,
      apiPath
    };
  }
  return splitLegacyModelUrl(model.url || '', fallbackApiPath);
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

export function validateBaseUrl(baseUrl?: string) {
  if (!baseUrl?.trim()) return 'Base URL 不能为空';
  try {
    const parsed = new URL(baseUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'Base URL 须为 http/https';
    }
    const path = parsed.pathname.replace(/\/+$/, '');
    if (MODEL_ENDPOINT_KNOWN_API_PATHS.some((apiPath) => path.endsWith(apiPath))) {
      return 'Base URL 不应包含 API Path，请将路径填写到 API Path 字段';
    }
    return null;
  } catch {
    return 'Base URL 格式不正确';
  }
}

export function validateApiPath(apiPath?: string) {
  const path = apiPath?.trim();
  if (!path) return 'API Path 不能为空';
  if (!path.startsWith('/')) return 'API Path 须以 / 开头';
  if (/^https?:\/\//i.test(path) || path.includes('?') || path.includes('#')) {
    return 'API Path 仅填写路径，不包含域名、查询参数或片段';
  }
  return null;
}

export function validateModelEndpoint(baseUrl?: string, apiPath?: string) {
  const baseError = validateBaseUrl(baseUrl);
  if (baseError) return baseError;
  const pathError = validateApiPath(apiPath);
  if (pathError) return pathError;
  try {
    const basePath = new URL(baseUrl!.trim()).pathname.replace(/\/+$/, '');
    if (basePath.endsWith('/v1') && apiPath!.trim().startsWith('/v1/')) {
      return 'Base URL 已包含 /v1，API Path 不能再次以 /v1 开头';
    }
  } catch {
    // validateBaseUrl 已处理格式错误。
  }
  return null;
}

