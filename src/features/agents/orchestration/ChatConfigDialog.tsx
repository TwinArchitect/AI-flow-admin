import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ChatAgentConfig } from './chatAgentConfig';

function Detail({ label, value }: { label: string; value: string | number }) {
  return <div className="flex justify-between gap-4 py-1 text-xs"><dt className="shrink-0 text-muted-foreground">{label}</dt><dd className="min-w-0 break-words text-right">{value}</dd></div>;
}

export function ChatConfigDialog({ config, onClose }: { config: ChatAgentConfig; onClose: () => void }) {
  const json = JSON.stringify(config, null, 2);
  const knowledge = config.skills.knowledge;
  const copy = async () => {
    try { await navigator.clipboard.writeText(json); toast.success('配置 JSON 已复制'); }
    catch { toast.error('复制失败，请在 JSON 页签手动复制'); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="sm:max-w-3xl">
    <DialogHeader><DialogTitle>对话式智能体配置</DialogTitle><DialogDescription>当前编辑态的配置概览和 JSON；保存后写入 agentSetting。</DialogDescription></DialogHeader>
    <Tabs defaultValue="overview"><div className="flex items-center justify-between gap-3"><TabsList><TabsTrigger value="overview">结构化预览</TabsTrigger><TabsTrigger value="json">JSON</TabsTrigger></TabsList><Button size="sm" variant="outline" onClick={() => void copy()}><Copy size={14} />复制 JSON</Button></div>
      <TabsContent value="overview" className="max-h-[60vh] overflow-y-auto"><div className="grid gap-3 sm:grid-cols-2">
        <section className="space-y-2 rounded-lg border border-border p-4"><h3 className="text-sm font-semibold">基础信息与人设</h3><dl><Detail label="名称" value={config.basic.name} /><Detail label="简介" value={config.basic.intro || '—'} /></dl><p className="whitespace-pre-wrap break-words text-xs leading-5">{config.basic.persona}</p></section>
        <section className="space-y-2 rounded-lg border border-border p-4"><h3 className="text-sm font-semibold">对话与规划</h3><dl><Detail label="模型" value={config.dialogue.plan?.model || config.dialogue.plan?.modelId || '未选择'} /><Detail label="深度推理" value={config.dialogue.enableThinking ? '开启' : '关闭'} /><Detail label="上传 / 猜你想问" value={`${config.dialogue.fileUploadEnabled ? '开启' : '关闭'} / ${config.dialogue.autoFollowUp ? '开启' : '关闭'}`} /><Detail label="工具轮数 / 策略" value={`${config.dialogue.maxToolRounds} / ${config.dialogue.toolChoice}`} /><Detail label="温度 / Token" value={`${config.dialogue.temperature} / ${config.dialogue.maxTokens}`} /></dl><p className="whitespace-pre-wrap text-xs">{config.dialogue.opening}</p><ul className="space-y-1 text-xs">{config.dialogue.openingQuestions.filter((item) => item.trim()).map((item, index) => <li key={index}>{item}</li>)}</ul></section>
        <section className="space-y-2 rounded-lg border border-border p-4"><h3 className="text-sm font-semibold">输入变量</h3>{config.dialogue.inputVariables.map((item) => <dl key={item.key} className="rounded border border-border p-2"><Detail label={item.label || item.key} value={`${item.valueType} · ${item.required ? '必填' : '选填'}`} /><Detail label="默认值" value={item.defaultValue || '—'} />{item.maxLength != null && <Detail label="最大长度" value={item.maxLength} />}</dl>)}</section>
        <section className="space-y-2 rounded-lg border border-border p-4"><h3 className="text-sm font-semibold">知识库</h3><dl><Detail label="检索模式" value={`${knowledge.retrievalMode} / ${knowledge.searchMode}`} /><Detail label="相似度 / 条数" value={`${knowledge.similarity} / ${knowledge.limit}`} /><Detail label="向量权重" value={knowledge.embeddingWeight} /><Detail label="重排" value={knowledge.usingReRank ? knowledge.rerankModel || '开启，未选择模型' : '关闭'} /><Detail label="重排权重" value={knowledge.rerankWeight} /></dl><p className="text-xs">{knowledge.datasets.map((item) => item.name || item.datasetId).join('、') || '未绑定'}</p></section>
        <section className="space-y-2 rounded-lg border border-border p-4"><h3 className="text-sm font-semibold">工具与技能</h3><dl><Detail label="HTTP" value={config.skills.httpTools.map((item) => item.name || item.id).join('、') || '未绑定'} />{config.skills.mcpServers.map((item) => <Detail key={item.id} label={`MCP · ${item.name || item.id}`} value={item.enabledToolNames?.join('、') || '服务内已启用工具'} />)}{config.skills.workflows.map((item) => <Detail key={item.id} label={`工作流 · ${item.name || item.id}`} value={item.publishedOnly === false ? '含草稿' : '仅发布'} />)}</dl></section>
        <section className="space-y-2 rounded-lg border border-border p-4"><h3 className="text-sm font-semibold">记忆</h3><dl><Detail label="长期记忆" value={config.memory.longTermMemory ? '开启' : '关闭'} /><Detail label="记忆库" value={config.memory.memoryDatasetId || '未指定'} /><Detail label="上下文轮数" value={config.memory.contextRounds} /></dl></section>
      </div></TabsContent><TabsContent value="json"><pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-4 text-xs leading-5">{json}</pre></TabsContent>
    </Tabs>
  </DialogContent></Dialog>;
}
