import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Loader2, SendHorizontal, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { optimizeWorkflowPrompt } from '@/features/agents/api/agentApi';

export function PromptOptimizeControl({
  scene,
  content,
  agentId,
  codeLanguage,
  inputParams,
  outputHint,
  onApply,
  children,
}: {
  scene: 'system_prompt_optimize' | 'user_prompt_optimize' | 'code_optimize';
  content: string;
  agentId?: string;
  codeLanguage?: string;
  inputParams?: string;
  outputHint?: string;
  onApply: (value: string) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = async () => {
    if (!content.trim() && (scene !== 'code_optimize' || !hint.trim())) {
      toast.error(scene === 'code_optimize' ? '请填写代码或生成需求' : '请先填写提示词后再优化');
      return;
    }
    setLoading(true);
    try {
      onApply(await optimizeWorkflowPrompt({
        scene, content, hint, agentId, codeLanguage, inputParams, outputHint,
      }));
      setOpen(false);
      setHint('');
      toast.success(scene === 'code_optimize' ? '代码已更新' : '提示词已优化');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI 优化失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        {children}
        {!open && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute bottom-2 right-2 bg-background/85 text-primary backdrop-blur-sm"
            onClick={() => setOpen(true)}
            aria-label={scene === 'code_optimize' ? 'AI 优化代码' : 'AI 优化提示词'}
            title={scene === 'code_optimize' ? 'AI 优化代码' : 'AI 优化提示词'}
          >
            <Sparkles size={14} />
          </Button>
        )}
      </div>
      {open && (
        <div className="flex items-center gap-1.5 rounded-md border border-primary/50 bg-background p-1.5">
          <Sparkles className="size-3.5 shrink-0 text-primary" />
          <Input
            ref={inputRef}
            value={hint}
            disabled={loading}
            onChange={(event) => setHint(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submit();
              }
              if (event.key === 'Escape' && !loading) setOpen(false);
            }}
            placeholder="说明希望如何优化（可选）"
            className="h-7 border-0 px-1 text-xs shadow-none focus-visible:ring-0"
          />
          {loading ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
          ) : (
            <>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
                <X size={13} />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => void submit()}>
                <SendHorizontal size={14} />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
