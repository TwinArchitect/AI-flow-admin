import { useState } from 'react';
import {
  Cpu,
  Monitor,
  Sparkles,
  ArrowRight,
  Database,
  Workflow,
  Lock,
  Code,
  Server,
  Globe,
  Activity,
  UserCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'flow' | 'details'>('flow');
  const [hoveredAdvantage, setHoveredAdvantage] = useState<number | null>(null);
  const [heroType, setHeroType] = useState<'inner' | 'outer'>('outer');

  const capabilities = [
    {
      id: "01",
      title: "智能体构建",
      subtitle: "快速打造企业专属智能体",
      desc: "通过零代码、低代码方式，快速构建对话助手、工作流智能体等各类智能应用。",
      tags: ["对话型智能体", "工作流智能体", "专家顾问智能体", "多 Agent 协同智能体"],
      icon: Cpu,
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: "02",
      title: "企业知识库",
      subtitle: "构建企业专属知识大脑",
      desc: "支持多种格式文档接入，构建企业专属RAG引擎，实现智能检索和精准问答。",
      tags: ["多格式文档解析", "OCR 智能识别", "知识增强检索", "企业专属 RAG 引擎"],
      icon: Database,
      color: "from-emerald-500 to-teal-600",
    },
    {
      id: "03",
      title: "工作流编排",
      subtitle: "可视化设计复杂业务流程",
      desc: "通过可视化拖拽方式，实现复杂业务流程的自动化编排和执行，支持条件分支、循环处理、接口调用和消息通知，实现 AI 与业务系统深度协同。",
      tags: ["条件判断", "循环处理", "API 集成调用", "流程自动执行"],
      icon: Workflow,
      color: "from-purple-500 to-pink-600",
    },
    {
      id: "04",
      title: "多模型接入",
      subtitle: "灵活管理模型资源",
      desc: "兼容接入DeepSeek、通义千问、智谱等主流模型，实现模型统一管理和灵活切换。",
      tags: ["DeepSeek / Qwen", "OpenAI / Claude", "Gemini", "私有化大模型"],
      icon: Server,
      color: "from-amber-500 to-orange-600",
    },
    {
      id: "05",
      title: "工具插件扩展能力",
      subtitle: "实现企业系统数字化连接",
      desc: "通过标准接口连接企业业务系统和第三方应用，实现数据互通和业务协同。",
      tags: ["企业接口接入", "业务系统联通", "可视化 API 对接", "数据互联互通"],
      icon: Code,
      color: "from-rose-500 to-red-600",
    },
  ];

  const advantages = [
    { letter: "快", label: "快速上线", desc: "智能体秒级搭建上线，降低项目开发周期", color: "border-blue-500 text-blue-500 bg-blue-50/50 dark:bg-blue-900/10" },
    { letter: "易", label: "零代码搭建", desc: "无门槛可视化拖拽流，零基础人员快速上手", color: "border-indigo-500 text-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10" },
    { letter: "准", label: "知识增强准", desc: "先进 RAG 引擎赋能，自动向量优化杜绝幻觉", color: "border-emerald-500 text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10" },
    { letter: "强", label: "支持复杂流程", desc: "深度工作流编排机制，稳定应对高难度业务", color: "border-purple-500 text-purple-500 bg-purple-50/50 dark:bg-purple-900/10" },
    { letter: "开", label: "开放生态圈", desc: "标准 API 完美输出，对接企业既有 CRM/ERP 系统", color: "border-rose-500 text-rose-500 bg-rose-50/50 dark:bg-rose-900/10" },
    { letter: "安", label: "私有化部署", desc: "数据私有不外泄，完整国产化环境全兼容适配", color: "border-amber-500 text-amber-500 bg-amber-50/50 dark:bg-amber-900/10" },
  ];

  return (
    <div className="space-y-16 pb-16 font-sans">

      {/* ═══════ SECTION 1: HERO CONTAINER ═══════ */}
      {/* Hero 区为刻意深色背景，不走亮/暗切换 */}
      <section className="relative overflow-hidden rounded-[32px] bg-slate-950 border border-slate-900 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#312e81,transparent_50%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-10" />

        {/* 模式切换：内/外 */}
        <div className="absolute top-0 right-0 z-40 group p-10 select-none">
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-2xl gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 shadow-2xl backdrop-blur-md">
            <Button
              variant={heroType === 'inner' ? 'default' : 'ghost'}
              size="xs"
              onClick={() => setHeroType('inner')}
              className={`rounded-xl text-xs font-black ${heroType !== 'inner' ? 'text-slate-400 hover:text-slate-200' : ''}`}
            >
              内
            </Button>
            <Button
              variant={heroType === 'outer' ? 'default' : 'ghost'}
              size="xs"
              onClick={() => setHeroType('outer')}
              className={`rounded-xl text-xs font-black ${heroType !== 'outer' ? 'text-slate-400 hover:text-slate-200' : ''}`}
            >
              外
            </Button>
          </div>
        </div>

        {/* 代码装饰背景 */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 font-mono text-[9px] text-slate-400 select-none overflow-hidden hidden lg:block pr-8 pt-8">
          <pre>{`// AI Agent Engine
const agent = await Server.createAgent({
  id: "agent-089",
  name: "智能分析助手",
  capabilities: ["RAG_Search", "Workflow"],
  models: ["DeepSeek-R1", "Qwen-Max"],
  temperature: 0.15
});

await agent.mountKnowledgeBase("regulation");
const result = await agent.run("check_compliance");
console.log(\`[SUCCESS] \${result.count} items\`);`}</pre>
        </div>

        <div className="relative z-20 max-w-5xl">
          <AnimatePresence mode="wait">
            {heroType === 'outer' ? (
              <motion.div
                key="outer"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 max-w-5xl"
              >
                {/* 标签：text-brand-400 → text-primary/80 */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-[11px] font-black uppercase tracking-wider text-primary/80">
                  <Sparkles size={12} className="animate-pulse" />
                  智能体平台 v1.0
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight leading-none text-slate-100 font-black">
                  智能体平台 <br />
                  {/* 渐变文字 from-brand-400 via-purple-300 to-rose-450 */}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-300 to-rose-400 mt-2 block">
                    让每一家企业都拥有自己的AI员工
                  </span>
                </h1>

                {/* 描述：text-slate-300 + font-medium → text-slate-300 font-medium */}
                <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl font-medium">
                  构建企业专属智能体，将知识库、业务系统与大模型能力进行融合，实现AI能力在各类业务场景中的快速落地。
                </p>

                {/* 快捷标签 */}
                <div className="py-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">一个平台，打造无限智能应用：</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "智能问答", color: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
                      { label: "智能助手", color: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" },
                      { label: "AI客服", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
                      { label: "数据分析", color: "bg-purple-500/10 text-purple-300 border-purple-500/20" },
                      { label: "流程自动化", color: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
                      { label: "多智能体协同", color: "bg-rose-500/10 text-rose-300 border-rose-500/20" },
                    ].map((item, id) => (
                      <span key={id} className={`text-xs font-black px-3.5 py-1.5 rounded-xl border ${item.color}`}>
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-4">
                  {/* from-brand-500 → from-primary */}
                  <Button
                    onClick={() => navigate('/agent/overview')}
                    className="h-auto px-6 py-3.5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 text-white font-black rounded-2xl text-xs gap-2 shadow-lg group"
                  >
                    立即创建智能体
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/agent/square')}
                    className="h-auto px-6 py-3.5 bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 font-black rounded-2xl text-xs"
                  >
                    探索体验中心
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="inner"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-full text-[11px] font-black uppercase tracking-wider text-blue-400">
                  <Globe size={12} className="animate-pulse" />
                  智能体平台 v1.0
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-[46px] font-black tracking-tight leading-[1] text-slate-100 font-black">
                  打造企业自主可控的 <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 mt-2 block">
                    AI 基础生态与智能体大脑
                  </span>
                </h1>

                {/* Bento 三卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                  {[
                    {
                      num: "01",
                      title: "打造企业自主可控的 AI 基础平台",
                      desc: "拥有自主知识产权，完全自主可控的智能体平台，实现模型、知识、数据、应用全链路自主可控",
                      icon: Lock,
                      iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    },
                    {
                      num: "02",
                      title: "推动业务智能化升级，赋能场景应用",
                      desc: "通过统一的平台能力，支撑公司 AI 智能化项目快速落地，以智能体平台为底座，赋能项目",
                      icon: Activity,
                      iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                    },
                    {
                      num: "03",
                      title: "沉淀知识资产，形成数字化生产力",
                      desc: "将安全、运行、检修、生产等业务知识进行数字化沉淀，积累覆盖各专业领域的智能体体系",
                      icon: Database,
                      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    },
                  ].map((card, idx) => {
                    const IconComp = card.icon;
                    return (
                      <div
                        key={idx}
                        className="bg-slate-900/35 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 relative overflow-hidden transition-all duration-500 hover:border-slate-700/80 hover:bg-slate-900/50 hover:-translate-y-1 shadow-xl group flex flex-col justify-between min-h-[180px]"
                      >
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-indigo-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <span className="absolute top-3 right-4 font-mono font-black text-3xl text-slate-800/20 select-none group-hover:text-blue-500/10 transition-colors duration-500">
                          {card.num}
                        </span>
                        <div>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border mb-4 ${card.iconBg} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                            <IconComp size={16} />
                          </div>
                          <h3 className="text-sm font-black text-slate-100 mb-1.5 leading-snug tracking-tight group-hover:text-blue-300 transition-colors duration-300">
                            {card.title}
                          </h3>
                          <p className="text-slate-400 text-[11px] leading-relaxed font-black">
                            {card.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Button
                    onClick={() => navigate('/agent/overview')}
                    className="h-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black rounded-2xl text-xs gap-2 shadow-lg group"
                  >
                    开启智能生态重塑
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>


      {/* ═══════ SECTION 2: 什么是智能体平台 ═══════ */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          {/* text-brand-600 dark:text-brand-400 → text-primary */}
          <p className="text-primary font-black text-xs uppercase tracking-widest">ABOUT PLATFORM</p>
          {/* text-slate-900 dark:text-white + font-display → text-foreground font-black */}
          <h2 className="text-3xl font-black tracking-tight text-foreground">
            什么是智能体平台
          </h2>
          {/* text-slate-400 font-medium → text-slate-400 font-medium（保持原型） */}
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            面向企业级应用而设计的 AI 智能体一站式开发、运营与保障平台，打破数据孤岛，赋能流程重塑，通过三大核心价值。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">

          {/* Card 1: 六大核心能力 */}
          {/* bg-slate-50 dark:bg-slate-900/55 + rounded-[24px] → bg-muted rounded-2xl */}
          <div className="bg-muted rounded-2xl p-8 border border-border shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full" />
                六大核心能力底座
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                汇聚底层能力，支撑企业智能升级
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "大模型接入能力", desc: "统一管理主流模型、本地模型及专有模型，实现灵活调度与快速切换。", icon: Cpu, col: "text-blue-500" },
                { title: "企业知识库能力", desc: "基于知识增强与向量检索技术，打造企业专属知识中枢。", icon: Database, col: "text-emerald-500" },
                { title: "工作流编排能力", desc: "可视化构建业务流程，快速实现 AI 与业务系统协同。", icon: Workflow, col: "text-purple-500" },
                { title: "Agent 智能体能力", desc: "支持多角色、多任务协作，打造专业化 AI 助手与数字员工。", icon: Sparkles, col: "text-amber-500" },
                { title: "多模态理解能力", desc: "融合图像、语音、视频及文本理解能力，满足复杂场景应用需求。", icon: Monitor, col: "text-rose-500" },
                { title: "工具插件扩展能力", desc: "支持企业接口、业务系统及第三方应用接入，实现数据互联互通。", icon: Code, col: "text-indigo-500" },
              ].map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div key={idx} className="bg-background p-4 rounded-2xl border border-border flex gap-3 leading-normal">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.col} bg-muted`}>
                      <IconComp size={16} />
                    </div>
                    <div>
                      {/* text-slate-800 dark:text-slate-200 + font-black → text-foreground font-black */}
                      <h4 className="text-xs font-black text-foreground">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: AI 融入企业流程 */}
          {/* bg-slate-50 dark:bg-slate-900/55 + rounded-[24px] → bg-muted rounded-2xl */}
          <div className="bg-muted rounded-2xl p-8 border border-border shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                  让 AI 深度融入企业生产经营流程
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  不止于信息生成，更能够连接业务系统、调用工具能力、执行复杂流程，实现从感知、分析到执行的全流程闭环。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-2">
                {[
                  { name: "AI 助手", desc: "提升日常办公效率，处理高频事务" },
                  { name: "AI 客服", desc: "提供全天候智能服务与响应" },
                  { name: "AI 专家", desc: "辅助知识咨询、规程解读与业务决策" },
                  { name: "AI 分析员", desc: "实现数据分析、趋势洞察与经营透视" },
                  { name: "AI 巡检员", desc: "结合视觉能力识别隐患与异常风险" },
                  { name: "AI 数字员工", desc: "自动执行复杂流程，推动业务智能化运行" },
                ].map((role, idx) => (
                  <div key={idx} className="bg-background p-3.5 rounded-2xl border border-border flex items-start gap-2.5">
                    <span className="text-emerald-500 shrink-0 font-black text-xs">✓</span>
                    <div>
                      <h4 className="text-xs font-black text-foreground">{role.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{role.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* bg-brand-50/50 + border-brand-100 → bg-primary/5 + border-primary/20 */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3.5 items-center mt-4">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <UserCheck size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-black text-foreground">面向千行百业</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal font-medium">
                  内置丰富的行业大纲规程模板，助力生产、金融、工业安监、日常政务工作流迅速搭积木式闭环配置。
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ═══════ SECTION 3: 五大核心能力 ═══════ */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div className="space-y-1">
            {/* text-brand-600 dark:text-brand-400 → text-primary */}
            <p className="text-primary font-black text-xs uppercase tracking-widest">CAPABILITIES</p>
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              五大核心关键能力
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-black max-w-sm hidden sm:block">
            全维度企业级底层配置，给到开发极致速度、高可用与高安全性体验。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cp, idx) => {
            const IconComp = cp.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-2xl p-6 border border-border hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    {/* text-[10px] font-black → text-[10px] font-black */}
                    <span className="text-[10px] font-black tracking-widest bg-muted text-slate-400 w-8 h-8 rounded-lg flex items-center justify-center border border-border">
                      {cp.id}
                    </span>
                    <div className={`p-2 rounded-xl bg-gradient-to-tr ${cp.color} text-white shrink-0 shadow-sm`}>
                      <IconComp size={16} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    {/* text-slate-900 dark:text-white → text-foreground */}
                    <h3 className="text-[17px] font-black text-foreground">{cp.title}</h3>
                    {/* text-brand-500 → text-primary */}
                    <p className="text-[11px] text-primary font-black">{cp.subtitle}</p>
                  </div>

                  <p className="text-xs text-muted-foreground leading-normal font-medium">{cp.desc}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-border flex flex-wrap gap-1.5">
                  {cp.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="text-[10px] font-black bg-muted text-slate-400 px-2 py-1 rounded border border-border">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>


      {/* ═══════ SECTION 4: 平台架构 ═══════ */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-purple-600 dark:text-purple-400 font-black text-xs uppercase tracking-widest">ARCHITECT DESIGN</p>
          <h2 className="text-3xl font-black tracking-tight text-foreground">
            平台深度架构
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            多层高聚合技术蓝图，确保多数据打通、底层无缝链接与全闭环高灵敏控制
          </p>
        </div>

        {/* Tab 切换 */}
        <div className="flex justify-center pb-2">
          <div className="inline-flex p-1 bg-muted border border-border rounded-xl">
            <Button
              variant={activeTab === 'flow' ? 'secondary' : 'ghost'}
              size="xs"
              onClick={() => setActiveTab('flow')}
              className={`px-4 py-1.5 font-bold bg-white transition-all cursor-pointer rounded-lg text-xs font-black ${activeTab !== 'flow' ? 'text-slate-500' : ''}`}
            >
              交互蓝图
            </Button>
            <Button
              variant={activeTab === 'details' ? 'secondary' : 'ghost'}
              size="xs"
              onClick={() => setActiveTab('details')}
              className={`px-4 py-1.5 font-bold bg-white transition-all cursor-pointer rounded-lg text-xs font-black ${activeTab !== 'details' ? 'text-slate-500' : ''}`}
            >
              流向与关联解析
            </Button>
          </div>
        </div>

        {/* 架构图主体：刻意深色背景 */}
        <div className="bg-slate-950 p-6 md:p-8 rounded-[28px] border border-slate-900/40 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

          {activeTab === 'flow' ? (
            <div className="space-y-6">

              {/* Layer 1: 用户层 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="font-mono text-[10px] text-slate-400 font-black uppercase tracking-widest">用户层 (User Presentation)</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-around">
                  {["WEB 控制台", "桌面应用/H5", "企业微信/钉钉集成", "智能物理硬件终端", "公共 API 通信接口"].map((u, i) => (
                    <span key={i} className="px-3.5 py-1.5 bg-slate-900 text-xs font-black text-slate-200 border border-slate-800/35 rounded-xl flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />
                      {u}
                    </span>
                  ))}
                </div>
              </div>

              <div className="h-6 flex items-center justify-center">
                <div className="w-[1px] h-full bg-gradient-to-b from-blue-500/50 to-emerald-500/50 relative">
                  <span className="absolute text-[8px] font-black text-slate-600 font-mono -right-9 bg-slate-950 px-1 border border-slate-800/20 rounded">USER_REQ</span>
                </div>
              </div>

              {/* Layer 2: 智能体层 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-mono text-[10px] text-emerald-400 font-black uppercase tracking-widest">智能体层 (Multi-Agent Core)</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: "AI 助手", col: "border-blue-500/20 text-blue-300" },
                    { label: "AI 客服", col: "border-emerald-500/20 text-emerald-300" },
                    { label: "AI 专家", col: "border-purple-500/20 text-purple-300" },
                    { label: "AI 巡检员", col: "border-rose-500/20 text-rose-300" },
                    { label: "AI 分析师", col: "border-amber-500/20 text-amber-300" },
                  ].map((ag, i) => (
                    <div key={i} className={`bg-slate-900 p-3.5 rounded-xl border bg-gradient-to-tr ${ag.col} flex flex-col items-center justify-center text-center leading-normal`}>
                      <span className="text-xs font-black">{ag.label}</span>
                      <span className="text-[10px] opacity-75 mt-1 font-medium font-mono">NODE_0{i+1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-6 flex items-center justify-center">
                <div className="w-[1px] h-full bg-gradient-to-b from-emerald-500/50 to-purple-500/50 relative">
                  <span className="absolute text-[8px] font-black text-slate-600 font-mono -right-9 bg-slate-950 px-1 border border-slate-800/20 rounded">ENGINE_GO</span>
                </div>
              </div>

              {/* Layer 3: 能力层 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  <span className="font-mono text-[10px] text-purple-400 font-black uppercase tracking-widest">平台能力层 (Orchestration Engine)</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    "Prompt 结构工程", "Workflow 智能编排", "Agent 生命周期管理", "MCP 统一工具管理", "自适应知识库挂接"
                  ].map((cap, i) => (
                    <span key={i} className="px-3.5 py-4 bg-slate-900 text-xs font-black text-slate-300 border border-slate-800/35 rounded-xl text-center flex flex-col justify-center">
                      <span>{cap}</span>
                      <span className="text-[9px] text-slate-500 font-mono mt-1">SERVICE</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="h-6 flex items-center justify-center">
                <div className="w-[1px] h-full bg-gradient-to-b from-purple-500/50 to-amber-500/50 relative">
                  <span className="absolute text-[8px] font-black text-slate-600 font-mono -right-10 bg-slate-950 px-1 border border-slate-800/20 rounded">MODEL_ROUTE</span>
                </div>
              </div>

              {/* Layer 4: 模型层 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-mono text-[10px] text-amber-400 font-black uppercase tracking-widest">模型层 (Unified Model Router)</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl flex flex-wrap gap-3.5 items-center justify-around">
                  {[
                    { name: "DeepSeek-R1", extra: "推理模型" },
                    { name: "Qwen-Max", extra: "通义千问" },
                    { name: "GPT-4o", extra: "多模态标杆" },
                    { name: "Claude 3.5 Sonnet", extra: "代码大师" },
                    { name: "本地 LLaMA / Qwen-Coder", extra: "安全隔离" },
                  ].map((md, i) => (
                    <div key={i} className="px-3.5 py-2.5 bg-slate-900 border border-slate-800/40 rounded-xl flex flex-col shrink-0 min-w-[120px] text-center">
                      <span className="text-xs font-black text-slate-200">{md.name}</span>
                      <span className="text-[9px] text-slate-500 font-medium mt-0.5">{md.extra}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-6 flex items-center justify-center">
                <div className="w-[1px] h-full bg-gradient-to-b from-amber-500/50 to-rose-500/50 relative">
                  <span className="absolute text-[8px] font-black text-slate-600 font-mono -right-9 bg-slate-950 px-1 border border-slate-800/20 rounded">DATA_SYNC</span>
                </div>
              </div>

              {/* Layer 5: 数据层 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-mono text-[10px] text-rose-400 font-black uppercase tracking-widest">数据层 (Enterprise Storage)</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "企业知识库 (RAG Vector)", desc: "Word/PDF/网页" },
                    { label: "企业业务系统 (ERP/CRM)", desc: "API通信接口" },
                    { label: "关系型/NoSQL 数据库", desc: "主备灾备同步" },
                    { label: "中央文件共享中心", desc: "图片OCR/视频流" },
                  ].map((dt, i) => (
                    <div key={i} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/40">
                      <span className="text-xs font-black text-slate-200 block">{dt.label}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{dt.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            /* Details Tab */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-200 text-xs leading-relaxed font-medium">
              <div className="bg-slate-900/50 border border-slate-800/40 p-5 rounded-2xl space-y-3">
                <h4 className="text-sm font-black text-primary flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full" />
                  自上而下：极速决策链路
                </h4>
                <p><strong>请求过滤：</strong>当用户在 WEB 控制台或手机端提交指令后，平台会将其导入安全过滤器进行严格的文本净化和红线审计。</p>
                <p><strong>角色映射：</strong>根据请求业务范畴，智能路由引擎在"智能体层"精准激活适配的 AI 巡检、分析或专家节点。</p>
                <p><strong>指令编排：</strong>通过"平台能力层"配置的流程图拓扑图（如分支判断、MCP工具拉取），自主补充任务相关上下文。</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800/40 p-5 rounded-2xl space-y-3">
                <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                  自下而上：高安全数据兜底
                </h4>
                <p><strong>私有隔离：</strong>所有涉及企业核心敏感资产（如生产安规、员工名册、设备协议等）均沉淀在"数据层"本地隔离数据库。</p>
                <p><strong>多模融合：</strong>支持工业摄像头视频帧动态解析，多模态引擎自动对视频中的违章操作标绘并转换为警报对象，完成事件全纪录。</p>
                <p><strong>模型适配：</strong>完美支持本地大模型离线部署（如通义千问本地蒸馏版等），实现彻底的"数据不出域"。</p>
              </div>
            </div>
          )}

        </div>
      </section>


      {/* ═══════ SECTION 5: 六大优势 ═══════ */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-rose-600 dark:text-rose-400 font-black text-xs uppercase tracking-widest">PRODUCT ADVANTAGES</p>
          <h2 className="text-3xl font-black tracking-tight text-foreground">
            选择睿创的六大硬核优势
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            全行业、多网联合落地的深度对比：更稳健、更高效、更安全
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {advantages.map((ad, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredAdvantage(idx)}
              onMouseLeave={() => setHoveredAdvantage(null)}
              className="bg-card rounded-2xl p-6 border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex items-start gap-4 relative overflow-hidden"
            >
              {/* 左侧色条：font-black + border-2 → font-black border-2 */}
              <div className={`absolute left-0 top-0 w-[4px] h-full transition-all duration-300 ${
                hoveredAdvantage === idx ? 'bg-primary' : ''
              }`} />
              <div className={`text-3xl font-black rounded-2xl w-14 h-14 shrink-0 flex items-center justify-center border-2 transition-all ${ad.color}`}>
                {ad.letter}
              </div>
              <div className="space-y-1 min-w-0 leading-normal">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block font-mono">ADVANTAGE_0{idx+1}</span>
                <span className="text-sm font-black text-foreground block">{ad.label}</span>
                <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">{ad.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FOOTER CTA ═══════ */}
      <section className="bg-gradient-to-r from-primary via-indigo-600 to-purple-700 text-white rounded-[28px] p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <h3 className="text-xl md:text-2xl font-black font-black">立即开启属于您企业的智能体之旅</h3>
          <p className="text-xs md:text-sm opacity-90 max-w-xl font-medium">
            点击前往控制台即可创建第一台数字员工智能体，享受 RAG 专业知识检索与高内聚工作流敏捷配置。
          </p>
        </div>
        {/* bg-white text-indigo-700 font-black → 保持 */}
        <Button
          variant="secondary"
          onClick={() => navigate('/agent/overview')}
          className="h-auto px-6 py-3.5 font-black rounded-xl text-xs gap-2 shadow shrink-0 whitespace-nowrap hover:scale-105"
        >
          立即体验 ⚡️
        </Button>
      </section>

    </div>
  );
}
