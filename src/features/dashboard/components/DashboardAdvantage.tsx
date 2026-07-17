import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { advantages } from '../dashboard.data';

export function DashboardAdvantage() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <p className="text-rose-400 font-black text-xs uppercase tracking-widest">PRODUCT ADVANTAGES</p>
        <h2 className="text-3xl font-black tracking-tight text-foreground">选择睿创的六大硬核优势</h2>
        <p className="text-muted-foreground text-sm font-medium">
          全行业、多网联合落地的深度对比：更稳健、更高效、更安全
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {advantages.map((ad) => (
          <Card
            key={ad.id}
            onMouseEnter={() => setHoveredId(ad.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/30 transition-all duration-350 transform hover:-translate-y-1 hover:shadow-md flex items-start gap-4 relative overflow-hidden"
          >
            {/* 左侧高亮色条 */}
            {/* <div className={cn('absolute left-0 top-0 w-[4px] h-full transition-all duration-300', hoveredId === ad.id ? 'bg-primary' : '')} /> */}
            <div className={`absolute left-0 top-0 w-[4px] h-full transition-all duration-300 ${
                hoveredId === ad.id ? 'bg-primary' : ''
              }`} />
            <CardContent className="p-6 flex items-start gap-4">
              <div className={cn('text-3xl font-black rounded-2xl w-14 h-14 shrink-0 flex items-center justify-center border-2 transition-all', ad.color)}>
                {ad.letter}
              </div>
              <div className="space-y-1 min-w-0 leading-normal">
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block font-mono">ADVANTAGE_{ad.id.toUpperCase()}</span>
                <span className="text-sm font-black text-foreground block">{ad.label}</span>
                <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">{ad.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
