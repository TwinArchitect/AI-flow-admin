import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getAgent } from '../api/agentApi';
import AgentTrafficMonitor from './AgentTrafficMonitor';
import { AgentPublishChannelPanel } from './AgentPublishChannelPanel';

/** 两种编排页共享当前智能体的监控和渠道入口。 */
export function AgentOperationsButtons({ agentId }: { agentId?: string }) {
  const [panel, setPanel] = useState<'traffic' | 'channels' | null>(null);
  const agent = useQuery({ queryKey: ['agents', 'operations', agentId], queryFn: () => getAgent(agentId!), enabled: Boolean(agentId) && panel === 'channels' });
  return <>
    <Button variant="outline" size="sm" disabled={!agentId} onClick={() => setPanel('traffic')}><Activity size={14} />流量监控</Button>
    <Button variant="outline" size="sm" disabled={!agentId} onClick={() => setPanel('channels')}><ExternalLink size={14} />发布渠道</Button>
    <Dialog open={panel != null} onOpenChange={(open) => !open && setPanel(null)}>
      <DialogContent className={panel === 'traffic' ? 'flex h-[85vh] flex-col overflow-hidden sm:max-w-6xl' : 'flex max-h-[85vh] flex-col overflow-hidden sm:max-w-6xl'}>
        <DialogHeader className="shrink-0"><DialogTitle>{panel === 'traffic' ? '流量监控' : '发布渠道'}</DialogTitle><DialogDescription>{panel === 'traffic' ? '查看当前智能体的运行统计与趋势。' : '将当前智能体嵌入业务页面，或通过开放 API 调用。'}</DialogDescription></DialogHeader>
        <div className={panel === 'traffic' ? 'contents' : 'min-h-0 overflow-y-auto'}>
        {panel === 'traffic' && agentId ? <AgentTrafficMonitor key={agentId} agentId={agentId} onError={toast.error} /> : panel === 'channels' && agent.isLoading ? <p className="text-sm text-muted-foreground">加载中...</p> : panel === 'channels' && agent.data ? <AgentPublishChannelPanel key={agentId} agent={agent.data} /> : panel === 'channels' && agent.isError ? <div className="text-sm text-destructive">渠道加载失败 <Button variant="outline" size="sm" onClick={() => void agent.refetch()}>重试</Button></div> : null}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
