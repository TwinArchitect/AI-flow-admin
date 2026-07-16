import type { ModelType, ModelVendor } from './types';

export const MODEL_TYPE_LABELS: Record<ModelType, string> = {
  llm: '大语言模型',
  multimodal: '多模态',
};

export const VENDOR_LABELS: Record<ModelVendor, string> = {
  openai: 'OpenAI 兼容',
  dify: 'Dify',
  ollama: 'Ollama',
};

export function modelTypeLabel(type?: string) {
  if (type === 'llm' || type === 'multimodal') return MODEL_TYPE_LABELS[type];
  return type || '-';
}

export function vendorLabel(vendor?: string) {
  if (vendor === 'openai' || vendor === 'dify' || vendor === 'ollama') return VENDOR_LABELS[vendor];
  return vendor || '-';
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
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return '扩展参数须为 JSON 对象';
    }
    return null;
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
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '调用地址须为 http/https URL';
    }
    return null;
  } catch {
    return '调用地址格式不正确';
  }
}
