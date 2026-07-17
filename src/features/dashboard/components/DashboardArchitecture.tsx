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
 * 架构图 — 刻意深色背景，不跟随亮/暗切换。
 * TabsList / TabsTrigger 在此处覆写为暗色主题适配样式。
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
        <span className="absolute text-[8px] font-black text-slate-600 font-mono -right-9 bg-slate-950 px-1 border border-slate-800/20 rounded">
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
        <LayerLabel dotColor="bg-blue-500" labelColor="text-blue-400" label="用户层 (User Presentation)" />
        <div className="bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-around">
          {userLayerItems.map((item) => (
            <span key={item} className="px-3.5 py-1.5 bg-slate-900 text-xs font-black text-slate-200 border border-slate-800/35 rounded-xl flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <Connector gradient="from-blue-500/50 to-emerald-500/50" />

      {/* Layer 2: 智能体层 */}
      <div className="space-y-2">
        <LayerLabel dotColor="bg-emerald-500" labelColor="text-emerald-400" label="智能体层 (Multi-Agent Core)" />
        <div className="bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-3">
          {agentLayerItems.map((ag, i) => (
            <div key={ag.id} className={cn('bg-slate-900 p-3.5 rounded-xl border bg-gradient-to-tr flex flex-col items-center justify-center text-center leading-normal', ag.className)}>
              <span className="text-xs font-black">{ag.label}</span>
              <span className="text-[10px] opacity-75 mt-1 font-medium font-mono">NODE_0{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <Connector gradient="from-emerald-500/50 to-purple-500/50" />

      {/* Layer 3: 能力层 */}
      <div className="space-y-2">
        <LayerLabel dotColor="bg-purple-500" labelColor="text-purple-400" label="平台能力层 (Orchestration Engine)" />
        <div className="bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-3">
          {capabilityLayerItems.map((cap) => (
            <span key={cap.id} className="px-3.5 py-4 bg-slate-900 text-xs font-black text-slate-300 border border-slate-800/35 rounded-xl text-center flex flex-col justify-center">
              <span>{cap.name}</span>
              <span className="text-[9px] text-slate-500 font-mono mt-1">SERVICE</span>
            </span>
          ))}
        </div>
      </div>

      <Connector gradient="from-purple-500/50 to-amber-500/50" />

      {/* Layer 4: 模型层 */}
      <div className="space-y-2">
        <LayerLabel dotColor="bg-amber-500" labelColor="text-amber-400" label="模型层 (Unified Model Router)" />
        <div className="bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl flex flex-wrap gap-3.5 items-center justify-around">
          {modelLayerItems.map((md) => (
            <div key={md.id} className="px-3.5 py-2.5 bg-slate-900 border border-slate-800/40 rounded-xl flex flex-col shrink-0 min-w-[120px] text-center">
              <span className="text-xs font-black text-slate-200">{md.name}</span>
              <span className="text-[9px] text-slate-500 font-medium mt-0.5">{md.extra}</span>
            </div>
          ))}
        </div>
      </div>

      <Connector gradient="from-amber-500/50 to-rose-500/50" />

      {/* Layer 5: 数据层 */}
      <div className="space-y-2">
        <LayerLabel dotColor="bg-rose-500" labelColor="text-rose-400" label="数据层 (Enterprise Storage)" />
        <div className="bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4">
          {dataLayerItems.map((dt) => (
            <div key={dt.id} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/40">
              <span className="text-xs font-black text-slate-200 block">{dt.label}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{dt.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailsTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-200 text-xs leading-relaxed font-medium">
      <div className="bg-slate-900/50 border border-slate-800/40 p-5 rounded-2xl space-y-3">
        <h4 className="text-sm font-black text-blue-400 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-500 rounded-full" />
          自上而下：极速决策链路
        </h4>
        <p><strong>请求过滤：</strong>当用户在 WEB 控制台或手机端提交指令后，平台会将其导入安全过滤器进行严格的文本净化和红线审计。</p>
        <p><strong>角色映射：</strong>根据请求业务范畴，智能路由引擎在"智能体层"精准激活适配的 AI 巡检、分析或专家节点。</p>
        <p><strong>指令编排：</strong>通过"平台能力层"配置的流程图拓扑图（如分支判断、MCP工具拉取），自主补充任务相关上下文。</p>
      </div>
      <div className="bg-slate-900/50 border border-slate-800/40 p-5 rounded-2xl space-y-3">
        <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2">
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
        <p className="text-purple-400 font-black text-xs uppercase tracking-widest">ARCHITECT DESIGN</p>
        <h2 className="text-3xl font-black tracking-tight text-foreground">平台深度架构</h2>
        <p className="text-muted-foreground text-sm font-medium">
          多层高聚合技术蓝图，确保多数据打通、底层无缝链接与全闭环高灵敏控制
        </p>
      </div>

      {/* 手写 Tab → shadcn Tabs */}
      <Tabs defaultValue="flow">
        <div className="flex justify-center pb-2">
          <TabsList className="bg-slate-100 border ">
            <TabsTrigger value="flow" className="px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer text-xs font-black data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 text-slate-400">
              交互蓝图
            </TabsTrigger>
            <TabsTrigger value="details" className="px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer text-xs font-black data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 text-slate-400">
              流向与关联解析
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 架构图主体：刻意深色背景 */}
        <div className="bg-slate-950 p-6 md:p-8 rounded-[28px] border border-slate-900/40 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

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
