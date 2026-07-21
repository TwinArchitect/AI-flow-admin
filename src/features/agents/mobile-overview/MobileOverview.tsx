import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  SendHorizontal,
  TrendingUp,
  AlertTriangle,
  FileText,
  BookOpen,
  Smartphone,
  Wifi,
  Battery,
  Signal,
  ArrowLeft,
  ChevronRight,
  Info,
  MonitorSmartphone,
  Bot,
  User,
  Zap,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Message, PhoneTheme, MessageCustomType } from './types';
import { prohibitions, citations, chartData, pieData, quickActions, totalViolations } from './mockData';

// -------------------------------------------------------------
// Mobile-Optimized Sub-components for Rich Agent responses
// -------------------------------------------------------------

const MobileSafeProhibitionsResponse = () => (
  <div className="mt-2.5 space-y-3 text-slate-850 dark:text-slate-100">
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100/60 dark:border-slate-800/80 rounded-2xl p-3.5">
      <h4 className="text-[12px] font-black text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/60 pb-2">
        <BookOpen size={13} className="text-brand-500 shrink-0" />
        防人身伤害"十条禁令"细则
      </h4>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {prohibitions.map((item) => (
          <div
            key={item.num}
            className="flex gap-2.5 p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-100/60 dark:border-slate-800 hover:shadow-xs transition-all"
          >
            <span className="text-[10px] font-black text-brand-500 bg-brand-50 dark:bg-brand-500/10 w-5.5 h-5.5 rounded-lg flex items-center justify-center shrink-0">
              {item.num}
            </span>
            <div className="min-w-0 flex-1">
              <dt className="text-[11px] font-bold text-slate-800 dark:text-slate-250 truncate">{item.title}</dt>
              <dd className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 leading-relaxed">{item.desc}</dd>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-blue-50/40 dark:bg-blue-500/5 border border-blue-100/40 dark:border-blue-900/10 rounded-2xl p-3">
      <h5 className="text-[11px] font-bold text-blue-800 dark:text-blue-300 mb-1.5 flex items-center gap-1.5">
        <FileText size={12} className="shrink-0" />
        引用文献与规程
      </h5>
      <div className="space-y-1.5">
        {citations.map((cit) => (
          <div
            key={cit.code}
            className="flex items-center justify-between text-[10px] bg-white/70 dark:bg-slate-950/40 p-1.5 rounded-lg border border-blue-50/50 dark:border-blue-950/10"
          >
            <span className="text-slate-650 dark:text-slate-350 truncate font-semibold">{cit.title}</span>
            <span className="font-mono text-slate-400 text-[9px] shrink-0">{cit.code}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MobileDataAnalysisChart = () => (
  <div className="mt-2.5 space-y-3">
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100/60 dark:border-slate-800/80 rounded-2xl p-3.5">
      <h4 className="text-[12px] font-black text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <TrendingUp size={13} className="text-emerald-500 shrink-0" />
        电厂进出人数统计趋势 (人)
      </h4>

      <div className="h-36 w-full -ml-8">
        <ResponsiveContainer width="112%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="mobileColorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="mobileColorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: '10px',
                fontSize: '9px',
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e2e8f0',
                color: '#1e293b',
              }}
            />
            <Area type="monotone" dataKey="进站" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#mobileColorIn)" />
            <Area type="monotone" dataKey="出站" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#mobileColorOut)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
        <div className="bg-white dark:bg-slate-950 p-2 text-center rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[9px] text-slate-400 block font-semibold">周累计进站</span>
          <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">1,105人</span>
        </div>
        <div className="bg-white dark:bg-slate-950 p-2 text-center rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[9px] text-slate-400 block font-semibold">周累计出站</span>
          <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">1,099人</span>
        </div>
      </div>
    </div>
  </div>
);

const MobileAntiViolationChart = () => (
  <div className="mt-2.5 space-y-3">
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100/60 dark:border-slate-800/80 rounded-2xl p-3.5">
      <h4 className="text-[12px] font-black text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <AlertTriangle size={13} className="text-rose-500 animate-pulse shrink-0" />
        今日安监违章分布比例 (共 {totalViolations} 起)
      </h4>

      <div className="flex flex-col items-center gap-2">
        {/* Pie chart */}
        <div className="h-28 w-28 relative flex items-center justify-center my-1.5">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={38}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute text-center">
            <span className="text-[10px] font-black text-rose-500">{totalViolations}起</span>
          </div>
        </div>

        {/* Bar indicators */}
        <div className="w-full space-y-1.5">
          {pieData.map((item) => {
            const pct = ((item.value / totalViolations) * 100).toFixed(0);
            return (
              <div key={item.name} className="space-y-0.5">
                <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className="flex items-center gap-1 text-slate-650 dark:text-slate-350 truncate max-w-32">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="text-slate-500 dark:text-slate-450 shrink-0">
                    {item.value}起 ({pct}%)
                  </span>
                </div>
                <div className="h-1 w-full bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2.5 p-2 text-[10px] bg-rose-50 dark:bg-rose-950/15 border border-rose-100/40 dark:border-rose-900/10 rounded-xl flex gap-1.5 items-start">
        <AlertTriangle size={12} className="text-rose-500 mt-0.5 shrink-0" />
        <div className="text-rose-700 dark:text-rose-350 leading-relaxed font-semibold">
          安监部责令3号冷却塔隐患区域暂停施工全员重训！
        </div>
      </div>
    </div>
  </div>
);

export default function AgentMobileOverview() {
  const [phoneTheme, setPhoneTheme] = useState<PhoneTheme>('iphone-light');
  const [hidePhoneFrame, setHidePhoneFrame] = useState(true);
  const [modelType, setModelType] = useState('Gemini 1.5 Pro');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTime, setCurrentTime] = useState('12:00');

  // Track the reactive mockup time
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    };
    update();
    const timer = setInterval(update, 15000);
    return () => clearInterval(timer);
  }, []);

  const [messageQueue, setMessageQueue] = useState<Message[]>([
    {
      id: 'welcome-assistant',
      role: 'assistant',
      content:
        '您好！我是您的智能体伙伴（移动端适配模式已启动📱）。您可以像在网页端一样向我发送语音或文本。输入「人数统计」、「违章占比」或「十条禁令」，我将为您展示完美适配移动设备界面的动态交互卡片。请问有什么我可以帮您的吗？',
      timestamp: '14:20',
    },
  ]);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const container = chatScrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageQueue, isTyping]);

  const handleSendText = (text: string) => {
    if (!text.trim()) return;

    let customType: MessageCustomType | undefined;
    const lowerText = text.toLowerCase();

    if (lowerText.includes('十条') || lowerText.includes('禁令') || lowerText.includes('安全规范')) {
      customType = 'safe-management';
    } else if (lowerText.includes('人') || lowerText.includes('人数') || lowerText.includes('人数统计') || lowerText.includes('趋势') || lowerText.includes('统计')) {
      customType = 'data-analysis';
    } else if (lowerText.includes('违章') || lowerText.includes('占比') || lowerText.includes('安全帽') || lowerText.includes('事件')) {
      customType = 'anti-violation';
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessageQueue((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      let responseText = '';
      if (customType === 'safe-management') {
        responseText =
          '好的，关于咱们电力企业落实的"十条禁令"（防止高空坠落、电气绝缘、不合规作业、违规特种操作、擅闯受限空间等核心安全红线），我已经为您整理出最精简的移动端释义索引：';
      } else if (customType === 'data-analysis') {
        responseText =
          '了解！已为您提取出在移动考勤网关侧记录的近7天电厂现场施工班组及外协人员进出站最高峰及趋势数值：';
      } else if (customType === 'anti-violation') {
        responseText =
          '今日安全督考智能摄像头及网格员交叉复盘发现的安监红线事件总体分布统计如下。冷却塔区域需要重点纠偏：';
      } else {
        responseText = `收到您的消息！您说的是：「${text}」。作为一个电力安监领域的多模态智能体，我可以时刻协助您检索知识管理、下发插件指令并进行安监数据汇总。如果想测试移动端交互展示，试试点击左侧的控制台面板快捷键吧！`;
      }

      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        customType,
      };

      setMessageQueue((prev) => [...prev, agentMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleResetChat = () => {
    setMessageQueue([
      {
        id: 'welcome-assistant',
        role: 'assistant',
        content: '移动端会话状态已成功重置。请输入或在左侧快捷控制台点击需要演示的功能！',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-6 pb-20 font-sans">
      {/* Header section */}
      <div className="bg-gradient-to-r from-brand-600/10 via-indigo-650/5 to-transparent p-6 rounded-[28px] border border-slate-100 dark:border-slate-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-2.5 py-1 bg-brand-50/50 dark:bg-brand-950/20 text-brand-650 dark:text-brand-300 font-black tracking-widest uppercase text-[10px] rounded-lg border border-brand-100 dark:border-brand-900/30">
            MOBILE UX DEMONSTRATOR
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-2">
            <MonitorSmartphone className="text-brand-600 w-6 h-6 shrink-0" />
            样式示例
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            本模块专门将「概览页」的 AI 混合问答、多维图表数据汇报、电力防护规范检索设计为<strong>高保真移动 APP 视图</strong>。通过该示例展示平台在移动端及嵌入式场景下的适配能力。
          </p>
        </div>

        {/* Theme & Frame controls */}
        <div className="flex flex-wrap bg-slate-50 dark:bg-slate-850 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shrink-0 gap-2 self-stretch md:self-auto justify-center items-center">
          <div className="flex bg-slate-100 dark:bg-slate-800/40 p-1 rounded-xl gap-1">
            {[
              { key: 'iphone-light' as PhoneTheme, label: '晨曦白' },
              { key: 'iphone-dark' as PhoneTheme, label: '太空灰' },
              { key: 'huaneng-blue' as PhoneTheme, label: '华能蓝' },
            ].map((t) => (
              <Button
                key={t.key}
                variant="ghost"
                onClick={() => setPhoneTheme(t.key)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[10.5px] font-black cursor-pointer h-auto',
                  phoneTheme === t.key
                    ? t.key === 'iphone-dark'
                      ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-900'
                      : t.key === 'huaneng-blue'
                        ? 'bg-[#2559F6] text-white shadow-sm hover:bg-[#2559F6]'
                        : 'bg-white text-slate-800 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                {t.label}
              </Button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700/60 hidden sm:block" />

          <Button
            variant="ghost"
            onClick={() => setHidePhoneFrame(!hidePhoneFrame)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-[10.5px] font-black cursor-pointer h-auto border',
              hidePhoneFrame
                ? 'bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-500/15 hover:bg-brand-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            )}
          >
            <Smartphone size={12} className={hidePhoneFrame ? 'animate-pulse' : ''} />
            {hidePhoneFrame ? '显示手机外框' : '隐藏手机外框'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Control Console */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick interactive controller */}
          <div className="bg-white dark:bg-slate-900/60 p-6 rounded-[28px] border border-slate-100 dark:border-slate-800/40 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800/80 pb-3">
              <Zap className="text-amber-500" size={16} />
              <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">
                AI 模拟操作控制台
              </h2>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                无需手动输入，点击下方带有高阶分析、安全指引、规则检索的快捷<strong> Prompt
                注入键</strong>，我们将模拟真实移动端用户触摸发送，调用 Reranker 与模型服务后进行动态响应。
              </p>

              <div className="space-y-2.5">
                {quickActions.map((act) => (
                  <Button
                    key={act.label}
                    variant="ghost"
                    onClick={() => handleSendText(act.prompt)}
                    className="w-full text-left p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-900 hover:shadow-md transition-all group flex items-start justify-between cursor-pointer h-auto"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 group-hover:text-brand-600 transition-colors">
                        {act.label}
                      </span>
                      <p className="text-[10px] text-slate-400 font-medium">{act.desc}</p>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-slate-350 mt-1 transition-transform group-hover:translate-x-1"
                    />
                  </Button>
                ))}
              </div>

              {/* Reset button */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={handleResetChat}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-350 text-[11px] font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer h-auto"
                >
                  <RefreshCw size={12} />
                  重置演示会话
                </Button>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-slate-50/50 dark:bg-slate-900/20 p-5 rounded-[24px] border border-slate-100/50 dark:border-slate-800/30 space-y-3">
            <h3 className="text-[11px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
              <Info size={13} />
              移动端专属重构优化细节
            </h3>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
              {[
                {
                  strong: '手势优化：',
                  text: '将传统侧边对话栏转化为弹出上拉框或纯屏单会话，为移动用户省去繁复的双边分抽屉操作。',
                },
                {
                  strong: '数据卡片折叠：',
                  text: '由于移动端宽度不超过360px，高空禁令列表支持精简化排版，避免传统宽表格带来的左右滑动恶劣体验。',
                },
                {
                  strong: '图表宽度自适应：',
                  text: '将 Recharts 设置百分比宽度及负边距消除轴线冗余间隙，使大盘走势图完美贴合微信小程序或钉钉轻应用容器规格。',
                },
              ].map((item) => (
                <li key={item.strong} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                  <span>
                    <strong>{item.strong}</strong>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Center / Right: Phone Chassis */}
        <div className="lg:col-span-7 flex justify-center items-center">
          <div className="relative">
            {/* Phone shell decoration shadow */}
            {!hidePhoneFrame && (
              <div className="absolute -inset-1 blur-2xl rounded-[56px] opacity-15 dark:opacity-30 bg-gradient-to-tr from-brand-600 to-indigo-650 animate-pulse duration-5000" />
            )}

            {/* Hardware frame wrapper */}
            <div
              className={cn(
                'relative transition-all duration-300 flex flex-col overflow-hidden',
                hidePhoneFrame
                  ? cn(
                      'w-[360px] h-[700px] rounded-[24px] border shadow-xl',
                      phoneTheme === 'iphone-dark'
                        ? 'bg-slate-950 border-slate-850 text-slate-100 shadow-slate-950/50'
                        : phoneTheme === 'huaneng-blue'
                          ? 'bg-[#f4f7fb] border-[#c6d8fc] text-slate-850 shadow-blue-500/10'
                          : 'bg-white border-slate-100 text-slate-850 shadow-slate-200/40'
                    )
                  : cn(
                      'w-[370px] h-[760px] rounded-[52px] border-[12px] p-2 shadow-2xl',
                      phoneTheme === 'iphone-dark'
                        ? 'bg-black border-[#222224] text-white shadow-[#000000]/60'
                        : phoneTheme === 'huaneng-blue'
                          ? 'bg-[#0b2b8c] border-[#133cb4] text-white shadow-[#2559F6]/20'
                          : 'bg-slate-100 border-slate-300 text-slate-900 shadow-slate-200/50'
                    )
              )}
            >
              {/* Dynamic Island notch */}
              {!hidePhoneFrame && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110px] h-7 bg-black rounded-full z-40 flex items-center justify-around px-2.5 transition-all">
                  <span className="w-2.5 h-2.5 bg-[#0a0c1a] border border-[#1e293b] rounded-full" />
                  <span className="w-1.5 h-1.5 bg-[#080d2c] rounded-full" />
                </div>
              )}

              {/* Status bar */}
              {!hidePhoneFrame && (
                <div className="h-9 px-6 flex items-center justify-between text-[11px] font-black z-30 shrink-0 font-sans tracking-wide">
                  <div>{currentTime}</div>
                  <div className="flex items-center gap-1.5 select-none text-[10px]">
                    <Signal size={11} className="text-current shrink-0" />
                    <span className="font-mono">5G</span>
                    <Wifi size={11} className="text-current shrink-0" />
                    <Battery size={13} className="text-current shrink-0" />
                  </div>
                </div>
              )}

              {/* Main screen */}
              <div
                className={cn(
                  'flex-1 overflow-hidden flex flex-col relative z-20 transition-colors duration-200',
                  hidePhoneFrame ? 'rounded-[24px]' : 'rounded-[38px]',
                  phoneTheme === 'iphone-dark'
                    ? 'bg-slate-950 text-slate-100'
                    : phoneTheme === 'huaneng-blue'
                      ? 'bg-[#f4f7fb] text-slate-800'
                      : 'bg-white text-slate-800'
                )}
              >
                {/* Mobile Top App Header bar */}
                <div
                  className={cn(
                    'h-20 p-4 border-b shrink-0 flex items-center justify-between z-10 transition-colors duration-200',
                    phoneTheme === 'huaneng-blue'
                      ? 'bg-[#2559F6] border-[#1141df] text-white'
                      : 'bg-white/70 dark:bg-slate-950/70 border-slate-100 dark:border-slate-905 backdrop-blur-md'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={handleResetChat}
                      className={cn(
                        'p-1 rounded-lg transition-colors h-auto',
                        phoneTheme === 'huaneng-blue'
                          ? 'text-white/80 hover:bg-[#1141df] hover:text-white'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                      )}
                    >
                      <ArrowLeft size={16} />
                    </Button>
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center border shrink-0 transition-colors',
                        phoneTheme === 'huaneng-blue'
                          ? 'bg-white/20 border-white/25 text-white'
                          : 'bg-brand-500/10 border-brand-500/20 text-brand-600'
                      )}
                    >
                      <Bot size={16} />
                    </div>
                    <div>
                      <h4
                        className={cn(
                          'text-[12px] font-black leading-tight transition-colors',
                          phoneTheme === 'huaneng-blue' ? 'text-white' : 'text-slate-900 dark:text-white'
                        )}
                      >
                        电力安监AI助手
                      </h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full animate-pulse',
                            phoneTheme === 'huaneng-blue' ? 'bg-sky-300' : 'bg-emerald-500'
                          )}
                        />
                        <span
                          className={cn(
                            'text-[8px] font-bold uppercase tracking-wider transition-colors',
                            phoneTheme === 'huaneng-blue' ? 'text-sky-200' : 'text-slate-400'
                          )}
                        >
                          {modelType}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Model selector */}
                  <Select value={modelType} onValueChange={setModelType}>
                    <SelectTrigger
                      className={cn(
                        'h-auto rounded-lg text-[9px] font-black pl-2 pr-5 py-1 border gap-0 [&>svg]:size-3',
                        phoneTheme === 'huaneng-blue'
                          ? 'bg-[#1141df] border-[#0e35bb] text-white'
                          : phoneTheme === 'iphone-dark'
                            ? 'bg-slate-200 border-slate-300 text-slate-900'
                            : 'bg-slate-50 border-slate-100 text-slate-650'
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className={cn(
                        phoneTheme === 'iphone-dark'
                          ? 'bg-slate-200 text-slate-900 border-slate-300'
                          : phoneTheme === 'huaneng-blue'
                            ? 'bg-[#2559F6] text-white border-[#0e35bb]'
                            : ''
                      )}
                    >
                      <SelectItem value="Gemini 1.5 Pro">Gemini 1.5</SelectItem>
                      <SelectItem value="Gemini Flash">Gemini Flash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Chat area */}
                <div
                  ref={chatScrollRef}
                  className={cn(
                    'flex-1 overflow-y-auto p-4 space-y-4 transition-colors duration-200',
                    phoneTheme === 'huaneng-blue'
                      ? 'bg-[#f4f7fb]'
                      : 'bg-slate-50/40 dark:bg-[#060810]/40'
                  )}
                >
                  <AnimatePresence initial={false}>
                    {messageQueue.map((msg) => {
                      const isUser = msg.role === 'user';
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={cn('flex items-start gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}
                        >
                          {/* Avatar */}
                          <div
                            className={cn(
                              'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border text-[11px]',
                              isUser
                                ? phoneTheme === 'huaneng-blue'
                                  ? 'bg-[#1141df] text-white border-[#0e35bb]'
                                  : 'bg-slate-900 text-white border-slate-950 dark:bg-slate-800'
                                : phoneTheme === 'huaneng-blue'
                                  ? 'bg-[#2559F6] text-white border-[#1c4dec]'
                                  : 'bg-brand-500 text-white border-brand-600'
                            )}
                          >
                            {isUser ? <User size={13} /> : <Sparkles size={11} />}
                          </div>

                          {/* Balloon body */}
                          <div className="space-y-0.5 max-w-[80%]">
                            <div
                              className={cn(
                                'p-3 rounded-2xl text-[11.5px] leading-relaxed relative',
                                isUser
                                  ? phoneTheme === 'huaneng-blue'
                                    ? 'bg-[#2559F6] text-white rounded-tr-none shadow-md font-semibold'
                                    : 'bg-brand-600 text-white rounded-tr-none shadow-sm font-semibold'
                                  : phoneTheme === 'iphone-dark'
                                    ? 'bg-slate-900 text-slate-100 rounded-tl-none border border-slate-800/80'
                                    : phoneTheme === 'huaneng-blue'
                                      ? 'bg-white text-slate-850 rounded-tl-none border border-[#e2e8f1] shadow-xs'
                                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-sm'
                              )}
                            >
                              {msg.content}

                              {msg.customType === 'safe-management' && <MobileSafeProhibitionsResponse />}
                              {msg.customType === 'data-analysis' && <MobileDataAnalysisChart />}
                              {msg.customType === 'anti-violation' && <MobileAntiViolationChart />}
                            </div>
                            <span
                              className={cn(
                                'text-[8.5px] text-slate-400 font-bold block px-1',
                                isUser ? 'text-right' : 'text-left'
                              )}
                            >
                              {msg.timestamp}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex items-start gap-2.5">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-colors',
                          phoneTheme === 'huaneng-blue'
                            ? 'bg-[#2559F6] text-white border-[#1c4dec]'
                            : 'bg-brand-500 text-white border-brand-600'
                        )}
                      >
                        <Sparkles size={11} />
                      </div>
                      <div
                        className={cn(
                          'p-3 rounded-2xl',
                          phoneTheme === 'iphone-dark'
                            ? 'bg-slate-900 border border-slate-800'
                            : phoneTheme === 'huaneng-blue'
                              ? 'bg-white border border-[#e2e8f1] shadow-xs'
                              : 'bg-white border border-slate-100 shadow-xs'
                        )}
                      >
                        <div className="flex gap-1 items-center py-1">
                          <span
                            className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
                            style={{ animationDelay: '0ms' }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
                            style={{ animationDelay: '150ms' }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
                            style={{ animationDelay: '300ms' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom quick chips */}
                <div
                  className={cn(
                    'px-3 py-2 border-t shrink-0 flex gap-2 overflow-x-auto transition-colors duration-200',
                    phoneTheme === 'huaneng-blue'
                      ? 'bg-[#f4f7fb] border-[#e2e8f1]'
                      : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-900'
                  )}
                >
                  {[
                    { label: '📈 进出趋势', prompt: '现场人数统计怎么样？' },
                    { label: '🚨 违章占比', prompt: '今天有哪些违章情况？' },
                    { label: '📜 安全红线', prompt: '查看电力安规十条禁令' },
                  ].map((chip) => (
                    <Button
                      key={chip.label}
                      variant="ghost"
                      onClick={() => handleSendText(chip.prompt)}
                      className={cn(
                        'px-3 py-1 rounded-full text-[10px] font-black border whitespace-nowrap cursor-pointer transition-all h-auto',
                        phoneTheme === 'huaneng-blue'
                          ? 'bg-white text-[#2559F6] border-[#2559F6]/25 hover:bg-[#2559F6]/5'
                          : phoneTheme === 'iphone-dark'
                            ? 'bg-white text-slate-900 border-slate-300 hover:bg-slate-100'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-650 border-slate-100'
                      )}
                    >
                      {chip.label}
                    </Button>
                  ))}
                </div>

                {/* Mobile Input */}
                <div
                  className={cn(
                    'px-3.5 pb-4 pt-2 border-t shrink-0 transition-colors duration-200',
                    phoneTheme === 'huaneng-blue'
                      ? 'bg-[#f4f7fb] border-[#e2e8f1]'
                      : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-900'
                  )}
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendText(inputValue);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <Input
                      type="text"
                      placeholder="发送指令或与 AI 助手沟通..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className={cn(
                        'flex-1 h-auto px-3.5 py-2 rounded-2xl text-[11px] font-semibold border outline-none focus:ring-1 focus:ring-brand-500/20 transition-all shadow-none',
                        phoneTheme === 'huaneng-blue'
                          ? 'bg-white border-[#d2dfec] text-slate-850 focus:border-[#2559F6]'
                          : 'bg-slate-50 dark:bg-[#090d16] border-slate-100 dark:border-slate-850 text-slate-850 dark:text-white'
                      )}
                    />
                    <Button
                      type="submit"
                      size="icon-xs"
                      disabled={!inputValue.trim()}
                      className={cn(
                        'rounded-full transition-all',
                        inputValue.trim()
                          ? phoneTheme === 'huaneng-blue'
                            ? 'bg-[#2559F6] text-white active:scale-90 shadow-md shadow-blue-500/10 hover:bg-[#2559F6]'
                            : 'bg-brand-600 text-white active:scale-90 shadow-md hover:bg-brand-600'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-400'
                      )}
                    >
                      <SendHorizontal size={13} />
                    </Button>
                  </form>
                </div>
              </div>

              {/* Home Indicator */}
              {!hidePhoneFrame && (
                <div className="h-6 flex items-center justify-center shrink-0 z-30 select-none">
                  <span
                    className={cn(
                      'w-[110px] h-1.5 rounded-full',
                      phoneTheme === 'iphone-dark' ? 'bg-white/40' : 'bg-slate-400/50'
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
