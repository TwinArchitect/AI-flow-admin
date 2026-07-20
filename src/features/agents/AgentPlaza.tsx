import { useState } from 'react';
import {
  BookOpen,
  Eye,
  Download,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Gauge,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ====== Banner 数据 ======

interface BannerItem {
  id: string;
  title: string;
  desc: string;
  tag: string;
  bgGradient: string;
  graphic: React.ReactNode;
}

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
          {[18, 32, 24, 42, 28, 36, 48, 20, 30].map((h, i) => (
            <span
              key={i}
              style={{ height: `${h}%` }}
              className="w-2 bg-gradient-to-t from-emerald-400 via-teal-400 to-indigo-400 rounded-t-sm"
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

// ====== 智能体广场数据 ======

interface PlazaAgent {
  id: string;
  title: string;
  desc: string;
  views: number;
  copies: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  category: string;
}

/** 多模态知识问答卡片（渐变顶栏视觉风格） */
interface KnowledgeAgent {
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

// ====== 分类定义 ======

const categories = ['全部', '办公', '安全', '运行', '检修'] as const;

// ====== 每条 1 条假数据 ======

const standardAgents: PlazaAgent[] = [
  {
    id: 'plaza-office',
    title: '基础法律问答助手',
    desc: '基础法律知识的智能问答助手，基于现行法律法规、司法解释及权威案例为基础解决日常合规诉求。',
    views: 11758, copies: 4973,
    icon: BookOpen,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    category: '办公',
  },
  {
    id: 'plaza-safety',
    title: '安全隐患智能化分析专家',
    desc: '自动识别巡检照片或现场截图中的人员违章和物理隐患，一键生成整改防护方案及对应的安全规章制度援引。',
    views: 16830, copies: 4255,
    icon: ShieldAlert,
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    category: '安全',
  },
  {
    id: 'plaza-operation',
    title: '发电机组深度寻优建议',
    desc: '动态捕获真空度、排烟温升及机组振动测点指标，通过能效标杆数据库得出降耗空间。',
    views: 19280, copies: 8930,
    icon: Gauge,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    category: '运行',
  },
  {
    id: 'plaza-maintenance',
    title: '油浸式变压器缺陷根源溯源',
    desc: '分析油中溶解气体谱图，研判变压器局部过热、电弧放电等内部早期异常缺陷位置。',
    views: 13950, copies: 5932,
    icon: Activity,
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
    category: '检修',
  },
];

const knowledgeAgents: KnowledgeAgent[] = [
  {
    id: 'plaza-knowledge',
    title: 'ChatPDF 企业知识库问答',
    desc: '上传 PDF 文档后可用自然语言对话，毫秒级追溯企业技术规程及运营方案细则。',
    views: 8570, copies: 8868,
    gradient: 'from-slate-100 to-slate-300 dark:from-slate-800 dark:to-slate-900',
    innerGradient: 'from-blue-600 to-indigo-500',
    techLabel: 'File Schema Search',
    category: '办公',
  },
];

// ====== 按分类索引 ======

const standardByCategory = new Map<string, PlazaAgent>(
  standardAgents.map((a) => [a.category, a]),
);

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
    <div className="h-full overflow-y-auto bg-page">
      <div className="space-y-14 pb-16">

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
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-white text-slate-900 font-bold rounded-xl text-xs hover:bg-slate-100 transition"
                >
                  <span>立即体验</span>
                  <ExternalLink size={12} />
                </button>
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

          <button
            type="button"
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 border border-white/15 flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 border border-white/15 flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {bannerItems.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => switchBanner(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
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

        {/* ====== 1. 基础办公套件（标准卡片 + 多模态知识问答视觉卡片） ====== */}
        {isVisible('办公') && (
          <>
            {/* 基础办公套件 */}
            <SectionHeading label="基础办公套件" accentColor="bg-primary" />
            <StandardCardGrid agents={[standardByCategory.get('办公')!]} />

            {/* 多模态知识问答（办公大类下，视觉风格不同） */}
            <SectionHeading label="多模态知识问答" accentColor="bg-primary" />
            <KnowledgeCardGrid agents={knowledgeAgents.filter((a) => a.category === '办公')} />
          </>
        )}

        {/* ====== 2. 安全智能体套件 ====== */}
        {isVisible('安全') && (
          <>
            <SectionHeading label="安全智能体套件" accentColor="bg-destructive" />
            <StandardCardGrid agents={[standardByCategory.get('安全')!]} />
          </>
        )}

        {/* ====== 3. 智能运行分析套件 ====== */}
        {isVisible('运行') && (
          <>
            <SectionHeading label="智能运行分析套件" accentColor="bg-blue-500" />
            <StandardCardGrid agents={[standardByCategory.get('运行')!]} />
          </>
        )}

        {/* ====== 4. 精益检修支撑套件 ====== */}
        {isVisible('检修') && (
          <>
            <SectionHeading label="精益检修支撑套件" accentColor="bg-violet-500" />
            <StandardCardGrid agents={[standardByCategory.get('检修')!]} />
          </>
        )}
      </div>
    </div>
  );
}

// ====== 提取的纯渲染组件 ======

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
  if (agents.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="flex gap-4 p-5 rounded-xl border border-line bg-surface shadow-sm cursor-pointer transition-shadow hover:shadow-md"
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
            <div className="flex items-center gap-1.5 pt-1">
              <Badge variant="secondary" className="text-[10px]">{agent.category}</Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 多模态知识问答卡片（渐变顶栏 + 线框装饰 + 底部信息） */
function KnowledgeCardGrid({ agents }: { agents: KnowledgeAgent[] }) {
  if (agents.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {agents.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-line bg-surface overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
        >
          {/* 渐变顶栏 + 线框装饰 */}
          <div className={cn('h-36 p-4 relative flex flex-col justify-between overflow-hidden bg-gradient-to-tr', item.gradient)}>
            <div className="flex items-center justify-between relative z-10 w-full">
              <span className="text-[9px] font-mono uppercase bg-background/70 text-fg px-2 py-0.5 rounded-md font-bold tracking-wider border border-line/50 backdrop-blur-sm">
                {item.techLabel}
              </span>
              <Sparkles size={14} className="text-fg-muted" />
            </div>
            {/* 线框装饰 */}
            <div className="relative w-full h-16 bg-background/80 rounded-xl border border-line/30 p-2.5 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="flex gap-1.5">
                <span className={cn('w-4 h-1.5 rounded-full', item.innerGradient, 'bg-gradient-to-r')} />
                <span className="w-10 h-1.5 bg-muted rounded-full" />
              </div>
              <div className="w-full h-2.5 bg-muted rounded-md" />
              <div className="flex justify-between items-center">
                <div className="w-12 h-1.5 bg-muted rounded-full" />
                <span className={cn('w-3.5 h-3.5 rounded-full flex items-center justify-center', item.innerGradient, 'bg-gradient-to-r')}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              </div>
            </div>
          </div>

          {/* 底部信息 */}
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
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
          </div>
        </div>
      ))}
    </div>
  );
}
