import { useEffect, useRef, useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { useThemeStore } from '@/stores/theme';
import type { EChartsBlockPayload } from './richContent';

function isPayload(value: unknown): value is EChartsBlockPayload {
  if (!value || typeof value !== 'object') return false;
  const option = (value as Partial<EChartsBlockPayload>).option;
  return Boolean(option && typeof option === 'object' && !Array.isArray(option));
}

export function EChartsMessageBlock({ payload }: { payload: unknown }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = useThemeStore((state) => state.isDark);
  const [loading, setLoading] = useState(true);
  const validPayload = isPayload(payload) ? payload : null;

  useEffect(() => {
    if (!containerRef.current || !validPayload) return;
    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;
    let chart: import('echarts').ECharts | undefined;

    void import('echarts').then((echarts) => {
      if (disposed || !containerRef.current) return;
      chart = echarts.init(containerRef.current, isDark ? 'dark' : undefined, { renderer: 'canvas' });
      chart.setOption({
        backgroundColor: 'transparent',
        animationDuration: 350,
        aria: { enabled: true },
        ...validPayload.option,
      }, { notMerge: true });
      resizeObserver = new ResizeObserver(() => chart?.resize());
      resizeObserver.observe(containerRef.current);
      setLoading(false);
    });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      chart?.dispose();
    };
  }, [isDark, validPayload]);

  if (!validPayload) return null;
  return (
    <section className="min-w-[280px] overflow-hidden rounded-md border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs font-medium text-foreground">
        <BarChart3 size={14} className="text-primary" />
        数据图表
      </header>
      <div className="relative h-72 w-full p-2">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />加载图表
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" aria-label="数据图表" />
      </div>
    </section>
  );
}
