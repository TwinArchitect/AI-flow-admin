import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Globe, Lock, Activity, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { heroQuickTags, innerHeroCards } from '../dashboard.data';

/**
 * Hero 品牌展示区 — 刻意深色背景，不跟随亮/暗切换。
 * 此处保留 bg-slate-950 / text-slate-* 等固定色值是设计意图，
 * 不属于需要清理的"普通业务区域"。
 */

export function DashboardHero() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'outer' | 'inner'>('outer');

  return (
    <section className="relative overflow-hidden rounded-[32px] bg-slate-950 border border-slate-900 p-8 md:p-12 text-white shadow-2xl">
      {/* 光晕：indigo-900 替代 #312e81 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,indigo-900,transparent_50%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-10" />

      {/* 内外模式切换 */}
      <div className="absolute top-0 right-0 z-40 group p-10 select-none">
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-2xl gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 shadow-2xl backdrop-blur-md">
          <Button
            variant={mode === 'inner' ? 'default' : 'ghost'}
            size="xs"
            onClick={() => setMode('inner')}
            className={cn('rounded-xl text-xs font-black', mode !== 'inner' && 'text-slate-400 hover:text-slate-200')}
          >
            内
          </Button>
          <Button
            variant={mode === 'outer' ? 'default' : 'ghost'}
            size="xs"
            onClick={() => setMode('outer')}
            className={cn('rounded-xl text-xs font-black', mode !== 'outer' && 'text-slate-400 hover:text-slate-200')}
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
          {mode === 'outer' ? (
            <motion.div
              key="outer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 max-w-5xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-[11px] font-black uppercase tracking-wider text-primary/80">
                <Sparkles size={12} className="animate-pulse" />
                智能体平台 v1.0
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight leading-none text-slate-100">
                智能体平台 <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-300 to-rose-400 mt-2 block">
                  让每一家企业都拥有自己的AI员工
                </span>
              </h1>

              <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl font-medium">
                构建企业专属智能体，将知识库、业务系统与大模型能力进行融合，实现AI能力在各类业务场景中的快速落地。
              </p>

              <div className="py-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">一个平台，打造无限智能应用：</p>
                <div className="flex flex-wrap gap-2">
                  {heroQuickTags.map((item) => (
                    <span key={item.label} className={cn('text-xs font-black px-3.5 py-1.5 rounded-xl border', item.className)}>
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button onClick={() => navigate('/agent/overview')} className="h-auto px-6 py-3.5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 font-black rounded-2xl text-xs gap-2 shadow-lg group">
                  立即创建智能体
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/agent/square')} className="h-auto px-6 py-3.5 bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 font-black rounded-2xl text-xs">
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

              <h1 className="text-4xl md:text-5xl lg:text-[46px] font-black tracking-tight leading-[1] text-slate-100">
                打造企业自主可控的 <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 mt-2 block">
                  AI 基础生态与智能体大脑
                </span>
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                {innerHeroCards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-slate-900/35 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 relative overflow-hidden transition-all duration-500 hover:border-slate-700/80 hover:bg-slate-900/50 hover:-translate-y-1 shadow-xl group flex flex-col justify-between min-h-[180px]"
                  >
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-indigo-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="absolute top-3 right-4 font-mono font-black text-3xl text-slate-800/20 select-none group-hover:text-blue-500/10 transition-colors duration-500">
                      {card.num}
                    </span>
                    <div>
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300', card.iconBg)}>
                        {card.id === 'independent' ? <Lock size={16} /> : card.id === 'upgrade' ? <Activity size={16} /> : <Database size={16} />}
                      </div>
                      <h3 className="text-sm font-black text-slate-100 mb-1.5 leading-snug tracking-tight group-hover:text-blue-300 transition-colors duration-300">
                        {card.title}
                      </h3>
                      <p className="text-slate-400 text-[11px] leading-relaxed font-black">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Button onClick={() => navigate('/agent/overview')} className="h-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 font-black rounded-2xl text-xs gap-2 shadow-lg group">
                  开启智能生态重塑
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
