import type { ElementType } from 'react';
import {
  BookOpen,
  ShieldAlert,
  Gauge,
  Activity,
  FileCheck,
  Presentation,
  Compass,
  Calendar,
  Mic,
  Brain,
  Clock,
  Flame,
  Thermometer,
  Shuffle,
  Wrench,
  Wand2,
  FileText,
} from 'lucide-react';

// ====== 类型定义 ======

export interface PlazaAgent {
  id: string;
  title: string;
  desc: string;
  views: number;
  copies: number;
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  category: string;
}

export interface KnowledgeAgent {
  id: string;
  title: string;
  desc: string;
  views: number;
  copies: number;
  gradient: string;
  innerGradient: string;
  techLabel: string;
  category: string;
}

export const categories = ['全部', '办公', '安全', '运行', '检修'] as const;

// ====== 标准智能体数据（按原型 AgentSquare 1:1 对应） ======

export const standardAgents: PlazaAgent[] = [
  // ---- 办公：基础办公套件 (8) ----
  {
    id: 'plaza-legal',
    title: '基础法律问答助手',
    desc: '基础法律知识的智能问答助手，基于现行法律法规、司法解释及权威案例为基础解决日常合规诉求。',
    views: 11758, copies: 4973,
    icon: BookOpen, iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400',
    category: '办公',
  },
  {
    id: 'plaza-contract',
    title: '合同信息抽取',
    desc: '本应用能够从合同文本中精准提取关键要素，包括合作主体、签署时间、核心标的及约束条款等。',
    views: 5360, copies: 5274,
    icon: FileCheck, iconBg: 'bg-indigo-500/10', iconColor: 'text-indigo-600 dark:text-indigo-400',
    category: '办公',
  },
  {
    id: 'plaza-ppt',
    title: 'PPT 自动生成',
    desc: '本模板适用于快速制作结构清晰、内容专业的演示文稿，广泛应用于工作周报汇报及经营分析会。',
    views: 182142, copies: 3651,
    icon: Presentation, iconBg: 'bg-rose-500/10', iconColor: 'text-rose-600 dark:text-rose-400',
    category: '办公',
  },
  {
    id: 'plaza-market-research',
    title: '市场调研分析',
    desc: '专注于市场调研全流程知识支持，提供三大模块：主题梳理与提炼、竞品多维大纲编制、走势推测。',
    views: 3314, copies: 2406,
    icon: Compass, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400',
    category: '办公',
  },
  {
    id: 'plaza-sentiment',
    title: '舆情分析报告',
    desc: '该智能体具备全链路企业网络抓取与多维度情感分析，一键输出标准公关舆情摘要与行动建议。',
    views: 5695, copies: 1779,
    icon: Activity, iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600 dark:text-blue-400',
    category: '办公',
  },
  {
    id: 'plaza-meeting-notes',
    title: '会议图文纪要',
    desc: '上传会议录音或在线链接，自主分辨关键发言人并一键整理专业会议备忘录与待办闭环。',
    views: 1895, copies: 1256,
    icon: Calendar, iconBg: 'bg-purple-500/10', iconColor: 'text-purple-600 dark:text-purple-400',
    category: '办公',
  },
  {
    id: 'plaza-audio-transcript',
    title: '音视频转文本',
    desc: '高契合度转录离线音频并支持翻译机制，秒级输出高可读性发言文本、说话人分离。',
    views: 4869, copies: 1863,
    icon: Mic, iconBg: 'bg-pink-500/10', iconColor: 'text-pink-600 dark:text-pink-400',
    category: '办公',
  },
  {
    id: 'plaza-deep-search',
    title: '实时搜索问答（深度思考）',
    desc: '搭载联网实时查验能力，结合深度逻辑思考对前沿态势、政策变化及行业新闻进行实时提炼。',
    views: 2655, copies: 1402,
    icon: Brain, iconBg: 'bg-cyan-500/10', iconColor: 'text-cyan-600 dark:text-cyan-400',
    category: '办公',
  },

  // ---- 安全：安全智能体套件 (5) ----
  {
    id: 'plaza-safety-vision',
    title: '安全隐患智能化分析专家',
    desc: '自动识别巡检照片或现场截图中的人员违章和物理隐患，一键生成整改防护方案及对应的安全规章制度援引。',
    views: 16830, copies: 4255,
    icon: ShieldAlert, iconBg: 'bg-destructive/10', iconColor: 'text-destructive',
    category: '安全',
  },
  {
    id: 'plaza-safety-capture',
    title: '日常作业违规AI智能抓拍',
    desc: '自动辨别场站监控中各类越界和不规范操作，如未穿工作服、未戴防尘面罩等并一键报警。',
    views: 12550, copies: 4122,
    icon: ShieldAlert, iconBg: 'bg-red-500/10', iconColor: 'text-red-600 dark:text-red-400',
    category: '安全',
  },
  {
    id: 'plaza-two-tickets',
    title: '两票安全规范合规审查',
    desc: '智能对照企业安规及防误逻辑，分析工作票、操作票内潜在风险死角并标记修改建议。',
    views: 8645, copies: 3012,
    icon: FileText, iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400',
    category: '安全',
  },
  {
    id: 'plaza-hazard-supervisor',
    title: '隐患分级闭环监督助手',
    desc: '一键归集、多渠道捕获违章事实，根据程度分配整改闭环专人，支持微信及邮件到期督导。',
    views: 5392, copies: 2110,
    icon: Clock, iconBg: 'bg-slate-500/10', iconColor: 'text-slate-600 dark:text-slate-400',
    category: '安全',
  },
  {
    id: 'plaza-disaster-drill',
    title: '防灾应急智能预备与推演',
    desc: '多模式结合当前气象走势和蓄水状况，自主推演应急物资消耗、防汛大坝应急防御调度。',
    views: 4018, copies: 1250,
    icon: Flame, iconBg: 'bg-orange-500/10', iconColor: 'text-orange-600 dark:text-orange-400',
    category: '安全',
  },

  // ---- 运行：智能运行分析套件 (4) ----
  {
    id: 'plaza-gen-optimization',
    title: '发电机组深度寻优建议',
    desc: '动态捕获真空度、排烟温升及机组振动测点指标，通过能效标杆数据库得出降耗空间。',
    views: 19280, copies: 8930,
    icon: Gauge, iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600 dark:text-blue-400',
    category: '运行',
  },
  {
    id: 'plaza-steam-temp',
    title: '汽水管道超温超压智控判定',
    desc: '严防热力学越限事件，结合介质特性和温度趋势，提前10分钟预测超温概率及纠偏。',
    views: 7490, copies: 3220,
    icon: Thermometer, iconBg: 'bg-rose-500/10', iconColor: 'text-rose-600 dark:text-rose-400',
    category: '运行',
  },
  {
    id: 'plaza-shift-log',
    title: '集控交接日志一键整合',
    desc: '针对上值各项负荷波动、点检发现、倒闸指令动态提要，输出高条理性、干净整洁的值班日志。',
    views: 3241, copies: 1563,
    icon: FileCheck, iconBg: 'bg-indigo-500/10', iconColor: 'text-indigo-600 dark:text-indigo-400',
    category: '运行',
  },
  {
    id: 'plaza-coal-blending',
    title: '优化配煤掺烧能耗估算',
    desc: '根据炉温测定和煤层气燃烧实效，推算最优燃煤配混比例，将购煤煤本与脱硫负荷完美平衡。',
    views: 6540, copies: 2901,
    icon: Shuffle, iconBg: 'bg-teal-500/10', iconColor: 'text-teal-600 dark:text-teal-400',
    category: '运行',
  },

  // ---- 检修：精益检修支撑套件 (4) ----
  {
    id: 'plaza-transformer-dga',
    title: '油浸式变压器缺陷根因溯源',
    desc: '分析油中溶解气体谱图，研判变压器局部过热、电弧放电等内部早期异常缺陷位置。',
    views: 13950, copies: 5932,
    icon: Activity, iconBg: 'bg-violet-500/10', iconColor: 'text-violet-600 dark:text-violet-400',
    category: '检修',
  },
  {
    id: 'plaza-precision-schedule',
    title: '高精密点检频次自适应排程',
    desc: '建立精细化的测温测振设备周期，分析运行损伤规律，智能编排月度点检任务。',
    views: 5430, copies: 2190,
    icon: Calendar, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400',
    category: '检修',
  },
  {
    id: 'plaza-shaft-vibration',
    title: '汽机轴振故障推理诊断型',
    desc: '输入转速频率、不平衡振幅及晃心位移角度，自主研判油膜振荡或不对中等高频缺陷。',
    views: 3410, copies: 1650,
    icon: Wrench, iconBg: 'bg-sky-500/10', iconColor: 'text-sky-600 dark:text-sky-400',
    category: '检修',
  },
  {
    id: 'plaza-standard-man-hour',
    title: '标准化检修标准时工计算',
    desc: '智能对照历史台账、检修定额标准，自动化估算物料备品备件清单以及施工标准周期。',
    views: 4210, copies: 1888,
    icon: Wand2, iconBg: 'bg-pink-500/10', iconColor: 'text-pink-600 dark:text-pink-400',
    category: '检修',
  },
];

// ====== 多模态知识问答智能体（视觉卡片风格，按原型 AgentSquare 1:1 对应） ======

export const knowledgeAgents: KnowledgeAgent[] = [
  {
    id: 'plaza-chatpdf',
    title: 'ChatPDF 企业知识库问答',
    desc: '上传 PDF 文档后可用自然语言对话，毫秒级追溯企业技术规程及运营方案细则。',
    views: 8570, copies: 8868,
    gradient: 'from-slate-100 to-slate-300 dark:from-slate-800 dark:to-slate-900',
    innerGradient: 'from-blue-600 to-indigo-500',
    techLabel: 'File Schema Search',
    category: '办公',
  },
  {
    id: 'plaza-visual-search',
    title: '拍立搜-图搜商品问答',
    desc: '用户随手一拍设备物理标签，即刻调用大模型视觉检索识别图纸与档案记录，提供维护指南。',
    views: 1609, copies: 1693,
    gradient: 'from-amber-50 to-orange-100 dark:from-slate-800 dark:to-slate-900',
    innerGradient: 'from-purple-600 to-pink-500',
    techLabel: 'Visual RAG Analyzer',
    category: '办公',
  },
  {
    id: 'plaza-report-qa',
    title: '行业研报问答',
    desc: '深耕能源电力、双碳及企业级生产策略，快速针对专业研报输出核心数据及预测矩阵。',
    views: 1089, copies: 1909,
    gradient: 'from-sky-50 to-slate-200 dark:from-slate-800 dark:to-slate-900',
    innerGradient: 'from-emerald-500 to-teal-600',
    techLabel: 'Report Analytical Model',
    category: '办公',
  },
];

// ====== 查找工具 ======

/** 按分类获取标准智能体 */
export function getStandardByCategory(category: string): PlazaAgent[] {
  return standardAgents.filter((a) => a.category === category);
}

/** 所有广场智能体的统一查找 Map（含标准 + 知识问答） */
export const allPlazaAgents = new Map<string, PlazaAgent | KnowledgeAgent>([
  ...standardAgents.map((a) => [a.id, a] as const),
  ...knowledgeAgents.map((a) => [a.id, a] as const),
]);
