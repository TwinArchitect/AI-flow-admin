import type { DatasetSearchSelectedItem } from '@/features/workflows/types';

export interface ChatSkillRef { id: string; name?: string; toolKey?: string; description?: string; meta?: string }
export interface ChatMcpSkillRef extends ChatSkillRef { enabledToolNames?: string[] }
export interface ChatWorkflowSkillRef extends ChatSkillRef { publishedOnly?: boolean }

export const DEFAULT_CHAT_PERSONA = `# 角色规范
你是 [角色身份]，擅长结合知识库/插件/工作流 来解决用户问题。

# 思考规范
- 先理解用户意图，再决定是否调用工具
- 不确定时主动澄清，不编造事实

# 回复规范
- 结构清晰、语气友好
- 涉及操作步骤时给出可执行指引
- 结尾可给出 [任务] 相关的下一步建议`;

export interface ChatAgentConfig {
  version: 1;
  flowType: 0;
  basic: { id: string; name: string; intro: string; headImg: string; persona: string };
  dialogue: {
    opening: string;
    openingQuestions: string[];
    fileUploadEnabled: boolean;
    autoFollowUp: boolean;
    plan: { modelId: string; model?: string; type?: string } | null;
    maxToolRounds: number;
    toolChoice: 'auto' | 'none' | 'required';
    temperature: number;
    maxTokens: number;
  };
  skills: { knowledge: { datasets: DatasetSearchSelectedItem[]; retrievalMode: 'tool' | 'always' | 'auto'; similarity: number; limit: number; searchMode: 'embedding' | 'fullTextRecall' | 'mixedRecall'; embeddingWeight: number; usingReRank: boolean; rerankModel: string; rerankWeight: number }; httpTools: ChatSkillRef[]; mcpServers: ChatMcpSkillRef[]; workflows: ChatWorkflowSkillRef[] };
  memory: { longTermMemory: boolean; contextRounds: number; memoryDatasetId?: string };
}

export function createDefaultChatAgentConfig(input: { id?: string; name: string; intro: string; headImg?: string }): ChatAgentConfig {
  return {
    version: 1,
    flowType: 0,
    basic: { id: input.id ?? '', name: input.name, intro: input.intro, headImg: input.headImg ?? '', persona: DEFAULT_CHAT_PERSONA },
    dialogue: {
      opening: '你好，我是你的智能助手，有什么可以帮你的吗？', openingQuestions: ['', '', ''],
      fileUploadEnabled: false, autoFollowUp: true, plan: null, maxToolRounds: 8,
      toolChoice: 'auto', temperature: 0.7, maxTokens: 4096,
    },
    skills: {
      knowledge: { datasets: [], retrievalMode: 'tool', similarity: 0.4, limit: 3, searchMode: 'mixedRecall', embeddingWeight: 0.38, usingReRank: true, rerankModel: '', rerankWeight: 0.5 },
      httpTools: [], mcpServers: [], workflows: [],
    },
    memory: { longTermMemory: true, contextRounds: 6 },
  };
}

export function createDefaultChatAgentSetting(input: { name: string; intro: string; headImg?: string }) {
  return JSON.stringify(createDefaultChatAgentConfig(input));
}

function normalizeRefs(raw: unknown): ChatSkillRef[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (typeof item === 'string') return item.trim() ? [{ id: item.trim() }] : [];
    if (!item || typeof item !== 'object') return [];
    const ref = item as Record<string, unknown>;
    const id = String(ref.id ?? '').trim();
    return id ? [{ ...ref, id, name: ref.name == null ? undefined : String(ref.name), description: ref.description == null ? undefined : String(ref.description), meta: ref.meta == null ? undefined : String(ref.meta), toolKey: String(ref.toolKey ?? ref.toolName ?? '') || undefined } as ChatSkillRef] : [];
  });
}

function normalizePlan(raw: unknown): ChatAgentConfig['dialogue']['plan'] {
  if (typeof raw === 'string') return raw.trim() ? { modelId: raw.trim() } : null;
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const modelId = String(value.modelId ?? value.id ?? '').trim();
  return modelId ? { modelId, model: value.model == null ? undefined : String(value.model), type: value.type == null ? undefined : String(value.type) } : null;
}

export function parseChatAgentSetting(raw: unknown, fallback: { id: string; name: string; intro: string; headImg?: string }): ChatAgentConfig {
  let value = raw;
  for (let index = 0; index < 2 && typeof value === 'string'; index += 1) {
    if (!value.trim()) return createDefaultChatAgentConfig(fallback);
    try { value = JSON.parse(value) as unknown; }
    catch { return createDefaultChatAgentConfig(fallback); }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return createDefaultChatAgentConfig(fallback);
  const candidate = value as Partial<ChatAgentConfig> & { modules?: unknown; edges?: unknown };
  if (Array.isArray(candidate.modules) || Array.isArray(candidate.edges) || (candidate.flowType != null && candidate.flowType !== 0)) throw new Error('该智能体不是对话式配置');
  const defaults = createDefaultChatAgentConfig(fallback);
  const knowledge = candidate.skills?.knowledge;
  const dialogue = candidate.dialogue;
  const memory = candidate.memory;
  const numeric = (raw: unknown, fallbackValue: number) => {
    const number = Number(raw ?? fallbackValue);
    return Number.isFinite(number) ? number : fallbackValue;
  };
  const datasets: DatasetSearchSelectedItem[] = Array.isArray(knowledge?.datasets) ? knowledge.datasets.flatMap((raw: unknown) => {
    if (typeof raw === 'string') return raw.trim() ? [{ datasetId: raw.trim() }] : [];
    if (!raw || typeof raw !== 'object') return [];
    const item = raw as Record<string, unknown>;
    const datasetId = String(item.datasetId ?? item.id ?? '').trim();
    return datasetId ? [{ datasetId, name: item.name == null ? undefined : String(item.name), avatar: item.avatar == null ? undefined : String(item.avatar), isDeleted: Boolean(item.isDeleted) }] : [];
  }) : [];
  return {
    version: 1, flowType: 0,
    basic: { id: fallback.id, name: fallback.name, intro: fallback.intro, headImg: fallback.headImg ?? String(candidate.basic?.headImg ?? ''), persona: String(candidate.basic?.persona ?? defaults.basic.persona) },
    dialogue: {
      opening: String(dialogue?.opening ?? '').trim() ? String(dialogue?.opening) : defaults.dialogue.opening,
      openingQuestions: Array.isArray(dialogue?.openingQuestions) ? dialogue.openingQuestions.map(String).map((item) => item.slice(0, 50)).slice(0, 10) : defaults.dialogue.openingQuestions,
      fileUploadEnabled: Boolean(dialogue?.fileUploadEnabled), autoFollowUp: dialogue?.autoFollowUp == null ? true : Boolean(dialogue.autoFollowUp),
      plan: normalizePlan(dialogue?.plan),
      maxToolRounds: Math.max(1, Math.round(numeric(dialogue?.maxToolRounds, 8) || 8)),
      toolChoice: dialogue?.toolChoice === 'none' || dialogue?.toolChoice === 'required' ? dialogue.toolChoice : 'auto',
      temperature: numeric(dialogue?.temperature, 0.7),
      maxTokens: Math.max(1, Math.round(numeric(dialogue?.maxTokens, 4096) || 4096)),
    },
    skills: {
      knowledge: {
        datasets, retrievalMode: knowledge?.retrievalMode === 'always' || knowledge?.retrievalMode === 'auto' ? knowledge.retrievalMode : 'tool',
        similarity: numeric(knowledge?.similarity, defaults.skills.knowledge.similarity), limit: numeric(knowledge?.limit, defaults.skills.knowledge.limit),
        searchMode: knowledge?.searchMode === 'embedding' || knowledge?.searchMode === 'fullTextRecall' ? knowledge.searchMode : 'mixedRecall',
        embeddingWeight: numeric(knowledge?.embeddingWeight, defaults.skills.knowledge.embeddingWeight),
        usingReRank: Boolean(knowledge?.usingReRank ?? defaults.skills.knowledge.usingReRank), rerankModel: String(knowledge?.rerankModel ?? ''),
        rerankWeight: numeric(knowledge?.rerankWeight, defaults.skills.knowledge.rerankWeight),
      },
      httpTools: normalizeRefs(candidate.skills?.httpTools),
      mcpServers: normalizeRefs(candidate.skills?.mcpServers).map((item) => ({ ...item, enabledToolNames: Array.isArray((item as ChatMcpSkillRef).enabledToolNames) ? (item as ChatMcpSkillRef).enabledToolNames?.map(String).map((name) => name.trim()).filter(Boolean) : undefined })),
      workflows: normalizeRefs(candidate.skills?.workflows).map((item) => ({ ...item, publishedOnly: (item as ChatWorkflowSkillRef).publishedOnly == null ? true : Boolean((item as ChatWorkflowSkillRef).publishedOnly) })),
    },
    memory: {
      longTermMemory: memory?.longTermMemory == null ? true : Boolean(memory.longTermMemory),
      contextRounds: Math.max(0, Math.min(50, Math.round(numeric(memory?.contextRounds, 6)))),
      memoryDatasetId: String(memory?.memoryDatasetId ?? '').trim() || undefined,
    },
  };
}

/** 与参照项目一致：展示元数据不写入 agentSetting。 */
export function buildChatAgentSettingString(config: ChatAgentConfig): string {
  const knowledge = config.skills.knowledge;
  return JSON.stringify({
    version: 1,
    flowType: 0,
    basic: { id: config.basic.id, name: config.basic.name.trim(), intro: config.basic.intro.trim(), headImg: config.basic.headImg, persona: config.basic.persona },
    dialogue: {
      opening: config.dialogue.opening,
      openingQuestions: config.dialogue.openingQuestions.map((item) => item.trim()).filter(Boolean).slice(0, 10),
      fileUploadEnabled: config.dialogue.fileUploadEnabled,
      autoFollowUp: config.dialogue.autoFollowUp,
      plan: config.dialogue.plan?.modelId ? { modelId: config.dialogue.plan.modelId } : null,
      maxToolRounds: config.dialogue.maxToolRounds,
      toolChoice: config.dialogue.toolChoice,
      temperature: config.dialogue.temperature,
      maxTokens: config.dialogue.maxTokens,
    },
    skills: {
      knowledge: {
        datasets: knowledge.datasets.map((item) => ({ datasetId: item.datasetId, ...(item.name ? { name: item.name } : {}), ...(item.avatar ? { avatar: item.avatar } : {}) })),
        similarity: knowledge.similarity, limit: knowledge.limit, searchMode: knowledge.searchMode,
        embeddingWeight: knowledge.embeddingWeight, usingReRank: knowledge.usingReRank,
        rerankModel: knowledge.rerankModel, rerankWeight: knowledge.rerankWeight, retrievalMode: knowledge.retrievalMode || 'tool',
      },
      httpTools: config.skills.httpTools.map((item) => ({ id: item.id })),
      mcpServers: config.skills.mcpServers.map((item) => ({ id: item.id, ...(item.enabledToolNames?.length ? { enabledToolNames: item.enabledToolNames } : {}) })),
      workflows: config.skills.workflows.map((item) => ({ id: item.id, publishedOnly: item.publishedOnly !== false })),
    },
    memory: { longTermMemory: config.memory.longTermMemory, contextRounds: config.memory.contextRounds, ...(config.memory.longTermMemory && config.memory.memoryDatasetId ? { memoryDatasetId: config.memory.memoryDatasetId } : {}) },
  });
}
