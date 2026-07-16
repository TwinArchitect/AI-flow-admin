import type {
  ExtractionResult,
  MemoryItem,
  MemoryQuery,
  MemorySavePayload,
  RecallResult,
} from './types';

// ====== 初始 Mock 数据 ======

export const initialMemories: MemoryItem[] = [
  {
    id: 'mem-1',
    content: '用户常用设备为 1号超超临界锅炉，重点关注过热器及再热器壁温超温警报。',
    category: 'preference',
    categoryLabel: '用户习惯',
    agentId: 'agent-1',
    agentName: '锅炉安全诊断专家',
    importance: 'critical',
    hitCount: 42,
    status: 'active',
    updateTime: '2026-06-05 14:20',
    tags: ['锅炉', '超温监测'],
  },
  {
    id: 'mem-2',
    content:
      '汽轮机润滑油入口温度高限阈值设定为 45℃，若超过该值，系统建议立即开启备用冷油器。',
    category: 'fact',
    categoryLabel: '系统事实',
    agentId: 'agent-2',
    agentName: '汽轮机运维助手',
    importance: 'high',
    hitCount: 29,
    status: 'active',
    updateTime: '2026-06-04 10:15',
    tags: ['汽轮机', '油质油温'],
  },
  {
    id: 'mem-3',
    content:
      '上次会话提到：管理员正推进"两票三制"在输煤班组的线上流转，请优先提供配套API接口说明。',
    category: 'episodic',
    categoryLabel: '会话摘要',
    agentId: 'agent-3',
    agentName: '系统集成助手',
    importance: 'medium',
    hitCount: 12,
    status: 'active',
    updateTime: '2026-06-05 09:30',
    tags: ['两票三制', 'API接口'],
  },
  {
    id: 'mem-4',
    content:
      '用户倾向于采用多模式的直观图表进行安全风险趋势对比，回答时通常要求附带结构化 Markdown 表格。',
    category: 'behavior',
    categoryLabel: '行为特征',
    agentId: 'agent-4',
    agentName: '安全研判智能体',
    importance: 'high',
    hitCount: 35,
    status: 'active',
    updateTime: '2026-06-03 16:45',
    tags: ['偏好', '排布格式'],
  },
  {
    id: 'mem-5',
    content:
      '在危险源管理中，焊接动火作业（一级）的审批流程必须有现场监护人和安全员双重线上核签。',
    category: 'fact',
    categoryLabel: '系统事实',
    agentId: 'agent-5',
    agentName: '两票审核助手',
    importance: 'critical',
    hitCount: 68,
    status: 'active',
    updateTime: '2026-06-02 11:02',
    tags: ['危险源', '动火审批'],
  },
  {
    id: 'mem-6',
    content:
      '用户在周五下午会重点调取环保排放指标（二氧化硫、氮氧化物）的周报表，注意数据格式需采用国标。',
    category: 'preference',
    categoryLabel: '用户习惯',
    agentId: 'agent-6',
    agentName: '环保指标专家',
    importance: 'medium',
    hitCount: 8,
    status: 'inactive',
    updateTime: '2026-05-28 15:30',
    tags: ['环保周报', '国标规范'],
  },
];

// ====== 内存数据存储 ======

let store: MemoryItem[] = [...initialMemories];

function now(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 16);
}

// ====== 查询 ======

export async function queryMemories(query: MemoryQuery): Promise<MemoryItem[]> {
  await delay(200);
  let result = [...store];

  if (query.search) {
    const s = query.search.toLowerCase();
    result = result.filter(
      (m) =>
        m.content.toLowerCase().includes(s) ||
        m.agentName.toLowerCase().includes(s) ||
        m.tags.some((t) => t.toLowerCase().includes(s)),
    );
  }

  if (query.category && query.category !== 'all') {
    result = result.filter((m) => m.category === query.category);
  }

  if (query.importance && query.importance !== 'all') {
    result = result.filter((m) => m.importance === query.importance);
  }

  return result;
}

// ====== 创建 ======

export async function createMemory(payload: MemorySavePayload): Promise<MemoryItem> {
  await delay(300);
  const item: MemoryItem = {
    id: 'mem-' + Date.now(),
    content: payload.content,
    category: payload.category,
    categoryLabel:
      payload.category === 'preference'
        ? '用户习惯'
        : payload.category === 'fact'
          ? '系统事实'
          : payload.category === 'episodic'
            ? '会话摘要'
            : '行为特征',
    agentId: 'agent-custom',
    agentName: payload.agentName,
    importance: payload.importance,
    hitCount: 0,
    status: 'active',
    updateTime: now(),
    tags: payload.tags.length > 0 ? payload.tags : ['手动录入'],
  };
  store = [item, ...store];
  return item;
}

// ====== 更新 ======

export async function updateMemory(
  id: string,
  payload: MemorySavePayload,
): Promise<MemoryItem | null> {
  await delay(300);
  const idx = store.findIndex((m) => m.id === id);
  if (idx === -1) return null;

  store[idx] = {
    ...store[idx],
    content: payload.content,
    category: payload.category,
    categoryLabel:
      payload.category === 'preference'
        ? '用户习惯'
        : payload.category === 'fact'
          ? '系统事实'
          : payload.category === 'episodic'
            ? '会话摘要'
            : '行为特征',
    agentName: payload.agentName,
    importance: payload.importance,
    tags: payload.tags,
    updateTime: now(),
  };
  return store[idx];
}

// ====== 删除 ======

export async function deleteMemory(id: string): Promise<boolean> {
  await delay(200);
  const prev = store.length;
  store = store.filter((m) => m.id !== id);
  return store.length < prev;
}

// ====== 切换状态 ======

export async function toggleMemoryStatus(id: string): Promise<MemoryItem | null> {
  await delay(100);
  const idx = store.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  store[idx] = {
    ...store[idx],
    status: store[idx].status === 'active' ? 'inactive' : 'active',
  };
  return store[idx];
}

// ====== 模拟认知提取 ======

export async function extractMemories(transcript: string): Promise<ExtractionResult[]> {
  await delay(1000);
  // 基于输入内容模拟提取结果
  const results: ExtractionResult[] = [
    {
      id: 'ext-1',
      fact: '用户调整1号超超临界锅炉下次临时安全检修时间至：10月第二周。',
      type: 'fact',
      typeLabel: '系统事实',
      confidence: '98%',
      reason: '基于会话内容"调整至十月第二周"进行认知重塑归档。',
    },
    {
      id: 'ext-2',
      fact: '回答类似技术规范咨询时，用户偏好首选思维导图展示，备选表格排版展示。',
      type: 'behavior',
      typeLabel: '行为特征',
      confidence: '95%',
      reason: '基于"优先输出思维导图结构"的用户明示指示自主提取。',
    },
  ];
  return results;
}

// ====== 模拟召回测试 ======

export async function recallMemories(
  query: string,
  _threshold: number,
  _embeddingModel: string,
  _topK: number,
): Promise<RecallResult[]> {
  await delay(700);

  const terms = query.toLowerCase();
  const results: RecallResult[] = store
    .filter((m) => m.status === 'active')
    .map((m) => {
      let score = 0.12;
      if (terms.includes('锅炉') && m.content.includes('锅炉')) score += 0.58;
      if (terms.includes('超温') && m.content.includes('超温')) score += 0.25;
      if (terms.includes('汽轮机') && m.content.includes('汽轮机')) score += 0.62;
      if (terms.includes('油温') && m.content.includes('油温')) score += 0.25;
      if (terms.includes('两票') && m.content.includes('两票')) score += 0.65;
      if ((terms.includes('排布') || terms.includes('格式') || terms.includes('表格')) && m.content.includes('格式'))
        score += 0.45;
      if (m.importance === 'critical') score += 0.08;
      if (m.importance === 'high') score += 0.04;
      score = Math.min(0.98, parseFloat(score.toFixed(2)));
      return { ...m, score };
    })
    .sort((a, b) => b.score - a.score);

  return results;
}

// ====== 重置数据（测试用） ======

export function resetStore(): void {
  store = [...initialMemories];
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
