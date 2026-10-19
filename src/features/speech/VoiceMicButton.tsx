import { Loader2, Mic } from 'lucide-react';
import { VoiceWave } from './VoiceWave';
import type { VoiceInputApi } from './useVoiceInput';

type VoiceMicButtonProps = {
  voice: VoiceInputApi;
  disabled?: boolean;
  className?: string;
  iconSize?: number;
  title?: string;
};

export function VoiceMicButton({
  voice,
  disabled,
  className = '',
  iconSize = 18,
  title
}: VoiceMicButtonProps) {
  const active = voice.listening;
  const connecting = voice.status === 'connecting';

  return (
    <button
      type="button"
      onClick={() => voice.toggle()}
      disabled={disabled && !active}
      className={
        active
          ? 'shrink-0 inline-flex items-center justify-center h-9 w-9 bg-transparent shadow-none hover:bg-transparent'
          : className
      }
      title={title ?? (active ? '停止语音识别' : '语音输入')}
      aria-label={active ? '停止语音识别' : '语音输入'}
      aria-pressed={active}
    >
      {connecting ? (
        <Loader2 size={iconSize} className="animate-spin text-brand-500" />
      ) : active ? (
        <VoiceWave level={voice.level} variant="compact" />
      ) : (
        <Mic size={iconSize} />
      )}
    </button>
  );
}
