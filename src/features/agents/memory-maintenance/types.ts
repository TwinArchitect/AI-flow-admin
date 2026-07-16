export type MemoryCategory = 'preference' | 'fact' | 'episodic' | 'behavior';

export type ImportanceLevel = 'critical' | 'high' | 'medium' | 'low';

export type MemoryStatus = 'active' | 'inactive';

export interface MemoryItem {
  id: string;
  content: string;
  category: MemoryCategory;
  categoryLabel: string;
  agentId: string;
  agentName: string;
  importance: ImportanceLevel;
  hitCount: number;
  status: MemoryStatus;
  updateTime: string;
  tags: string[];
}

export interface ExtractionResult {
  id: string;
  fact: string;
  type: MemoryCategory;
  typeLabel: string;
  confidence: string;
  reason: string;
}

export interface RecallResult extends MemoryItem {
  score: number;
}

export interface MemoryQuery {
  search?: string;
  category?: MemoryCategory | 'all';
  importance?: ImportanceLevel | 'all';
}

export interface MemorySavePayload {
  content: string;
  category: MemoryCategory;
  agentName: string;
  importance: ImportanceLevel;
  tags: string[];
}
