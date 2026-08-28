import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { publishAgent } from '@/features/agents/api/agentApi';

export function WorkflowPublishDialog({
  agentId,
  agentName,
  open,
  onOpenChange,
}: {
  agentId: string;
  agentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [publishRemark, setPublishRemark] = useState('');
  const publishMutation = useMutation({
    mutationFn: () => publishAgent(agentId, publishRemark),
    onSuccess: async (record) => {
      const version = record.version == null ? '' : ` v${record.version}`;
      toast.success(`智能体已发布${version}`);
      setPublishRemark('');
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (error) => {
      toast.error('发布失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (publishMutation.isPending) return;
        if (!nextOpen) setPublishRemark('');
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>发布智能体</DialogTitle>
          <DialogDescription>
            将当前已保存配置发布为正式版本：{agentName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <label htmlFor="workflow-publish-remark" className="text-xs font-medium text-foreground">
            发布说明（可选）
          </label>
          <Textarea
            id="workflow-publish-remark"
            value={publishRemark}
            onChange={(event) => setPublishRemark(event.target.value)}
            rows={3}
            placeholder="例如：首次上线、调整工作流逻辑"
            disabled={publishMutation.isPending}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={publishMutation.isPending} onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button disabled={publishMutation.isPending} onClick={() => publishMutation.mutate()}>
            {publishMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {publishMutation.isPending ? '发布中' : '确认发布'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
