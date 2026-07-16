import type { AgentOpenModel, ModelDebugPayload, ModelDebugResult, ModelQuery, ModelSavePayload } from './types';

// ====== Mock 数据 ======

let mockId = 0;
function nextId(): string {
  mockId++;
  return `model-${mockId}`;
}

const mockModels: AgentOpenModel[] = [
  {
    id: nextId(),
    model: 'Qwen/Qwen2.5-7B-Instruct',
    url: 'https://api.siliconflow.cn/v1/chat/completions',
    type: 'llm',
    vendor: 'openai',
    status: 0,
    authToken: 'sk-xxxxxaaaaaaaaabbbbb',
    remark: '通义千问 7B 指令微调版，适合中文场景的文本生成与理解',
    createTime: '2026-07-10T08:30:00',
  },
  {
    id: nextId(),
    model: 'Huaneng-Llama3-Industrial-8B',
    url: 'https://ai.huaneng.com.cn/v1/chat/completions',
    type: 'llm',
    vendor: 'openai',
    status: 0,
    authToken: 'sk-hn-xxxxxxxxxxxxxxxxxx',
    remark: '华能工业大模型，面向电力行业场景精调',
    createTime: '2026-07-08T14:00:00',
  },
  {
    id: nextId(),
    model: 'Gemini-1.5-Pro',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    type: 'multimodal',
    vendor: 'openai',
    status: 0,
    authToken: 'AIza-xxxxxxxxxxxxxxxxxxx',
    remark: 'Google 多模态大模型，支持文本+图像理解',
    createTime: '2026-07-05T10:00:00',
  },
  {
    id: nextId(),
    model: 'DeepSeek-V2.5-Chat',
    url: 'https://api.deepseek.com/v1/chat/completions',
    type: 'llm',
    vendor: 'openai',
    status: 1,
    authToken: 'sk-ds-xxxxxxxxxxxxxxxx',
    remark: 'DeepSeek 对话模型，性价比高，适合大批量任务',
    createTime: '2026-07-01T16:00:00',
  },
  {
    id: nextId(),
    model: 'Huaneng-Vision-Safety-v3',
    url: 'https://ai.huaneng.com.cn/v1/vision/analyze',
    type: 'multimodal',
    vendor: 'dify',
    status: 0,
    authToken: 'sk-hn-vision-xxxxxxxxx',
    remark: '华能视觉安全模型，用于现场违章识别与隐患分析',
    createTime: '2026-06-28T09:00:00',
  },
  {
    id: nextId(),
    model: 'Qwen-Specialized-DGA-7B',
    url: 'https://api.siliconflow.cn/v1/chat/completions',
    type: 'llm',
    vendor: 'openai',
    status: 0,
    authToken: 'sk-xxxxxcccccddddd',
    remark: '变压器油色谱分析专用模型，基于 Qwen 微调',
    createTime: '2026-06-20T11:00:00',
  },
];

interface PageResult<T> {
  records: T[];
  total: number;
}

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ====== API 函数（mock 实现） ======

export async function queryModels(params: ModelQuery): Promise<PageResult<AgentOpenModel>> {
  await delay();
  let filtered = [...mockModels];
  if (params.model) {
    const kw = params.model.toLowerCase();
    filtered = filtered.filter((m) => m.model.toLowerCase().includes(kw));
  }
  if (params.type) {
    filtered = filtered.filter((m) => m.type === params.type);
  }
  if (params.status !== undefined && params.status !== null) {
    filtered = filtered.filter((m) => (m.status ?? 0) === params.status);
  }
  const total = filtered.length;
  const start = (params.pageNum - 1) * params.pageSize;
  const records = filtered.slice(start, start + params.pageSize);
  return { records, total };
}

export async function getModel(id: string): Promise<AgentOpenModel | undefined> {
  await delay(100);
  return mockModels.find((m) => m.id === id);
}

export async function saveModel(payload: ModelSavePayload): Promise<void> {
  await delay();
  const newModel: AgentOpenModel = {
    id: nextId(),
    model: payload.model,
    url: payload.url,
    type: payload.type ?? 'llm',
    vendor: payload.vendor ?? 'openai',
    status: payload.status ?? 0,
    authToken: payload.authToken,
    remark: payload.remark,
    params: payload.params,
    createTime: new Date().toISOString(),
  };
  mockModels.unshift(newModel);
}

export async function updateModel(payload: ModelSavePayload & { id: string }): Promise<void> {
  await delay();
  const idx = mockModels.findIndex((m) => m.id === payload.id);
  if (idx !== -1) {
    mockModels[idx] = {
      ...mockModels[idx],
      model: payload.model,
      url: payload.url,
      type: payload.type ?? mockModels[idx].type,
      vendor: payload.vendor ?? mockModels[idx].vendor,
      status: payload.status ?? mockModels[idx].status,
      authToken: payload.authToken ?? mockModels[idx].authToken,
      remark: payload.remark ?? mockModels[idx].remark,
      params: payload.params ?? mockModels[idx].params,
    };
  }
}

export async function deleteModel(id: string): Promise<void> {
  await delay();
  const idx = mockModels.findIndex((m) => m.id === id);
  if (idx !== -1) mockModels.splice(idx, 1);
}

export async function debugModel(payload: ModelDebugPayload): Promise<ModelDebugResult> {
  await delay(800 + Math.random() * 1200);
  const model = mockModels.find((m) => m.id === payload.id);
  if (!model) {
    return { success: false, errorMessage: '模型不存在' };
  }
  if (model.status === 1) {
    return { success: false, errorMessage: '模型已关闭，无法调试', httpStatus: 503 };
  }
  return {
    success: true,
    httpStatus: 200,
    costMs: Math.floor(300 + Math.random() * 1500),
    content: `[${model.model}] 响应测试成功。\n\n这是对提示词「${payload.prompt}」的模拟回复。模型连接正常，API 地址 ${model.url} 可正常访问。`,
  };
}
