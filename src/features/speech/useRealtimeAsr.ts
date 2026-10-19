import { useCallback, useEffect, useRef, useState } from 'react';
const ASR_WS_URL = (import.meta.env.VITE_ASR_WS_URL as string | undefined)?.trim() || 'ws://47.110.147.126:13020/';
import {
  computeRmsLevel,
  downsampleTo16k,
  floatTo16BitPcm,
  mergeAsrText
} from './audioUtils';

/** FunASR 实时识别：chunk_size [5,10,5] 对应约 60ms @16kHz = 960 samples */
const PCM_CHUNK_SAMPLES = 960;
const STOP_FLUSH_MS = 800;

export type AsrStatus = 'idle' | 'connecting' | 'listening';

type FunAsrMessage = {
  text?: string;
  mode?: string;
  is_final?: boolean;
};

type UseRealtimeAsrOptions = {
  onPartial?: (text: string) => void;
  onError?: (message: string) => void;
};

export type RealtimeAsrApi = {
  status: AsrStatus;
  listening: boolean;
  level: number;
  transcript: string;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  toggle: () => void;
};

function sendConfig(ws: WebSocket, isSpeaking: boolean) {
  ws.send(
    JSON.stringify({
      chunk_size: [5, 10, 5],
      wav_name: 'h5',
      is_speaking: isSpeaking,
      chunk_interval: 10,
      itn: false,
      mode: '2pass'
    })
  );
}

export function useRealtimeAsr(options: UseRealtimeAsrOptions = {}): RealtimeAsrApi {
  const [status, setStatus] = useState<AsrStatus>('idle');
  const [level, setLevel] = useState(0);
  const [transcript, setTranscript] = useState('');

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const statusRef = useRef<AsrStatus>('idle');
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const pcmTailRef = useRef<Int16Array>(new Int16Array(0));
  const transcriptRef = useRef('');
  const offlineTextRef = useRef('');
  const onlineTextRef = useRef('');
  const stopTimerRef = useRef<number | null>(null);
  const levelRef = useRef(0);

  const setAsrStatus = useCallback((next: AsrStatus) => {
    statusRef.current = next;
    setStatus(next);
    if (next === 'idle') {
      levelRef.current = 0;
      setLevel(0);
    }
  }, []);

  const appendPcm = useCallback((chunk: Int16Array) => {
    const prev = pcmTailRef.current;
    const merged = new Int16Array(prev.length + chunk.length);
    merged.set(prev, 0);
    merged.set(chunk, prev.length);
    pcmTailRef.current = merged;
  }, []);

  const flushPcm = useCallback((forceRest: boolean) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    let buf = pcmTailRef.current;
    while (buf.length >= PCM_CHUNK_SAMPLES) {
      const frame = buf.subarray(0, PCM_CHUNK_SAMPLES);
      ws.send(frame.slice().buffer);
      buf = buf.subarray(PCM_CHUNK_SAMPLES);
    }
    if (forceRest && buf.length > 0) {
      ws.send(buf.slice().buffer);
      buf = new Int16Array(0);
    }
    pcmTailRef.current = buf;
  }, []);

  const teardownAudio = useCallback(() => {
    try {
      processorRef.current?.disconnect();
    } catch {
      // ignore
    }
    try {
      sourceRef.current?.disconnect();
    } catch {
      // ignore
    }
    try {
      gainRef.current?.disconnect();
    } catch {
      // ignore
    }
    processorRef.current = null;
    sourceRef.current = null;
    gainRef.current = null;

    const ctx = audioContextRef.current;
    audioContextRef.current = null;
    if (ctx && ctx.state !== 'closed') {
      void ctx.close();
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    pcmTailRef.current = new Int16Array(0);
  }, []);

  const closeSocket = useCallback(() => {
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      try {
        ws.close();
      } catch {
        // ignore
      }
    }
  }, []);

  const stop = useCallback(async () => {
    if (statusRef.current === 'idle') return;
    if (stopTimerRef.current != null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      flushPcm(true);
      try {
        sendConfig(ws, false);
      } catch {
        // ignore
      }
    }

    teardownAudio();
    setAsrStatus('idle');

    await new Promise<void>((resolve) => {
      stopTimerRef.current = window.setTimeout(() => {
        stopTimerRef.current = null;
        closeSocket();
        resolve();
      }, STOP_FLUSH_MS);
    });
  }, [closeSocket, flushPcm, setAsrStatus, teardownAudio]);

  const start = useCallback(async () => {
    if (statusRef.current !== 'idle') return;
    if (typeof window === 'undefined' || !('WebSocket' in window)) {
      optionsRef.current.onError?.('当前浏览器不支持 WebSocket');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      optionsRef.current.onError?.('当前浏览器不支持麦克风录音');
      return;
    }

    transcriptRef.current = '';
    offlineTextRef.current = '';
    onlineTextRef.current = '';
    setTranscript('');
    setAsrStatus('connecting');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    } catch {
      setAsrStatus('idle');
      optionsRef.current.onError?.('无法打开麦克风，请检查浏览器授权');
      return;
    }

    const asrStatus = (): AsrStatus => statusRef.current;
    if (asrStatus() === 'idle') {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    streamRef.current = stream;

    const ws = new WebSocket(ASR_WS_URL);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    const fail = (message: string) => {
      teardownAudio();
      closeSocket();
      setAsrStatus('idle');
      optionsRef.current.onError?.(message);
    };

    try {
      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = () => reject(new Error(`连接语音识别服务失败：${ASR_WS_URL}`));
      });
    } catch (err) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      fail(err instanceof Error ? err.message : `连接语音识别服务失败：${ASR_WS_URL}`);
      return;
    }

    if (asrStatus() === 'idle') {
      stream.getTracks().forEach((track) => track.stop());
      closeSocket();
      return;
    }

    ws.onerror = () => {
      fail(`语音识别连接异常：${ASR_WS_URL}`);
    };
    ws.onclose = () => {
      if (statusRef.current === 'idle') return;
      teardownAudio();
      wsRef.current = null;
      setAsrStatus('idle');
    };
    ws.onmessage = (event) => {
      if (statusRef.current === 'idle') return;
      if (typeof event.data !== 'string') return;
      try {
        const payload = JSON.parse(event.data) as FunAsrMessage;
        const piece = (payload.text ?? '').trim();
        if (!piece) return;

        const mode = payload.mode ?? '';
        const isOfflineFinal = mode === '2pass-offline' || mode === 'offline';
        if (isOfflineFinal) {
          // 与 html5 demo 一致：离线纠错结果覆盖当前流式草稿，并作为已确认文本
          offlineTextRef.current = mergeAsrText(offlineTextRef.current, piece);
          onlineTextRef.current = '';
        } else {
          onlineTextRef.current = mergeAsrText(onlineTextRef.current, piece);
        }

        const next = mergeAsrText(offlineTextRef.current, onlineTextRef.current);
        transcriptRef.current = next;
        setTranscript(next);
        optionsRef.current.onPartial?.(next);
      } catch {
        // ignore malformed frames
      }
    };

    sendConfig(ws, true);

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    sourceRef.current = source;
    processorRef.current = processor;
    gainRef.current = silentGain;

    processor.onaudioprocess = (event) => {
      if (statusRef.current !== 'listening') return;
      const input = event.inputBuffer.getChannelData(0);
      const nextLevel = computeRmsLevel(input);
      if (Math.abs(nextLevel - levelRef.current) > 0.04) {
        levelRef.current = nextLevel;
        setLevel(nextLevel);
      }
      const resampled = downsampleTo16k(input, audioContext.sampleRate);
      appendPcm(floatTo16BitPcm(resampled));
      flushPcm(false);
    };

    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioContext.destination);
    setAsrStatus('listening');
  }, [appendPcm, closeSocket, flushPcm, setAsrStatus, teardownAudio]);

  const toggle = useCallback(() => {
    if (statusRef.current === 'idle') {
      void start().catch((err: unknown) => {
        teardownAudio();
        closeSocket();
        setAsrStatus('idle');
        optionsRef.current.onError?.(err instanceof Error ? err.message : '语音识别启动失败');
      });
      return;
    }
    void stop();
  }, [closeSocket, setAsrStatus, start, stop, teardownAudio]);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current != null) {
        window.clearTimeout(stopTimerRef.current);
      }
      teardownAudio();
      closeSocket();
    };
  }, [closeSocket, teardownAudio]);

  return {
    status,
    listening: status !== 'idle',
    level,
    transcript,
    start,
    stop,
    toggle
  };
}
