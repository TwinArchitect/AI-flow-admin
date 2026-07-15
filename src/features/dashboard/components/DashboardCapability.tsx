import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { capabilities } from '../dashboard.data';

export function DashboardCapability() {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <p className="text-primary font-black text-xs uppercase tracking-widest">CAPABILITIES</p>
          <h2 className="text-3xl font-black tracking-tight text-foreground">五大核心关键能力</h2>
        </div>
        {/* text-slate-400 → text-muted-foreground */}
        <p className="text-xs text-muted-foreground font-black max-w-sm hidden sm:block">
          全维度企业级底层配置，给到开发极致速度、高可用与高安全性体验。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {capabilities.map((cp, idx) => {
          const IconComp = cp.icon;
          return (
            <motion.div
              key={cp.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              {/* bg-white → bg-card */}
              <Card className="rounded-2xl border-border hover:shadow-md transition-all flex flex-col justify-between h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-widest bg-muted text-muted-foreground w-8 h-8 rounded-lg flex items-center justify-center border border-border">
                      {cp.num}
                    </span>
                    <div className={cn('p-2 rounded-xl bg-gradient-to-tr text-white shrink-0 shadow-sm', cp.gradient)}>
                      <IconComp size={16} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[17px] font-black text-foreground">{cp.title}</h3>
                    <p className="text-[11px] text-primary font-black">{cp.subtitle}</p>
                  </div>

                  <p className="text-xs text-muted-foreground leading-normal font-medium">{cp.desc}</p>

                  <div className="pt-4 mt-4 border-t border-border flex flex-wrap gap-1.5">
                    {cp.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] font-black">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
