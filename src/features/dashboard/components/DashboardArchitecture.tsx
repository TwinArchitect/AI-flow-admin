import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  userLayerItems,
  agentLayerItems,
  capabilityLayerItems,
  modelLayerItems,
  dataLayerItems,
} from '../dashboard.data';

/**
 * 架构图全部使用项目语义色，随亮暗主题切换。
 */

function LayerLabel({ dotColor, labelColor, label }: { dotColor: string; labelColor: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
      <span className={cn('font-mono text-[10px] font-black uppercase tracking-widest', labelColor)}>{label}</span>
    </div>
  );
}

function Connector({ gradient }: { gradient: string }) {
  return (
    <div className="h-6 flex items-center justify-center">
      <div className={cn('w-[1px] h-full bg-gradient-to-b relative', gradient)}>
        <span className="absolute -right-9 rounded border border-border bg-card px-1 font-mono text-[8px] font-black text-muted-foreground">
          DATA_SYNC
        </span>
      </div>
    </div>
  );
}

function FlowTab() {
  return (
    <div className="space-y-6">
      {/* Layer 1: 用户层 */}
      <div className="space-y-2">
        <LayerLabel dotColor="bg-blue-500" labelColor="text-blue-600 dark:text-blue-400" label="用户层 (User Presentation)" />
        <div className="flex flex-wrap items-center justify-around gap-3 rounded-2xl border border-border bg-muted/50 p-4">
          {userLayerItems.map((item) => (
            <span key={item} className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-black text-foreground">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <Connector gradient="from-primary/50 to-primary/20" />

      {/* Layer 2: 智能体层 */}
      <div className="space-y-2">
        <LayerLabel dotColor="bg-emerald-500" labelColor="text-emerald-600 dark:text-emerald-400" label="智能体层 (Multi-Agent Core)" />
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-muted/50 p-4 md:grid-cols-5">
          {agentLayerItems.map((ag, i) => (
            <div key={ag.id} className={cn('flex flex-col items-center justify-center rounded-xl border bg-card p-3.5 text-center leading-normal', ag.className)}>
              <span className="text-xs font-black">{ag.label}</span>
              <span className="text-[10px] opacity-75 mt-1 font-medium font-mono">NODE_0{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <Connector gradient="from-primary/50 to-primary/20" />

      {/* Layer 3: 能力层 */}
      <div className="space-y-2">
        <LayerLabel dotColor="bg-primary" labelColor="text-primary" label="平台能力层 (Orchestration Engine)" />
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-muted/50 p-4 md:grid-cols-5">
          {capabilityLayerItems.map((cap) => (
            <span key={cap.id} className="flex flex-col justify-center rounded-xl border border-border bg-card px-3.5 py-4 text-center text-xs font-black text-foreground">
              <span>{cap.name}</span>
              <span className="mt-1 font-mono text-[9px] text-muted-foreground">SERVICE</span>
            </span>
          ))}
        </div>
      </div>

      <Connector gradient="from-primary/50 to-primary/20" />

      {/* Layer 4: 模型层 */}
      <div className="space-y-2">
        <LayerLabel dotColor="bg-amber-500" labelColor="text-amber-600 dark:text-amber-400" label="模型层 (Unified Model Router)" />
        <div className="flex flex-wrap items-center justify-around gap-3.5 rounded-2xl border border-border bg-muted/50 p-4">
          {modelLayerItems.map((md) => (
            <div key={md.id} className="flex min-w-[120px] shrink-0 flex-col rounded-xl border border-border bg-card px-3.5 py-2.5 text-center">
              <span className="text-xs font-black text-foreground">{md.name}</span>
              <span className="mt-0.5 text-[9px] font-medium text-muted-foreground">{md.extra}</span>
            </div>
          ))}
        </div>
      </div>

      <Connector gradient="from-primary/50 to-primary/20" />

      {/* Layer 5: 数据层 */}
      <div className="space-y-2">
        <LayerLabel dotColor="bg-rose-500" labelColor="text-rose-600 dark:text-rose-400" label="数据层 (Enterprise Storage)" />
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-muted/50 p-4 md:grid-cols-4">
          {dataLayerItems.map((dt) => (
            <div key={dt.id} className="rounded-xl border border-border bg-card p-3">
              <span className="block text-xs font-black text-foreground">{dt.label}</span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">{dt.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailsTab() {
  return (
    <div className="grid grid-cols-1 gap-6 text-xs font-medium leading-relaxed text-foreground md:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h4 className="flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-400">
          <span className="w-1.5 h-4 bg-blue-500 rounded-full" />
          自上而下：极速决策链路
        </h4>
        <p><strong>请求过滤：</strong>当用户在 WEB 控制台或手机端提交指令后，平台会将其导入安全过滤器进行严格的文本净化和红线审计。</p>
        <p><strong>角色映射：</strong>根据请求业务范畴，智能路由引擎在"智能体层"精准激活适配的 AI 巡检、分析或专家节点。</p>
        <p><strong>指令编排：</strong>通过"平台能力层"配置的流程图拓扑图（如分支判断、MCP工具拉取），自主补充任务相关上下文。</p>
      </div>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h4 className="flex items-center gap-2 text-sm font-black text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
          自下而上：高安全数据兜底
        </h4>
        <p><strong>私有隔离：</strong>所有涉及企业核心敏感资产（如生产安规、员工名册、设备协议等）均沉淀在"数据层"本地隔离数据库。</p>
        <p><strong>多模融合：</strong>支持工业摄像头视频帧动态解析，多模态引擎自动对视频中的违章操作标绘并转换为警报对象，完成事件全纪录。</p>
        <p><strong>模型适配：</strong>完美支持本地大模型离线部署（如通义千问本地蒸馏版等），实现彻底的"数据不出域"。</p>
      </div>
    </div>
  );
}

export function DashboardArchitecture() {
  return (
    <section className="space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-primary">ARCHITECT DESIGN</p>
        <h2 className="text-3xl font-black tracking-tight text-foreground">平台深度架构</h2>
        <p className="text-muted-foreground text-sm font-medium">
          多层高聚合技术蓝图，确保多数据打通、底层无缝链接与全闭环高灵敏控制
        </p>
      </div>

      {/* 手写 Tab → shadcn Tabs */}
      <Tabs defaultValue="flow">
        <div className="flex justify-center pb-2">
          <TabsList className="border border-border bg-muted">
            <TabsTrigger value="flow" className="cursor-pointer rounded-lg px-4 py-1.5 text-xs font-black text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground">
              交互蓝图
            </TabsTrigger>
            <TabsTrigger value="details" className="cursor-pointer rounded-lg px-4 py-1.5 text-xs font-black text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground">
              流向与关联解析
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <TabsContent value="flow" className="mt-0">
            <FlowTab />
          </TabsContent>
          <TabsContent value="details" className="mt-0">
            <DetailsTab />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
