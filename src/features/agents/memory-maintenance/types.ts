type PageResult<T> = { records: T[]; total: number; current?: number; size?: number; pages?: number };

/** 记忆类型 */
export type MemoryType = 'profile' | 'preference' | 'fact' | 'constraint';

/** 来源 */
export type MemorySource = 'manual' | 'extract';

export type MemoryItemVo = {
  id: string;
  agentId?: string;
  /** 分页查询时回填 */
  agentName?: string;
  userId?: string;
  scope?: string;
  memoryType?: MemoryType | string;
  content?: string;
  structuredJson?: string;
  memoryKey?: string;
  importance?: number;
  confidence?: number;
  /** 1 置顶 / 0 否 */
  pinned?: number;
  status?: string;
  source?: MemorySource | string;
  sourceMsgId?: string;
  sourceGroupId?: string;
  createTime?: string;
  updateTime?: string;
};

export type MemoryQueryDto = {
  agentId?: string;
  /** 智能体名称模糊匹配 */
  agentName?: string;
  memoryType?: string;
  keyword?: string;
  current?: number;
  size?: number;
};

export type MemorySaveDto = {
  agentId: string;
  content: string;
  memoryType?: string;
  memoryKey?: string;
  pinned?: boolean;
};

export type MemoryUpdateDto = {
  id: string;
  content?: string;
  memoryType?: string;
  memoryKey?: string;
  pinned?: boolean;
};

export type MemoryRecallDebugDto = {
  agentId: string;
  query: string;
  topK?: number;
};

export type MemoryRecallStrategy = 'empty' | 'vector' | 'keyword' | string;

export type MemoryRecallVectorHitVo = {
  id?: string;
  content?: string;
  score?: number;
  matchedInDb?: boolean;
};

export type MemoryRecallDebugVo = {
  agentId?: string;
  query?: string;
  topK?: number;
  activeCount?: number;
  strategy?: MemoryRecallStrategy;
  promptBlock?: string;
  items?: MemoryItemVo[];
  vectorHits?: MemoryRecallVectorHitVo[];
};

export type MemoryPageResult = PageResult<MemoryItemVo>;
