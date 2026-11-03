import { http } from '@/api/client';
import type { AgentOpenSysAgent } from '@/types/agent';

export interface DifyImportReport {
  dslVersion?: string;
  appMode?: string;
  targetFlowType?: number;
  nodeTotal?: number;
  nodeMapped?: number;
  converted?: string[];
  warnings?: string[];
  skipped?: string[];
  pending?: { kind?: string; name?: string; detail?: string }[];
}
export interface DifyImportResult { agent?: AgentOpenSysAgent | null; report?: DifyImportReport | null }
export interface ImportDifyOptions { agentName?: string; modelId?: string }

export function buildImportDifyQuery(options?: ImportDifyOptions) {
  const params = new URLSearchParams();
  if (options?.agentName?.trim()) params.set('agentName', options.agentName.trim());
  if (options?.modelId?.trim()) params.set('modelId', options.modelId.trim());
  return params.size ? `?${params}` : '';
}
function submitDify(file: File, preview: boolean, options?: ImportDifyOptions) {
  const data = new FormData();
  data.append('file', file);
  return http.post<DifyImportResult>(`/gpt/base/agent/importDify${preview ? '/preview' : ''}${buildImportDifyQuery(options)}`, data,
    { timeout: 0, headers: { 'Content-Type': undefined } }).then((response) => response.data);
}
export const previewImportDify = (file: File, options?: Pick<ImportDifyOptions, 'modelId'>) => submitDify(file, true, options);
export const importDify = (file: File, options?: ImportDifyOptions) => submitDify(file, false, options);
export const isYamlDslFile = (file: Pick<File, 'name'>) => /\.(yml|yaml)$/i.test(file.name);

/** Recognize known platform signatures only; unknown YAML remains validated by the server. */
export function detectAgentDslFormat(content: string): 'platform' | 'dify' | 'unknown' {
  const text = content.replace(/^\uFEFF/, '').trim();
  try {
    const value = JSON.parse(text);
    if (value && typeof value === 'object') {
      if (value.kind === 'AgentConfig' || /^agent\.open\//.test(value.apiVersion ?? '')) return 'platform';
      if (value.kind === 'app' && value.app) return 'dify';
    }
  } catch { /* YAML is not necessarily JSON. */ }
  if (/^kind:\s*["']?AgentConfig["']?\s*(?:#.*)?$/m.test(text)
    || /^apiVersion:\s*["']?agent\.open\//m.test(text)) return 'platform';
  if (/^kind:\s*["']?app["']?\s*(?:#.*)?$/m.test(text) && /^app:\s*(?:#.*)?$/m.test(text)) return 'dify';
  return 'unknown';
}

export function dslFormatError(format: ReturnType<typeof detectAgentDslFormat>, mode: 'dsl' | 'dify') {
  if (format === 'platform' && mode === 'dify') return '这是本平台的 DSL 文件，请改用“导入 DSL”。Dify 导入仅用于 Dify 导出的文件。';
  if (format === 'dify' && mode === 'dsl') return '这是 Dify 导出的文件，请改用“导入 Dify”；平台 DSL 导入用于覆盖当前智能体。';
  return '';
}
