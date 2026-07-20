export interface KBFile {
  id: string;
  name: string;
  uploadDate: string;
  enabled: boolean;
  chunks: number;
  metadataFields: number;
  parser: string;
  progress: number;
  status: 'parsing' | 'success' | 'failed';
}

export interface KnowledgeBaseItem {
  id: string;
  name: string;
  description: string;
  docCount: number;
  indexCount: string;
  creator: string;
  createTime: string;
}

export interface TreeItem {
  id: string;
  label: string;
  children?: TreeItem[];
}

export interface SearchResult {
  docName: string;
  similarity: number;
  content: string;
  location: string;
  characterCount: number;
  parser: string;
}

export const industryTree: TreeItem[] = [
  {
    id: '1', label: '电厂生产运维',
    children: [
      { id: '1-1', label: '锅炉系统' },
      { id: '1-2', label: '汽轮机系统' },
      { id: '1-3', label: '电气系统' },
      { id: '1-4', label: '化学水处理' },
    ],
  },
  { id: '2', label: '安全环保管理',
    children: [
      { id: '2-1', label: '两票三制规范' },
      { id: '2-2', label: '隐患排查知识库' },
      { id: '2-3', label: '环保排放指标' },
    ],
  },
  { id: '3', label: '设备档案与规范',
    children: [
      { id: '3-1', label: '历史检修记录' },
      { id: '3-2', label: '国家技术规范' },
      { id: '3-3', label: '厂家说明文档' },
    ],
  },
];

export const initialKnowledgeBases: KnowledgeBaseItem[] = [
  { id: '1', name: '锅炉安全技术规程', description: '汇集了该系统相关的安全规则、运行规程与应急排障知识。', docCount: 4, indexCount: '1,204', creator: '系统管理员', createTime: '2026-03-01 12:00:00' },
  { id: '2', name: '汽轮机运维手册与标准', description: '包含汽轮机组运行参数监控、低油压等事故连锁处理规程。', docCount: 2, indexCount: '852', creator: '技术部老大', createTime: '2026-03-02 15:30:00' },
];

export const initialKbFiles: Record<string, KBFile[]> = {
  '1': [
    { id: 'f-1', name: '附件3：反违章管理标准.docx', uploadDate: '03/06/2026 09:43:52', enabled: true, chunks: 4, metadataFields: 3, parser: 'General', progress: 9.35, status: 'parsing' },
    { id: 'f-2', name: '锅炉受热面超温应急方案.pdf', uploadDate: '03/06/2026 11:24:00', enabled: true, chunks: 3, metadataFields: 2, parser: 'General', progress: 100.00, status: 'success' },
    { id: 'f-3', name: '汽轮机异常处理标准手册.docx', uploadDate: '03/05/2026 14:15:32', enabled: true, chunks: 2, metadataFields: 1, parser: 'DeepDOC', progress: 100.00, status: 'success' },
    { id: 'f-4', name: '工业安全防护违章考核细则.pdf', uploadDate: '03/04/2026 10:05:40', enabled: false, chunks: 2, metadataFields: 5, parser: 'General', progress: 100.00, status: 'success' },
  ],
  '2': [
    { id: 'f-5', name: '典型故障排查指南_v2.pdf', uploadDate: '03/06/2026 10:12:15', enabled: true, chunks: 12, metadataFields: 4, parser: 'DeepDOC', progress: 100.00, status: 'success' },
    { id: 'f-6', name: '润滑油系统油质监测标准.docx', uploadDate: '03/05/2026 16:45:10', enabled: true, chunks: 8, metadataFields: 2, parser: 'General', progress: 100.00, status: 'success' },
  ],
};

export const mockChunksData: Record<string, { title: string; content: string; charCount: number }[]> = {
  'f-1': [
    { title: '分块 #1 · 总则范围', content: '【反违章管理标准 - 第一章 总则】本标准规定了本公司范围内生产作业活动中反违章工作的管理职责、违章界定、排查治理、处罚与考核细则。', charCount: 110 },
    { title: '分块 #2 · 职责归口', content: '【反违章管理标准 - 第二条】安全监督管理部是公司反违章管理工作的归口职能部门，负责制度修订。', charCount: 102 },
  ],
  'f-2': [
    { title: '分块 #1 · 预警判断', content: '【锅炉受热面突发超温爆管排险】当受热面发生突发阶跃式超温、管壁温度逼近580℃极限安全临界值时，应判断为即将瞬时爆开。', charCount: 132 },
  ],
};

export const searchDatabase: SearchResult[] = [
  { docName: '附件3：反违章管理标准.docx', similarity: 0.941, content: '《公司反违章工作考核细则（2026修订版）》第三条规定：严禁不戴安全帽、不系上挂式五点式防冲击安全带进行高处作业。安全防线全天候落实，违规者按规定扣罚500元并停止现场作业重新补考。', location: '分块 #4 · 安全带规范与考核惩处', characterCount: 154, parser: 'General' },
  { docName: '锅炉受热面超温应急方案.pdf', similarity: 0.958, content: '【紧急停炉安全应急指令】当锅炉过热器或再热器等受热面壁温发生阶跃式高位超温、管壁外壳传感器温度达到警戒上限（580℃）且采取调整减温水量等冷激手段在3分钟内完全无效时，运行班组值长必须果断按下主燃料跳闸事故按钮（MFT）紧急保护停机停气。', location: '分块 #3 · 锅炉受热面突发超温爆管排险', characterCount: 165, parser: 'General' },
];
