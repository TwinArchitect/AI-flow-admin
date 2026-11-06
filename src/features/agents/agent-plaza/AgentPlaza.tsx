import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Bot,
  ChevronLeft,
  ChevronRight,
  Flame,
  Search,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizePath } from '@/features/permissions/routes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SquareAvatar } from './SquareAvatar';
import {
  getSquareBanners,
  getSquareLabels,
  querySquare,
  squareAssetUrl,
  type SquareBanner,
} from './squareApi';

const PAGE_SIZE = 20;
const fallbackBanners: SquareBanner[] = [
  {
    id: 'multimodal',
    title: '多模态数据标注方案',
    description: '开箱即用的数据标注工具箱，支持文本、图片、视频等场景大模型自动标注。',
    tag: '多模态标注',
    actionLabel: '立即体验',
  },
  {
    id: 'creative',
    title: 'AI 短剧创作工具箱',
    description: '产品级套件开箱即用，人人都是编导，自动生成动漫短剧与沉浸式剧本。',
    tag: '创意套件',
    actionLabel: '立即体验',
  },
];

export function AgentPlazaPage() {
  const navigate = useNavigate();
  const [labelId, setLabelId] = useState('all');
  const [featured, setFeatured] = useState(false);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [bannerIndex, setBannerIndex] = useState(0);
  const labelsQuery = useQuery({
    queryKey: ['square-labels'],
    queryFn: ({ signal }) => getSquareLabels(signal),
    retry: false,
  });
  const bannersQuery = useQuery({
    queryKey: ['square-banners'],
    queryFn: ({ signal }) => getSquareBanners(signal),
    retry: false,
  });
  const listQuery = useQuery({
    queryKey: ['square-agents', page, appliedSearch, labelId, featured],
    queryFn: ({ signal }) =>
      querySquare(
        {
          pageNum: page,
          pageSize: PAGE_SIZE,
          agentName: appliedSearch || undefined,
          squareLabelId: labelId === 'all' ? undefined : labelId,
          featured: featured || undefined,
        },
        signal
      ),
    retry: false,
  });
  const labels = labelsQuery.data ?? [];
  const banners = bannersQuery.data?.length ? bannersQuery.data : fallbackBanners;
  const currentIndex = bannerIndex % banners.length;
  const banner = banners[currentIndex];
  const records = listQuery.data?.records ?? [];
  const total = listQuery.data?.total ?? 0;
  const openBanner = () => {
    const target = banner.actionUrl?.trim();
    if (!target) return;
    if (banner.actionTarget === 'internal') {
      if (!target.startsWith('/') || target.startsWith('//')) {
        toast.error('站内跳转地址必须以 / 开头');
        return;
      }
      const path = target.split(/[?#]/, 1)[0];
      navigate(normalizePath(path) + target.slice(path.length));
      return;
    }
    try {
      const url = new URL(target);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('请输入有效的 http 或 https 跳转地址');
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <section
        aria-label="推荐应用"
        className="relative isolate flex min-h-52 shrink-0 items-center overflow-hidden rounded-2xl border border-primary/15 bg-primary/5 px-12 py-8 lg:min-h-60 lg:px-14"
      >
        {banner.imageFileId ? (
          <>
            <img
              src={squareAssetUrl(banner.imageFileId)}
              alt=""
              className="absolute inset-0 -z-20 size-full object-cover"
            />
            <div className="absolute inset-0 -z-10 bg-background/85" />
          </>
        ) : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-28 -z-10 size-96 rounded-full bg-primary/10 blur-3xl"
          />
        )}
        <div className="max-w-2xl space-y-3">
          <Badge variant="info">
            {banner.tag}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            {banner.title}
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">{banner.description}</p>
          <Button size="sm" onClick={openBanner} disabled={!banner.actionUrl}>
            {banner.actionLabel}
            <ArrowUpRight size={14} />
          </Button>
        </div>
        {!banner.imageFileId && (
          <div
            aria-hidden="true"
            className="ml-auto hidden size-28 shrink-0 items-center justify-center rounded-3xl border border-primary/10 bg-background/60 text-primary/50 lg:flex"
          >
            <Sparkles size={52} strokeWidth={1.25} />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="上一个推荐"
          onClick={() => setBannerIndex((currentIndex + banners.length - 1) % banners.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="下一个推荐"
          onClick={() => setBannerIndex((currentIndex + 1) % banners.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <ChevronRight />
        </Button>
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
          {banners.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`查看推荐 ${index + 1}`}
              aria-pressed={currentIndex === index}
              onClick={() => setBannerIndex(index)}
              className="flex h-5 w-6 items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn(
                  'h-1 rounded-full',
                  currentIndex === index ? 'w-5 bg-primary' : 'w-2 bg-primary/25'
                )}
              />
            </button>
          ))}
        </div>
      </section>

      <section aria-label="筛选智能体" className="shrink-0 space-y-4 border-b border-border pb-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">智能体广场</h2>
            <p className="text-xs text-muted-foreground">
              各类智能体的集中展示入口，汇聚不同业务场景下的智能体应用
            </p>
          </div>
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setAppliedSearch(search.trim());
              setPage(1);
            }}
          >
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                aria-label="搜索智能体名称"
                placeholder="搜索智能体名称"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 w-56 pl-9"
              />
            </div>
            <Button type="submit" size="sm">
              搜索
            </Button>
            <Button
              type="button"
              size="sm"
              variant={featured ? 'secondary' : 'outline'}
              aria-pressed={featured}
              onClick={() => {
                setFeatured(!featured);
                setPage(1);
              }}
              className={featured ? 'bg-primary/10 text-primary-text' : ''}
            >
              <Flame size={14} />
              精选
            </Button>
          </form>
        </div>
        <div className="flex flex-wrap items-center gap-2" aria-label="智能体分类">
          {[{ id: 'all', name: '全部' }, ...labels].map((label) => (
            <Button
              key={label.id}
              variant={labelId === label.id ? 'default' : 'ghost'}
              size="sm"
              aria-pressed={labelId === label.id}
              onClick={() => {
                setLabelId(label.id);
                setPage(1);
              }}
            >
              {label.name}
            </Button>
          ))}
          {labelsQuery.isPending && (
            <span className="text-xs text-muted-foreground" role="status">
              加载分类…
            </span>
          )}
          {labelsQuery.isError && (
            <Button variant="ghost" size="sm" onClick={() => void labelsQuery.refetch()}>
              分类加载失败，重试
            </Button>
          )}
        </div>
      </section>

      <div className="min-h-0 flex-1 overflow-y-auto" aria-busy={listQuery.isFetching}>
        {listQuery.isPending ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : listQuery.isError ? (
          <div
            role="alert"
            className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border"
          >
            <p className="text-sm text-destructive">
              {listQuery.error.message || '加载广场列表失败'}
            </p>
            <Button variant="outline" size="sm" onClick={() => void listQuery.refetch()}>
              重新加载
            </Button>
          </div>
        ) : records.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 text-center">
            <Bot size={28} className="mb-2 text-muted-foreground/50" />
            <p className="text-sm font-medium">暂无已上架智能体</p>
            <p className="text-xs text-muted-foreground">
              可在「我的智能体」发布并提交上架审核，通过后将出现在此处
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {records.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() =>
                  navigate(
                    `/agents/AgentPlaza/chat?agentId=${encodeURIComponent(agent.id)}&name=${encodeURIComponent(agent.agentName?.trim() || '智能体')}`
                  )
                }
                className="group flex gap-4 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <SquareAvatar agent={agent} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold group-hover:text-primary-text">
                      {agent.agentName || '未命名智能体'}
                    </h3>
                    <Badge variant="secondary" size="compact" className="max-w-24 shrink-0 truncate">
                      {labels.find((label) => label.id === agent.squareLabelId)?.name || '未分类'}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">
                    {agent.remark?.trim() || '暂无简介'}
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    上架 {agent.squareTime?.replace('T', ' ').slice(0, 16) || '-'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        pageCount={Math.ceil(total / PAGE_SIZE)}
        total={total}
        onPageChange={setPage}
        disabled={listQuery.isFetching || listQuery.isError}
        className="shrink-0 border-t border-border pt-4"
      />
    </div>
  );
}
