import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Globe, Lock, Activity, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { heroQuickTags, innerHeroCards } from '../dashboard.data';

export function DashboardHero() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'outer' | 'inner'>('outer');

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card/95 p-8 text-card-foreground shadow-card backdrop-blur-xl md:p-12 dark:bg-card/85">
      <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.035] via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-card via-card/80 to-transparent" />

      {/* 内外模式切换 */}
      <div className="absolute top-0 right-0 z-40 group p-10 select-none">
        <div className="pointer-events-none flex items-center gap-1 rounded-2xl border border-border bg-background/90 p-1.5 opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
          <Button
            variant={mode === 'inner' ? 'default' : 'ghost'}
            size="xs"
            onClick={() => setMode('inner')}
            className={cn('rounded-xl text-xs font-black', mode !== 'inner' && 'text-muted-foreground hover:text-foreground')}
          >
            内
          </Button>
          <Button
            variant={mode === 'outer' ? 'default' : 'ghost'}
            size="xs"
            onClick={() => setMode('outer')}
            className={cn('rounded-xl text-xs font-black', mode !== 'outer' && 'text-muted-foreground hover:text-foreground')}
          >
            外
          </Button>
        </div>
      </div>

      {/* 代码装饰背景 */}
      <div className="absolute right-0 top-0 hidden h-full w-1/2 select-none overflow-hidden pr-8 pt-8 font-mono text-[9px] text-muted-foreground opacity-10 lg:block">
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

              <h1 className="text-4xl font-black leading-none tracking-tight text-foreground md:text-5xl lg:text-[54px]">
                智能体平台 <br />
                <span className="mt-2 block text-foreground">
                  让每一家企业都拥有自己的<span className="text-primary">AI员工</span>
                </span>
              </h1>

              <p className="max-w-xl text-sm font-medium leading-relaxed text-muted-foreground md:text-base">
                构建企业专属智能体，将知识库、业务系统与大模型能力进行融合，实现AI能力在各类业务场景中的快速落地。
              </p>

              <div className="py-2">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">一个平台，打造无限智能应用：</p>
                <div className="flex flex-wrap gap-2">
                  {heroQuickTags.map((item) => (
                    <span key={item.label} className={cn('text-xs font-black px-3.5 py-1.5 rounded-xl border', item.className)}>
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button onClick={() => navigate('/agents/myAgents')} className="group h-auto gap-2 rounded-2xl px-6 py-3.5 text-xs font-black shadow-lg">
                  立即创建智能体
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/agents/knowledge')} className="h-auto rounded-2xl px-6 py-3.5 text-xs font-black">
                  探索知识库
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
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-[11px] font-black uppercase tracking-wider text-primary">
                <Globe size={12} className="animate-pulse" />
                智能体平台 v1.0
              </div>

              <h1 className="text-4xl font-black leading-[1] tracking-tight text-foreground md:text-5xl lg:text-[46px]">
                打造企业自主可控的 <br />
                <span className="mt-2 block text-foreground">
                  <span className="text-primary">AI</span> 基础生态与智能体大脑
                </span>
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                {innerHeroCards.map((card) => (
                  <div
                    key={card.id}
                    className="group relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-2xl border border-border bg-background/70 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="absolute right-4 top-3 select-none font-mono text-3xl font-black text-muted-foreground/10 transition-colors duration-300 group-hover:text-primary/10">
                      {card.num}
                    </span>
                    <div>
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300', card.iconBg)}>
                        {card.id === 'independent' ? <Lock size={16} /> : card.id === 'upgrade' ? <Activity size={16} /> : <Database size={16} />}
                      </div>
                      <h3 className="mb-1.5 text-sm font-black leading-snug tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary">
                        {card.title}
                      </h3>
                      <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Button onClick={() => navigate('/agents/myAgents')} className="group h-auto gap-2 rounded-2xl px-6 py-3 text-xs font-black shadow-lg">
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
