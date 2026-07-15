import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { platformCapabilities, aiRoles } from '../dashboard.data';

export function DashboardOverview() {
  return (
    <section className="space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <p className="text-primary font-black text-xs uppercase tracking-widest">ABOUT PLATFORM</p>
        <h2 className="text-3xl font-black tracking-tight text-foreground">什么是智能体平台</h2>
        {/* 次要说明：text-slate-400 → text-muted-foreground */}
        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
          面向企业级应用而设计的 AI 智能体一站式开发、运营与保障平台，打破数据孤岛，赋能流程重塑，通过三大核心价值。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Card 1: 六大核心能力 */}
        {/* bg-slate-50 + rounded-[24px] → bg-muted rounded-2xl */}
        <Card className="bg-muted rounded-2xl border-border shadow-sm">
          <CardContent className="px-8 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full" />
                六大核心能力底座
              </h3>
              <p className="text-xs text-muted-foreground font-medium">汇聚底层能力，支撑企业智能升级</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {platformCapabilities.map((item) => {
                const IconComp = item.icon;
                return (
                  <div key={item.id} className="bg-background p-4 rounded-2xl border border-border flex gap-3 leading-normal">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-muted', item.col)}>
                      <IconComp size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-foreground">{item.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-1 font-medium">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: AI 融入企业流程 */}
        <Card className="bg-muted rounded-2xl border-border shadow-sm">
          <CardContent className="px-8 space-y-6 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                  让 AI 深度融入企业生产经营流程
                </h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  不止于信息生成，更能够连接业务系统、调用工具能力、执行复杂流程，实现从感知、分析到执行的全流程闭环。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-2">
                {aiRoles.map((role) => (
                  <div key={role.id} className="bg-background p-3.5 rounded-2xl border border-border flex items-start gap-2.5">
                    <span className="text-emerald-500 shrink-0 font-black text-xs">✓</span>
                    <div>
                      <h4 className="text-xs font-black text-foreground">{role.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{role.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 底部提示：bg-brand-50/50 → bg-primary/5 */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3.5 items-center mt-4">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-primary font-black text-sm">✓</span>
              </div>
              <div>
                <p className="text-xs font-black text-foreground">面向千行百业</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal font-medium">
                  内置丰富的行业大纲规程模板，助力生产、金融、工业安监、日常政务工作流迅速搭积木式闭环配置。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
