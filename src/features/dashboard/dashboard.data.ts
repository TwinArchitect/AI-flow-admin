import { Cpu, Database, Workflow, Code, Server, Monitor } from 'lucide-react';

export const capabilities = [
  { id: 'agent-builder', num: '01', title: '智能体构建', subtitle: '快速打造企业专属智能体', desc: '通过零代码、低代码方式，快速构建对话助手、工作流智能体等各类智能应用。', tags: ['对话型智能体', '工作流智能体', '专家顾问智能体', '多 Agent 协同智能体'], icon: Cpu, gradient: 'from-blue-500 to-indigo-600' },
  { id: 'knowledge-base', num: '02', title: '企业知识库', subtitle: '构建企业专属知识大脑', desc: '支持多种格式文档接入，构建企业专属RAG引擎，实现智能检索和精准问答。', tags: ['多格式文档解析', 'OCR 智能识别', '知识增强检索', '企业专属 RAG 引擎'], icon: Database, gradient: 'from-emerald-500 to-teal-600' },
  { id: 'workflow', num: '03', title: '工作流编排', subtitle: '可视化设计复杂业务流程', desc: '通过可视化拖拽方式，实现复杂业务流程的自动化编排和执行，支持条件分支、循环处理、接口调用和消息通知，实现 AI 与业务系统深度协同。', tags: ['条件判断', '循环处理', 'API 集成调用', '流程自动执行'], icon: Workflow, gradient: 'from-purple-500 to-pink-600' },
  { id: 'models', num: '04', title: '多模型接入', subtitle: '灵活管理模型资源', desc: '兼容接入DeepSeek、通义千问、智谱等主流模型，实现模型统一管理和灵活切换。', tags: ['DeepSeek / Qwen', 'OpenAI / Claude', 'Gemini', '私有化大模型'], icon: Server, gradient: 'from-amber-500 to-orange-600' },
  { id: 'plugins', num: '05', title: '工具插件扩展能力', subtitle: '实现企业系统数字化连接', desc: '通过标准接口连接企业业务系统和第三方应用，实现数据互通和业务协同。', tags: ['企业接口接入', '业务系统联通', '可视化 API 对接', '数据互联互通'], icon: Code, gradient: 'from-rose-500 to-red-600' },
];

export const advantages = [
  { id: 'fast', letter: '快', label: '快速上线', desc: '智能体秒级搭建上线，降低项目开发周期', color: 'border-blue-500 text-blue-500 bg-blue-50/50 dark:bg-blue-900/10' },
  { id: 'easy', letter: '易', label: '零代码搭建', desc: '无门槛可视化拖拽流，零基础人员快速上手', color: 'border-indigo-500 text-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' },
  { id: 'accurate', letter: '准', label: '知识增强准', desc: '先进 RAG 引擎赋能，自动向量优化杜绝幻觉', color: 'border-emerald-500 text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' },
  { id: 'powerful', letter: '强', label: '支持复杂流程', desc: '深度工作流编排机制，稳定应对高难度业务', color: 'border-purple-500 text-purple-500 bg-purple-50/50 dark:bg-purple-900/10' },
  { id: 'open', letter: '开', label: '开放生态圈', desc: '标准 API 完美输出，对接企业既有 CRM/ERP 系统', color: 'border-rose-500 text-rose-500 bg-rose-50/50 dark:bg-rose-900/10' },
  { id: 'secure', letter: '安', label: '私有化部署', desc: '数据私有不外泄，完整国产化环境全兼容适配', color: 'border-amber-500 text-amber-500 bg-amber-50/50 dark:bg-amber-900/10' },
];

export const heroQuickTags = [
  { label: '智能问答', className: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
  { label: '智能助手', className: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
  { label: 'AI客服', className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  { label: '数据分析', className: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
  { label: '流程自动化', className: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  { label: '多智能体协同', className: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
];

export const innerHeroCards = [
  { id: 'independent', num: '01', title: '打造企业自主可控的 AI 基础平台', desc: '拥有自主知识产权，完全自主可控的智能体平台，实现模型、知识、数据、应用全链路自主可控', Icon: () => null, iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'upgrade', num: '02', title: '推动业务智能化升级，赋能场景应用', desc: '通过统一的平台能力，支撑公司 AI 智能化项目快速落地，以智能体平台为底座，赋能项目', Icon: () => null, iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'knowledge', num: '03', title: '沉淀知识资产，形成数字化生产力', desc: '将安全、运行、检修、生产等业务知识进行数字化沉淀，积累覆盖各专业领域的智能体体系', Icon: () => null, iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
];

export const platformCapabilities = [
  { id: 'model-access', title: '大模型接入能力', desc: '统一管理主流模型、本地模型及专有模型，实现灵活调度与快速切换。', icon: Cpu, col: 'text-blue-500' },
  { id: 'knowledge-base-cap', title: '企业知识库能力', desc: '基于知识增强与向量检索技术，打造企业专属知识中枢。', icon: Database, col: 'text-emerald-500' },
  { id: 'workflow-cap', title: '工作流编排能力', desc: '可视化构建业务流程，快速实现 AI 与业务系统协同。', icon: Workflow, col: 'text-purple-500' },
  { id: 'agent-cap', title: 'Agent 智能体能力', desc: '支持多角色、多任务协作，打造专业化 AI 助手与数字员工。', icon: Cpu, col: 'text-amber-500' },
  { id: 'multimodal-cap', title: '多模态理解能力', desc: '融合图像、语音、视频及文本理解能力，满足复杂场景应用需求。', icon: Monitor, col: 'text-rose-500' },
  { id: 'plugin-cap', title: '工具插件扩展能力', desc: '支持企业接口、业务系统及第三方应用接入，实现数据互联互通。', icon: Code, col: 'text-indigo-500' },
];

export const aiRoles = [
  { id: 'assistant', name: 'AI 助手', desc: '提升日常办公效率，处理高频事务' },
  { id: 'service', name: 'AI 客服', desc: '提供全天候智能服务与响应' },
  { id: 'expert', name: 'AI 专家', desc: '辅助知识咨询、规程解读与业务决策' },
  { id: 'analyst', name: 'AI 分析员', desc: '实现数据分析、趋势洞察与经营透视' },
  { id: 'inspector', name: 'AI 巡检员', desc: '结合视觉能力识别隐患与异常风险' },
  { id: 'digital-worker', name: 'AI 数字员工', desc: '自动执行复杂流程，推动业务智能化运行' },
];

export const userLayerItems = ['WEB 控制台', '桌面应用/H5', '企业微信/钉钉集成', '智能物理硬件终端', '公共 API 通信接口'];

export const agentLayerItems = [
  { id: 'assistant-node', label: 'AI 助手', className: 'border-blue-500/20 text-blue-300' },
  { id: 'service-node', label: 'AI 客服', className: 'border-emerald-500/20 text-emerald-300' },
  { id: 'expert-node', label: 'AI 专家', className: 'border-purple-500/20 text-purple-300' },
  { id: 'inspector-node', label: 'AI 巡检员', className: 'border-rose-500/20 text-rose-300' },
  { id: 'analyst-node', label: 'AI 分析师', className: 'border-amber-500/20 text-amber-300' },
];

export const capabilityLayerItems = [
  { id: 'prompt', name: 'Prompt 结构工程' },
  { id: 'workflow-engine', name: 'Workflow 智能编排' },
  { id: 'agent-lifecycle', name: 'Agent 生命周期管理' },
  { id: 'mcp-tools', name: 'MCP 统一工具管理' },
  { id: 'knowledge-mount', name: '自适应知识库挂接' },
];

export const modelLayerItems = [
  { id: 'deepseek', name: 'DeepSeek-R1', extra: '推理模型' },
  { id: 'qwen', name: 'Qwen-Max', extra: '通义千问' },
  { id: 'gpt4o', name: 'GPT-4o', extra: '多模态标杆' },
  { id: 'claude', name: 'Claude 3.5 Sonnet', extra: '代码大师' },
  { id: 'local-llm', name: '本地 LLaMA / Qwen-Coder', extra: '安全隔离' },
];

export const dataLayerItems = [
  { id: 'rag', label: '企业知识库 (RAG Vector)', desc: 'Word/PDF/网页' },
  { id: 'erp', label: '企业业务系统 (ERP/CRM)', desc: 'API通信接口' },
  { id: 'database', label: '关系型/NoSQL 数据库', desc: '主备灾备同步' },
  { id: 'files', label: '中央文件共享中心', desc: '图片OCR/视频流' },
];
