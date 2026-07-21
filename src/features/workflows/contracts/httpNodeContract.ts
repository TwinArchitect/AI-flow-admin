import type {
  HttpNodeConfig,
  HttpInputVariable,
  HttpOutputExtract,
  HttpParamRow,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowModuleInput,
  WorkflowModuleOutput,
  WorkflowOutputSchema,
} from '../types';
import { moduleRefToString, stringToModuleRef } from '../utils/variableRefs';
import { createCanvasNode, parseInputValue } from './shared';
import { migrateLegacyHttpConfig } from './legacyConfigMigrations';

export const HTTP_TIMEOUT_MIN = 5;
export const HTTP_TIMEOUT_MAX = 600;
export const HTTP_TIMEOUT_DEFAULT = 30;

export const HTTP_FIXED_OUTPUTS: WorkflowOutputSchema[] = [
  { key: 'httpRawResponse', label: '原始响应', valueType: 'any' },
  { key: 'error', label: '错误信息', valueType: 'string' },
];

const HTTP_VALUE_TYPES = [
  'string',
  'number',
  'boolean',
  'object',
  'arrayString',
  'arrayNumber',
  'arrayBoolean',
  'arrayObject',
  'arrayAny',
  'any',
  'chatHistory',
  'datasetQuote',
  'dynamic',
  'selectDataset',
  'selectApp',
] as const;

const RESERVED_INPUT_KEYS = new Set([
  'system_addInputParam',
  'system_httpMethod',
  'system_httpTimeout',
  'system_httpReqUrl',
  'system_header_secret',
  'system_httpHeader',
  'system_httpParams',
  'system_httpJsonBody',
  'system_httpFormBody',
  'system_httpContentType',
]);

const HTTP_CUSTOM_INPUT_CONFIG = {
  selectValueTypeList: [...HTTP_VALUE_TYPES],
  showDefaultValue: true,
  showDescription: false,
};

const HTTP_CUSTOM_OUTPUT_CONFIG = {
  selectValueTypeList: [...HTTP_VALUE_TYPES],
  showDefaultValue: false,
  showDescription: false,
};

function rowId(prefix: string, index: number) {
  return `${prefix}-${index}`;
}

function normalizeMethod(value: unknown): HttpNodeConfig['method'] {
  const method = String(value ?? 'POST').toUpperCase();
  return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method)
    ? method as HttpNodeConfig['method']
    : 'POST';
}

function normalizeTimeout(value: unknown) {
  const timeout = Number(value ?? HTTP_TIMEOUT_DEFAULT);
  if (Number.isNaN(timeout)) return HTTP_TIMEOUT_DEFAULT;
  return Math.min(HTTP_TIMEOUT_MAX, Math.max(HTTP_TIMEOUT_MIN, timeout));
}

function normalizeContentType(value: unknown): HttpNodeConfig['contentType'] {
  const contentType = String(value ?? 'json').toLowerCase();
  return ['json', 'form', 'none'].includes(contentType)
    ? contentType as HttpNodeConfig['contentType']
    : 'json';
}

function dedupeIds<T extends { id: string }>(items: T[], prefix: string): T[] {
  const seen = new Set<string>();
  return items.map((item, index) => {
    if (item.id && !seen.has(item.id)) {
      seen.add(item.id);
      return item;
    }
    const id = rowId(prefix, index);
    seen.add(id);
    return { ...item, id };
  });
}

function normalizeRows(value: unknown, prefix: string): HttpParamRow[] {
  if (!Array.isArray(value)) return [];
  return dedupeIds(value.map((raw, index) => {
    const row = (raw ?? {}) as Record<string, unknown>;
    return {
      id: String(row.id ?? rowId(prefix, index)),
      key: String(row.key ?? ''),
      type: String(row.type ?? 'string'),
      value: Array.isArray(row.value) ? moduleRefToCanvas(row.value) : moduleStringToCanvas(row.value),
      required: Boolean(row.required),
    };
  }), prefix);
}

function moduleRefToCanvas(value: unknown[]) {
  if (typeof value[0] === 'string' && typeof value[1] === 'string') {
    return `{{${value[0]}.${value[1]}}}`;
  }
  return value.map((item) => String(item ?? '')).join('');
}

function normalizeOutputs(value: unknown): HttpOutputExtract[] {
  if (!Array.isArray(value)) return [];
  return dedupeIds(value.map((raw, index) => {
    const output = (raw ?? {}) as Partial<HttpOutputExtract>;
    return {
      id: output.id ?? rowId('http-output', index),
      key: output.key ?? '',
      jsonPath: output.jsonPath ?? '',
      valueType: output.valueType ?? 'any',
    };
  }), 'http-output');
}

function normalizeInputVariables(value: unknown): HttpInputVariable[] {
  if (!Array.isArray(value)) return [];
  return dedupeIds(value.map((raw, index) => {
    const input = (raw ?? {}) as Partial<HttpInputVariable>;
    return {
      id: input.id ?? rowId('http-input', index),
      key: input.key ?? '',
      label: input.label ?? input.key ?? '',
      value: input.value ?? '',
      required: input.required ?? false,
      valueType: input.valueType ?? 'string',
    };
  }), 'http-input');
}

export const DEFAULT_HTTP_CONFIG: HttpNodeConfig = {
  method: 'POST',
  url: '',
  timeout: HTTP_TIMEOUT_DEFAULT,
  headerSecret: null,
  params: [],
  headers: [],
  contentType: 'json',
  jsonBody: '',
  formBody: [],
  inputVariables: [],
  outputExtracts: [],
  catchError: false,
};

export function createDefaultHttpConfig(): Record<string, unknown> {
  return {
    ...DEFAULT_HTTP_CONFIG,
    params: [],
    headers: [],
    formBody: [],
    inputVariables: [],
    outputExtracts: [],
  };
}

export function normalizeHttpConfig(config: unknown): HttpNodeConfig {
  const raw = migrateLegacyHttpConfig(config);
  return {
    ...DEFAULT_HTTP_CONFIG,
    ...raw,
    method: normalizeMethod(raw.method),
    timeout: normalizeTimeout(raw.timeout),
    headerSecret: raw.headerSecret && typeof raw.headerSecret === 'object'
      ? raw.headerSecret
      : null,
    params: normalizeRows(raw.params, 'http-param'),
    headers: normalizeRows(raw.headers, 'http-header'),
    contentType: normalizeContentType(raw.contentType),
    jsonBody: raw.jsonBody ?? '',
    formBody: normalizeRows(raw.formBody, 'http-form'),
    inputVariables: normalizeInputVariables(raw.inputVariables),
    outputExtracts: normalizeOutputs(raw.outputExtracts),
    catchError: raw.catchError ?? false,
  };
}

export function moduleStringToCanvas(value: unknown) {
  if (value == null) return '';
  return String(value).replace(/\{\{\$([^.$]+)\.([^$]+)\$\}\}/g, '{{$1.$2}}');
}

export function canvasStringToModule(value: string) {
  return value.replace(
    /\{\{([^}]+)\.([^}]+)\}\}/g,
    (_, nodeId, outputKey) => `{{$${nodeId}.${outputKey}$}}`,
  );
}

function serializeRows(rows: HttpParamRow[]) {
  return rows.filter((row) => row.key.trim()).map((row) => ({
    key: row.key.trim(),
    type: row.type || 'string',
    value: canvasStringToModule(row.value),
  }));
}

function toBackendJsonPath(value: string) {
  const path = value.trim();
  return path.startsWith('$.') ? path.slice(2) : path;
}

function parseRows(value: unknown, prefix: string) {
  return normalizeRows(value, prefix);
}

function buildHttpInputs(config: HttpNodeConfig): WorkflowModuleInput[] {
  return [
    {
      key: 'system_addInputParam',
      label: '',
      valueType: 'dynamic',
      required: false,
      customInputConfig: HTTP_CUSTOM_INPUT_CONFIG,
      renderTypeList: ['addInputParam'],
      description: 'common:core.module.input.description.HTTP Dynamic Input',
      deprecated: false,
    },
    { key: 'system_httpMethod', valueType: 'string', required: true, renderTypeList: ['custom'], value: config.method },
    {
      key: 'system_httpTimeout', valueType: 'number', required: true, renderTypeList: ['custom'],
      value: config.timeout, min: HTTP_TIMEOUT_MIN, max: HTTP_TIMEOUT_MAX,
    },
    {
      key: 'system_httpReqUrl', valueType: 'string', renderTypeList: ['hidden'],
      value: config.url, placeholder: 'https://api.ai.com/getInventory',
      description: 'common:core.module.input.description.Http Request Url',
    },
    {
      key: 'system_header_secret', valueType: 'object', renderTypeList: ['hidden'],
      value: config.headerSecret ?? undefined,
    },
    { key: 'system_httpHeader', valueType: 'any', renderTypeList: ['custom'], value: serializeRows(config.headers) },
    { key: 'system_httpParams', valueType: 'any', renderTypeList: ['hidden'], value: serializeRows(config.params) },
    { key: 'system_httpJsonBody', valueType: 'any', renderTypeList: ['hidden'], value: canvasStringToModule(config.jsonBody) },
    { key: 'system_httpFormBody', valueType: 'any', renderTypeList: ['hidden'], value: serializeRows(config.formBody) },
    { key: 'system_httpContentType', valueType: 'string', renderTypeList: ['hidden'], value: config.contentType },
    ...config.inputVariables.filter((input) => input.key.trim()).map((input) => ({
      key: input.key.trim(),
      label: input.label.trim() || input.key.trim(),
      valueType: input.valueType,
      required: input.required,
      customInputConfig: HTTP_CUSTOM_INPUT_CONFIG,
      renderTypeList: ['reference'],
      value: stringToModuleRef(input.value),
      canEdit: true,
    })),
  ];
}

function buildHttpOutputs(config: HttpNodeConfig): WorkflowModuleOutput[] {
  const fixed: WorkflowModuleOutput[] = [
    {
      id: 'httpRawResponse', key: 'httpRawResponse', type: 'static', valueType: 'any',
      valueDesc: '', label: 'workflow:raw_response', required: true,
      description: 'HTTP请求的原始响应。只能接受字符串或JSON类型响应数据。',
    },
    {
      id: 'error', key: 'error', type: 'error', valueType: 'string', valueDesc: '',
      label: 'workflow:error_text', description: '',
    },
    {
      id: 'system_addOutputParam', key: 'system_addOutputParam', type: 'dynamic',
      valueType: 'dynamic', valueDesc: '', label: '输出字段提取',
      description: '可以通过 JSONPath 语法来提取响应值中的指定字段',
      customFieldConfig: HTTP_CUSTOM_OUTPUT_CONFIG,
    },
  ];
  return [...fixed, ...config.outputExtracts
    .filter((output) => output.key.trim() || output.jsonPath.trim())
    .map((output) => ({
      id: output.id,
      key: toBackendJsonPath(output.jsonPath) || output.key.trim(),
      type: 'dynamic',
      valueType: output.valueType,
      valueDesc: '',
      label: output.key.trim() || output.jsonPath.trim(),
      description: '',
    }))];
}

export function resolveHttpNodeOutputs(node: WorkflowCanvasNode): WorkflowOutputSchema[] {
  const config = normalizeHttpConfig(node.data.config);
  return [
    ...HTTP_FIXED_OUTPUTS,
    ...config.outputExtracts.filter((output) => output.key.trim()).map((output) => ({
      key: output.key.trim(),
      label: output.key.trim(),
      valueType: output.valueType,
    })),
  ];
}

export function serializeHttpNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeHttpConfig(node.data.config);
  return {
    flowNodeType: 'httpRequest468',
    avatar: 'core/workflow/template/httpRequest',
    name: node.data.label,
    intro: node.data.description,
    version: '481',
    nodeId: node.id,
    position: node.position,
    showStatus: true,
    catchError: config.catchError,
    inputs: buildHttpInputs(config),
    outputs: buildHttpOutputs(config),
  };
}

export function parseHttpModule(module: WorkflowModule) {
  const inputs = module.inputs ?? [];
  const headerSecretValue = parseInputValue(inputs, 'system_header_secret');
  const inputVariables = inputs
    .filter((input) => input.key && !RESERVED_INPUT_KEYS.has(input.key))
    .map((input, index) => ({
      id: rowId('http-input', index),
      key: input.key,
      label: input.label ?? input.key,
      value: moduleRefToString(input.value),
      required: Boolean(input.required),
      valueType: (input.valueType || 'string') as HttpInputVariable['valueType'],
    }));
  const outputExtracts = (module.outputs ?? [])
    .filter((output) => output.type === 'dynamic' && output.key !== 'system_addOutputParam')
    .map((output, index) => ({
      id: output.id || rowId('http-output', index),
      key: output.label && output.label !== output.key ? output.label : output.key,
      jsonPath: output.key,
      valueType: (output.valueType || 'any') as HttpOutputExtract['valueType'],
    }));
  return createCanvasNode('http', module, normalizeHttpConfig({
    method: parseInputValue(inputs, 'system_httpMethod'),
    timeout: parseInputValue(inputs, 'system_httpTimeout'),
    url: String(parseInputValue(inputs, 'system_httpReqUrl') ?? ''),
    headerSecret: headerSecretValue && typeof headerSecretValue === 'object' && !Array.isArray(headerSecretValue)
      ? headerSecretValue
      : null,
    headers: parseRows(parseInputValue(inputs, 'system_httpHeader'), 'http-header'),
    params: parseRows(parseInputValue(inputs, 'system_httpParams'), 'http-param'),
    contentType: parseInputValue(inputs, 'system_httpContentType'),
    jsonBody: moduleStringToCanvas(parseInputValue(inputs, 'system_httpJsonBody')),
    formBody: parseRows(parseInputValue(inputs, 'system_httpFormBody'), 'http-form'),
    inputVariables,
    outputExtracts,
    catchError: Boolean(module.catchError),
  }));
}

export function getHttpReferences(node: WorkflowCanvasNode) {
  const config = normalizeHttpConfig(node.data.config);
  return [
    { value: config.url, context: `节点 ${node.data.label} 的请求地址` },
    { value: config.jsonBody, context: `节点 ${node.data.label} 的 JSON Body` },
    ...config.inputVariables.map((input) => ({ value: input.value, context: `节点 ${node.data.label} 的输入变量 ${input.key || '未命名项'}` })),
    ...config.params.map((row) => ({ value: row.value, context: `节点 ${node.data.label} 的 Query 参数 ${row.key || '未命名项'}` })),
    ...config.headers.map((row) => ({ value: row.value, context: `节点 ${node.data.label} 的 Header ${row.key || '未命名项'}` })),
    ...config.formBody.map((row) => ({ value: row.value, context: `节点 ${node.data.label} 的 Form 字段 ${row.key || '未命名项'}` })),
  ];
}

export function validateHttpNode(node: WorkflowCanvasNode) {
  const config = normalizeHttpConfig(node.data.config);
  const errors: string[] = [];
  if (!config.url.trim()) errors.push(`节点 ${node.data.label} 的请求地址不能为空`);
  if (config.timeout < HTTP_TIMEOUT_MIN || config.timeout > HTTP_TIMEOUT_MAX) {
    errors.push(`节点 ${node.data.label} 的超时时长必须在 ${HTTP_TIMEOUT_MIN} 到 ${HTTP_TIMEOUT_MAX} 秒之间`);
  }
  const validateRows = (rows: HttpParamRow[], label: string) => {
    const keys = rows.map((row) => row.key.trim()).filter(Boolean);
    if (new Set(keys).size !== keys.length) errors.push(`节点 ${node.data.label} 的 ${label} 名称不能重复`);
    rows.forEach((row) => {
      if (!row.key.trim() && row.value.trim()) errors.push(`节点 ${node.data.label} 的 ${label} 存在未命名项`);
    });
  };
  validateRows(config.params, 'Query 参数');
  validateRows(config.headers, 'Header');
  validateRows(config.formBody, 'Form 字段');
  const inputKeys = config.inputVariables.map((input) => input.key.trim()).filter(Boolean);
  if (new Set(inputKeys).size !== inputKeys.length) errors.push(`节点 ${node.data.label} 的输入变量名不能重复`);
  config.inputVariables.forEach((input) => {
    if (!input.key.trim()) errors.push(`节点 ${node.data.label} 存在未命名的输入变量`);
    if (input.required && !input.value.trim()) {
      errors.push(`节点 ${node.data.label} 的必填输入变量 ${input.key || '未命名项'} 不能为空`);
    }
  });
  const outputKeys = config.outputExtracts.map((output) => output.key.trim()).filter(Boolean);
  if (new Set(outputKeys).size !== outputKeys.length) errors.push(`节点 ${node.data.label} 的输出字段名不能重复`);
  config.outputExtracts.forEach((output) => {
    if (!output.key.trim() || !output.jsonPath.trim()) {
      errors.push(`节点 ${node.data.label} 的输出提取字段必须同时填写字段名和 JSONPath`);
    }
    if (output.jsonPath.trim() === '$') {
      errors.push(`节点 ${node.data.label} 提取完整响应时请直接使用 httpRawResponse 输出`);
    }
  });
  return errors;
}
