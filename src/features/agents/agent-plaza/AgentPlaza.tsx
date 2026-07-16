import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Download,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  categories,
  knowledgeAgents,
  getStandardByCategory,
  type PlazaAgent,
  type KnowledgeAgent,
} from './plazaAgents';

// ====== Banner 数据 ======

interface BannerItem {
  id: string;
  title: string;
  desc: string;
  tag: string;
  bgGradient: string;
  graphic: React.ReactNode;
}

const bannerChartBars = [
  { id: 'bar-1', h: 'h-[18%]' },
  { id: 'bar-2', h: 'h-[32%]' },
  { id: 'bar-3', h: 'h-[24%]' },
  { id: 'bar-4', h: 'h-[42%]' },
  { id: 'bar-5', h: 'h-[28%]' },
  { id: 'bar-6', h: 'h-[36%]' },
  { id: 'bar-7', h: 'h-[48%]' },
  { id: 'bar-8', h: 'h-[20%]' },
  { id: 'bar-9', h: 'h-[30%]' },
] as const;

const bannerItems: BannerItem[] = [
  {
    id: 'banner-1',
    tag: '多模态标注',
    title: '多模态数据标注方案',
    desc: '开箱即用的数据标注工具箱，支持文本、图片、视频等场景大模型自动标注。',
    bgGradient: 'bg-gradient-to-r from-blue-600/90 via-indigo-600/85 to-violet-600/95',
    graphic: (
      <div className="relative w-72 h-36 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md overflow-hidden flex flex-col justify-between p-4 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="font-mono text-[10px] text-white/80 font-bold uppercase tracking-wider">
            Multimodal Pipeline Active
          </span>
        </div>
        <div className="flex gap-2.5 justify-center h-14 items-end">
          {bannerChartBars.map((b) => (
            <span
              key={b.id}
              className={cn('w-2 bg-gradient-to-t from-emerald-400 via-teal-400 to-indigo-400 rounded-t-sm', b.h)}
            />
          ))}
        </div>
        <div className="text-[10px] text-white/60 font-medium">Text, Image & Video Tokenizer</div>
      </div>
    ),
  },
  {
    id: 'banner-2',
    tag: '创意套件',
    title: 'AI 短剧创作工具箱',
    desc: '产品级套件开箱即用，人人都是编导，自动生成动漫短剧与沉浸式剧本。',
    bgGradient: 'bg-gradient-to-r from-rose-500/95 via-pink-600/90 to-amber-500/90',
    graphic: (
      <div className="relative w-72 h-36 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md overflow-hidden flex flex-col justify-between p-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-amber-300" />
          <span className="font-mono text-[10px] text-white/80 font-bold uppercase tracking-wider">
            Creative Studio Engine
          </span>
        </div>
        <div className="py-2">
          <p className="text-xs text-white font-bold leading-tight line-clamp-2">
            「荧幕绽放」自动化生成序列...
          </p>
          <p className="text-[9px] text-white/50 mt-0.5">漫画图转视频已渲染完成，耗时0.8秒</p>
        </div>
        <div className="flex justify-between items-center">
          <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="w-[85%] h-full bg-amber-400" />
          </div>
          <span className="text-[10px] text-amber-300 font-bold">85% RENDERING</span>
        </div>
      </div>
    ),
  },
];

// ====== 组件 ======

export function AgentPlazaPage() {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [fading, setFading] = useState(false);

  const currentBanner = bannerItems[bannerIndex];

  const switchBanner = (next: number) => {
    if (fading) return;
    setFading(true);
    setTimeout(() => {
      setBannerIndex(next);
      setFading(false);
    }, 200);
  };

  const goPrev = () => switchBanner(bannerIndex === 0 ? bannerItems.length - 1 : bannerIndex - 1);
  const goNext = () => switchBanner(bannerIndex === bannerItems.length - 1 ? 0 : bannerIndex + 1);

  const isVisible = (cat: string) =>
    activeCategory === '全部' || activeCategory === cat;

  return (
    <div className="h-full overflow-y-auto">
      <div className="h-full space-y-14 pb-16">
        {/* ====== Banner 轮播 ====== */}
        <div className="relative h-80 rounded-3xl overflow-hidden bg-slate-950 border border-slate-800/30">
          <div
            className={cn(
              'absolute inset-0 transition-opacity duration-300',
              currentBanner.bgGradient,
              fading ? 'opacity-0' : 'opacity-100',
            )}
          />
          <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-white/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-[130px]" />

          <div
            className={cn(
              'relative z-10 flex items-center h-full px-8 lg:px-14 transition-opacity duration-300',
              fading ? 'opacity-0' : 'opacity-100',
            )}
          >
            <div className="max-w-xl space-y-3">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 border border-white/20 text-[10px] font-bold tracking-widest uppercase text-white">
                {currentBanner.tag}
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
                {currentBanner.title}
              </h1>
              <p className="text-white/80 text-sm leading-relaxed font-medium max-w-md">
                {currentBanner.desc}
              </p>
              <div className="pt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl text-xs"
                >
                  <span>立即体验</span>
                  <ExternalLink size={12} />
                </Button>
              </div>
            </div>
          </div>

          <div
            className={cn(
              'absolute inset-y-0 right-0 w-1/2 flex items-center justify-center opacity-90 transition-opacity duration-300',
              fading ? 'opacity-0' : 'opacity-100',
            )}
          >
            {currentBanner.graphic}
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 border border-white/15 text-white"
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 border border-white/15 text-white"
          >
            <ChevronRight size={20} />
          </Button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {bannerItems.map((item, i) => (
              <Button
                key={item.id}
                variant="ghost"
                size="icon-sm"
                onClick={() => switchBanner(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300 p-0 min-w-0',
                  bannerIndex === i ? 'w-5 bg-white' : 'w-1.5 bg-white/50',
                )}
              />
            ))}
          </div>
        </div>

        {/* ====== 标题 + 分类筛选 ====== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-fg">智能体广场</h2>
            <p className="text-xs text-fg-muted">
              各类智能体的集中展示入口，汇聚不同业务场景下的智能体应用
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className="text-xs h-8"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* ====== 办公（标准卡片 + 多模态知识问答视觉卡片） ====== */}
        {isVisible('办公') && (
          <div className="space-y-4">
            <SectionHeading label="基础办公套件" accentColor="bg-primary" />
            <StandardCardGrid agents={getStandardByCategory('办公')} />
          </div>
        )}
        {isVisible('办公') && (
          <div className="space-y-4">
            <SectionHeading label="多模态知识问答" accentColor="bg-primary" />
            <KnowledgeCardGrid agents={knowledgeAgents.filter((a) => a.category === '办公')} />
          </div>
        )}
        {/* ====== 安全 ====== */}
        {isVisible('安全') && (
          <div className="space-y-4">
            <SectionHeading label="安全智能体套件" accentColor="bg-destructive" />
            <StandardCardGrid agents={getStandardByCategory('安全')} />
          </div>
        )}

        {/* ====== 运行 ====== */}
        {isVisible('运行') && (
          <div className="space-y-4">
            <SectionHeading label="智能运行分析套件" accentColor="bg-blue-500" />
            <StandardCardGrid agents={getStandardByCategory('运行')} />
          </div>
        )}

        {/* ====== 检修 ====== */}
        {isVisible('检修') && (
          <div className="space-y-4">
            <SectionHeading label="精益检修支撑套件" accentColor="bg-violet-500" />
            <StandardCardGrid agents={getStandardByCategory('检修')} />
          </div>
        )}
      </div>
    </div>
  );
}

// ====== 渲染组件 ======

function SectionHeading({ label, accentColor }: { label: string; accentColor: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn('w-1.5 h-4 rounded-full', accentColor)} />
      <h3 className="text-base font-semibold text-fg">{label}</h3>
    </div>
  );
}

/** 标准卡片网格 */
function StandardCardGrid({ agents }: { agents: PlazaAgent[] }) {
  const navigate = useNavigate();
  if (agents.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <Card
          key={agent.id}
          onClick={() => navigate(`/agents/AgentPlaza/chat?title=${encodeURIComponent(agent.title)}`)}
          className="flex flex-row gap-4 p-5 border-line bg-surface cursor-pointer transition-shadow hover:shadow-md"
        >
          <div className={cn('h-12 w-12 rounded-xl shrink-0 flex items-center justify-center', agent.iconBg)}>
            <agent.icon className={cn('h-6 w-6', agent.iconColor)} />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-fg truncate">{agent.title}</h4>
              <div className="flex items-center gap-3 text-fg-muted text-[10px] font-mono shrink-0">
                <span className="flex items-center gap-1"><Eye size={12} />{agent.views.toLocaleString()}</span>
                <span className="flex items-center gap-1"><Download size={11} />{agent.copies.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-fg-muted leading-relaxed line-clamp-2">{agent.desc}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

/** 多模态知识问答卡片（渐变顶栏 + 线框装饰 + 底部信息） */
function KnowledgeCardGrid({ agents }: { agents: KnowledgeAgent[] }) {
  const navigate = useNavigate();
  if (agents.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {agents.map((item) => (
        <Card
          key={item.id}
          onClick={() => navigate(`/agents/AgentPlaza/chat?title=${encodeURIComponent(item.title)}`)}
          className="border-line bg-surface overflow-hidden cursor-pointer transition-shadow hover:shadow-md p-0"
        >
          <div className={cn('h-36 p-4 relative flex flex-col justify-between overflow-hidden bg-gradient-to-tr rounded-t-xl', item.gradient)}>
            <div className="flex items-center justify-between relative z-10 w-full">
              <Badge
                variant="outline"
                className="text-[9px] font-mono uppercase bg-background/70 text-fg font-bold tracking-wider border-line/50 backdrop-blur-sm"
              >
                {item.techLabel}
              </Badge>
              <Sparkles size={14} className="text-fg-muted" />
            </div>
            <div className="relative w-full h-16 bg-background/80 rounded-xl border border-line/30 p-2.5 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="flex gap-1.5">
                <span className={cn('w-4 h-1.5 rounded-full', item.innerGradient, 'bg-gradient-to-r')} />
                <span className="w-10 h-1.5 bg-muted rounded-full" />
              </div>
              <div className="w-full h-2.5 bg-muted rounded-md" />
              <div className="flex justify-between items-center">
                <div className="w-12 h-1.5 bg-muted rounded-full" />
                <span className={cn('w-3.5 h-3.5 rounded-full flex items-center justify-center', item.innerGradient, 'bg-gradient-to-r')}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              </div>
            </div>
          </div>

          <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-fg">{item.title}</h4>
              <p className="text-xs text-fg-muted leading-relaxed">{item.desc}</p>
            </div>
            <div className="flex items-center justify-between pt-3.5 border-t border-line text-[10px] text-fg-muted font-mono">
              <span className="flex items-center gap-1.5">
                <Eye size={13} />{item.views} 浏览
              </span>
              <span className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-md">
                <Download size={11} />{item.copies} 引用
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
