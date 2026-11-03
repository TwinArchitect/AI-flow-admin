import { copyText } from '../copyText';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen, Copy, KeyRound, Network } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { KbApiKeysDialog } from './KbApiKeysDialog';

export function KbServiceApi() {
  const [keysOpen, setKeysOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const endpoint = new URL('/gpt/open/v1/kb', window.location.origin).href;
  return <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><Button variant="outline" size="sm"><Network className="size-4" />服务 API</Button></PopoverTrigger>
      <PopoverContent align="end" className="w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-xl p-0">
        <div className="flex items-center gap-3 px-5 pt-5"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Network className="size-5" /></span><div><h2 className="text-sm font-semibold">后端服务 API</h2><p className="mt-1 text-xs text-muted-foreground">通过 API Key 对接知识库开放能力</p></div></div>
        <div className="space-y-2 p-5"><p className="text-xs font-medium text-muted-foreground">API 端点</p><div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3"><code className="min-w-0 flex-1 break-all text-xs leading-5">{endpoint}</code><Button aria-label="复制端点" variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => void copyText(endpoint).then(() => toast.success('端点已复制')).catch(() => toast.error('复制失败，请手动选择端点'))}><Copy className="size-4" /></Button></div></div>
        <div className="flex gap-2 border-t border-border bg-muted/20 px-4 py-3"><Button variant="ghost" size="sm" onClick={() => { setOpen(false); setKeysOpen(true); }}><KeyRound className="size-4" />API 密钥</Button><Button variant="ghost" size="sm" asChild><Link to="/agents/knowledge/api-doc" onClick={() => setOpen(false)}><BookOpen className="size-4" />API 文档</Link></Button></div>
      </PopoverContent>
    </Popover>
    {keysOpen && <KbApiKeysDialog onClose={() => setKeysOpen(false)} />}
  </>;
}
