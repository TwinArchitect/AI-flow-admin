import { Loader2, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VoiceInputApi } from './useVoiceInput';

type VoiceMicButtonProps = {
  voice: VoiceInputApi;
  disabled?: boolean;
  iconSize?: number;
  className?: string;
  title?: string;
};

export function VoiceMicButton({ voice, disabled, iconSize = 18, className, title }: VoiceMicButtonProps) {
  const waiting = voice.status === 'connecting' || voice.status === 'stopping';
  const label = voice.status === 'stopping' ? '正在完成语音识别' : voice.listening ? '停止语音识别' : '语音输入';
  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={voice.toggle}
      disabled={voice.status === 'stopping' || (disabled && !voice.listening)}
      aria-label={label} title={title ?? label} aria-pressed={voice.listening}
      className={cn('shrink-0', voice.listening ? 'bg-primary/10 text-primary-text' : 'text-muted-foreground', className)}>
      {waiting ? <Loader2 size={iconSize} className="animate-spin motion-reduce:animate-none" /> : voice.listening ? (
        <span aria-hidden="true" className="flex h-5 items-center gap-0.5">
          {[0.45, 0.75, 1, 0.75, 0.45].map((scale, index) => <span key={index} className="w-0.5 rounded-full bg-current transition-[height] motion-reduce:transition-none" style={{ height: `${Math.max(4, 20 * Math.max(0.18, voice.level) * scale)}px` }} />)}
        </span>
      ) : <Mic size={iconSize} />}
    </Button>
  );
}
