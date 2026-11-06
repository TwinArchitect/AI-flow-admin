type HttpToolMethod = string;
type HttpToolBodyType = string;

/** 后端 status：0 启用 / 1 停用 */
export type PluginStatusCode = 0 | 1;

export type HttpInputParamDto = {
  id?: string;
  name: string;
  description?: string;
  paramType: string;
  required?: boolean;
  asToolParam?: boolean;
  /** 可选默认值 */
  defaultValue?: string;
  sortOrder?: number;
};

export type HttpRequestKvDto = {
  id?: string;
  keyName: string;
  valueMode: 'literal' | 'input_ref';
  valueText?: string;
  sortOrder?: number;
};

export type HttpToolVO = {
  id: string;
  name: string;
  /** 英文 function 名，供模型调用 */
  toolName?: string | null;
  description?: string | null;
  category?: string | null;
  /** 头像：预设 id 编码或 URL */
  avatar?: string | null;
  /** @deprecated 兼容旧字段，优先用 avatar */
  iconUrl?: string | null;
  status?: PluginStatusCode | number | null;
  method: HttpToolMethod | string;
  baseUrl: string;
  /** 超时 ms，默认 30000 */
  timeoutMs?: number | null;
  bodyType?: HttpToolBodyType | string | null;
  bodyContent?: string | null;
  authorType?: string | null;
  usageCount?: number | null;
  inputParams?: HttpInputParamDto[] | null;
  requestParams?: HttpRequestKvDto[] | null;
  requestHeaders?: HttpRequestKvDto[] | null;
  tenantId?: string | null;
  creator?: string | null;
  createTime?: string | null;
  updater?: string | null;
  updateTime?: string | null;
};

export type HttpToolSavePayload = {
  id?: string;
  name: string;
  toolName?: string;
  description?: string;
  category?: string;
  avatar?: string;
  status?: PluginStatusCode;
  method: string;
  baseUrl: string;
  timeoutMs?: number;
  bodyType?: string;
  bodyContent?: string;
  authorType?: string;
  inputParams?: HttpInputParamDto[];
  requestParams?: HttpRequestKvDto[];
  requestHeaders?: HttpRequestKvDto[];
};

export type HttpToolQuery = {
  current?: number;
  size?: number;
  pageNum?: number;
  pageSize?: number;
  name?: string;
  category?: string;
  status?: PluginStatusCode | null;
};

export type HttpDebugPayload = {
  id?: string;
  draft?: HttpToolSavePayload;
  inputs?: Record<string, unknown>;
};

export type HttpDebugResult = {
  success: boolean;
  statusCode?: number | null;
  durationMs?: number | null;
  request?: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } | null;
  responseBody?: string | null;
  message?: string | null;
};

/** 试运行：仅已保存且启用的工具 */
export type HttpInvokePayload = {
  id: string;
  inputs?: Record<string, unknown>;
};

export type HttpInvokeResult = HttpDebugResult;

