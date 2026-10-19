import { useCallback, useEffect, useRef } from 'react';
import { useRealtimeAsr, type RealtimeAsrApi } from './useRealtimeAsr';

type UseVoiceInputOptions = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  onError?: (message: string) => void;
};

export type VoiceInputApi = RealtimeAsrApi;

export function useVoiceInput({
  value,
  onChange,
  disabled,
  onError
}: UseVoiceInputOptions): VoiceInputApi {
  const valueRef = useRef(value);
  valueRef.current = value;
  const prefixRef = useRef('');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const asr = useRealtimeAsr({
    onPartial: (text) => {
      onChangeRef.current(`${prefixRef.current}${text}`);
    },
    onError
  });

  const { status, stop, start: startAsr, ...rest } = asr;

  const start = useCallback(async () => {
    const current = valueRef.current;
    prefixRef.current = current.trim() ? `${current.replace(/\s+$/, '')} ` : '';
    await startAsr();
  }, [startAsr]);

  const toggle = useCallback(() => {
    if (status === 'idle') {
      void start();
      return;
    }
    void stop();
  }, [start, status, stop]);

  useEffect(() => {
    if (disabled && status !== 'idle') {
      void stop();
    }
  }, [disabled, status, stop]);

  return {
    ...rest,
    status,
    start,
    stop,
    toggle
  };
}
