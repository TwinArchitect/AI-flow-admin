type PluginStatusCode = 0 | 1;
type McpAuthType = 'none' | 'bearer' | 'api_key' | 'custom_header';
type McpTransport = 'streamable_http' | 'sse' | 'stdio';

export type McpToolVO = {
  id?: string;
  serverId?: string;
  toolName: string;
  /** 跨 server 防重名的展示/调用别名 */
  nameAlias?: string | null;
  description?: string | null;
  inputSchema?: Record<string, unknown> | null;
  enabled?: boolean | null;
  syncedAt?: string | null;
};

export type McpServerVO = {
  id: string;
  name: string;
  serverKey: string;
  description?: string | null;
  category?: string | null;
  avatar?: string | null;
  /** @deprecated 兼容旧字段，优先用 avatar */
  iconUrl?: string | null;
  status?: PluginStatusCode | number | null;
  transport: McpTransport | string;
  url?: string | null;
  authType?: McpAuthType | string | null;
  authToken?: string | null;
  authHeaderName?: string | null;
  headers?: Record<string, string> | null;
  timeoutMs?: number | null;
  command?: string | null;
  args?: string[] | null;
  env?: Record<string, string> | null;
  cwd?: string | null;
  serverInfo?: Record<string, unknown> | null;
  lastConnectedAt?: string | null;
  lastError?: string | null;
  tools?: McpToolVO[] | null;
  authorType?: string | null;
  usageCount?: number | null;
  tenantId?: string | null;
  creator?: string | null;
  createTime?: string | null;
};

export type McpServerSavePayload = {
  id?: string;
  name: string;
  serverKey: string;
  description?: string;
  category?: string;
  avatar?: string;
  status?: PluginStatusCode;
  transport: McpTransport | string;
  url?: string;
  authType?: string;
  authToken?: string;
  authHeaderName?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  authorType?: string;
};

export type McpServerQuery = {
  current?: number;
  size?: number;
  name?: string;
  transport?: string | null;
  status?: PluginStatusCode | null;
  category?: string | null;
};

export type McpTestConnectPayload = {
  id?: string;
  draft?: Partial<McpServerSavePayload>;
};

export type McpTestConnectResult = {
  success: boolean;
  durationMs?: number | null;
  serverInfo?: Record<string, unknown> | null;
  tools?: McpToolVO[] | null;
  message?: string | null;
  lastError?: string | null;
};

export type McpToolsEnablePayload = {
  serverId: string;
  enabledToolNames: string[];
  /** 原始 toolName → 别名；多 server 防重名 */
  nameAliases?: Record<string, string>;
};

export type McpInvokePayload = {
  serverId: string;
  toolName: string;
  arguments?: Record<string, unknown>;
};

export type McpInvokeResult = {
  success: boolean;
  content?: string | null;
  isError?: boolean | null;
  durationMs?: number | null;
  result?: unknown;
  message?: string | null;
};

