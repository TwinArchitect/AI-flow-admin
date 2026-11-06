import { useCallback, useEffect, useRef, useState } from 'react';
import { ASR_WS_URL } from './config';
import { computeRmsLevel, downsampleTo16k, floatTo16BitPcm, mergeAsrText } from './audioUtils';

const PCM_CHUNK_SAMPLES = 960;
const STOP_FLUSH_MS = 800;
export type AsrStatus = 'idle' | 'connecting' | 'listening' | 'stopping';
type AsrOptions = { onPartial?: (text: string) => void; onError?: (message: string) => void };
export type RealtimeAsrApi = {
  status: AsrStatus;
  listening: boolean;
  level: number;
  transcript: string;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  toggle: () => void;
};

function sendConfig(ws: WebSocket, speaking: boolean) {
  ws.send(JSON.stringify({ chunk_size: [5, 10, 5], wav_name: 'h5', is_speaking: speaking,
    chunk_interval: 10, itn: false, mode: '2pass' }));
}

/** 参照项目 FunASR 2pass 协议：16kHz 单声道 PCM，停止后等待末尾纠错帧。 */
export function useRealtimeAsr(options: AsrOptions = {}): RealtimeAsrApi {
  const [status, setStatus] = useState<AsrStatus>('idle');
  const [level, setLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const statusRef = useRef<AsrStatus>('idle');
  const sessionRef = useRef(0);
  const mountedRef = useRef(true);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const pcmRef = useRef<Int16Array>(new Int16Array(0));
  const offlineRef = useRef('');
  const onlineRef = useRef('');
  const levelRef = useRef(0);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopResolveRef = useRef<(() => void) | null>(null);

  const updateStatus = useCallback((next: AsrStatus) => {
    statusRef.current = next;
    if (!mountedRef.current) return;
    setStatus(next);
    if (next !== 'listening') { levelRef.current = 0; setLevel(0); }
  }, []);

  const releaseAudio = useCallback(() => {
    if (processorRef.current) processorRef.current.onaudioprocess = null;
    for (const node of [processorRef.current, sourceRef.current, gainRef.current]) {
      try { node?.disconnect(); } catch { /* 节点可能已经断开。 */ }
    }
    processorRef.current = null; sourceRef.current = null; gainRef.current = null;
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    pcmRef.current = new Int16Array(0);
  }, []);

  const closeSocket = useCallback(() => {
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
  }, []);

  const finishStop = useCallback(() => {
    if (stopTimerRef.current !== null) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    updateStatus('idle');
    closeSocket();
    stopResolveRef.current?.(); stopResolveRef.current = null;
  }, [closeSocket, updateStatus]);

  const flushPcm = useCallback((rest: boolean) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    let buffer = pcmRef.current;
    while (buffer.length >= PCM_CHUNK_SAMPLES) {
      socket.send(buffer.slice(0, PCM_CHUNK_SAMPLES).buffer);
      buffer = buffer.subarray(PCM_CHUNK_SAMPLES);
    }
    if (rest && buffer.length) { socket.send(buffer.slice().buffer); buffer = new Int16Array(0); }
    pcmRef.current = buffer;
  }, []);

  const stop = useCallback(async () => {
    if (statusRef.current === 'idle' || statusRef.current === 'stopping') return;
    if (statusRef.current === 'connecting') {
      sessionRef.current += 1;
      releaseAudio(); finishStop();
      return;
    }
    const socket = socketRef.current;
    try {
      flushPcm(true);
      if (socket?.readyState === WebSocket.OPEN) sendConfig(socket, false);
    } catch { /* 连接断开时仍需释放麦克风。 */ }
    releaseAudio();
    updateStatus('stopping');
    await new Promise<void>(resolve => {
      stopResolveRef.current = resolve;
      stopTimerRef.current = setTimeout(finishStop, STOP_FLUSH_MS);
    });
  }, [finishStop, flushPcm, releaseAudio, updateStatus]);

  const start = useCallback(async () => {
    if (statusRef.current !== 'idle') return;
    if (!navigator.mediaDevices?.getUserMedia) { optionsRef.current.onError?.('当前浏览器不支持麦克风录音，请使用 HTTPS 或 localhost'); return; }
    if (typeof WebSocket === 'undefined' || typeof AudioContext === 'undefined') { optionsRef.current.onError?.('当前浏览器不支持实时语音识别'); return; }
    if (window.location.protocol === 'https:' && ASR_WS_URL.startsWith('ws:')) { optionsRef.current.onError?.('HTTPS 页面需要配置 wss 语音识别服务地址'); return; }
    const session = ++sessionRef.current;
    const current = () => mountedRef.current && session === sessionRef.current;
    const getStatus = (): AsrStatus => statusRef.current;
    offlineRef.current = ''; onlineRef.current = ''; setTranscript('');
    updateStatus('connecting');
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1,
          echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      } catch { throw new Error('无法打开麦克风，请检查浏览器授权'); }
      if (!current()) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      const socket = new WebSocket(ASR_WS_URL);
      socket.binaryType = 'arraybuffer'; socketRef.current = socket;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('连接语音识别服务超时，请检查服务地址和网络')), 10000);
        socket.onopen = () => { clearTimeout(timer); resolve(); };
        socket.onerror = () => { clearTimeout(timer); reject(new Error('连接语音识别服务失败，请检查服务地址和网络')); };
        socket.onclose = () => { clearTimeout(timer); reject(new Error('语音识别连接已关闭')); };
      });
      if (!current()) return;
      socket.onerror = () => {
        if (!current()) return;
        releaseAudio(); finishStop();
        optionsRef.current.onError?.('语音识别连接异常，请重新尝试');
      };
      socket.onclose = () => {
        if (!current()) return;
        const unexpected = statusRef.current === 'listening';
        releaseAudio(); finishStop();
        if (unexpected) optionsRef.current.onError?.('语音识别连接已断开，请重新尝试');
      };
      socket.onmessage = event => {
        if (!current() || statusRef.current === 'idle' || typeof event.data !== 'string') return;
        try {
          const payload = JSON.parse(event.data) as { text?: string; mode?: string };
          if (typeof payload.text !== 'string' || !payload.text.trim()) return;
          const piece = payload.text.trim();
          if (payload.mode === '2pass-offline' || payload.mode === 'offline') {
            offlineRef.current = mergeAsrText(offlineRef.current, piece); onlineRef.current = '';
          } else onlineRef.current = mergeAsrText(onlineRef.current, piece);
          const text = mergeAsrText(offlineRef.current, onlineRef.current);
          setTranscript(text); optionsRef.current.onPartial?.(text);
        } catch { /* 忽略非识别消息及无效帧。 */ }
      };
      sendConfig(socket, true);
      const context = new AudioContext(); contextRef.current = context;
      if (context.state === 'suspended') await context.resume();
      if (!current() || getStatus() !== 'connecting') return;
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const gain = context.createGain(); gain.gain.value = 0;
      sourceRef.current = source; processorRef.current = processor; gainRef.current = gain;
      processor.onaudioprocess = event => {
        if (!current() || statusRef.current !== 'listening') return;
        const input = event.inputBuffer.getChannelData(0);
        const nextLevel = computeRmsLevel(input);
        if (Math.abs(nextLevel - levelRef.current) > 0.04) { levelRef.current = nextLevel; setLevel(nextLevel); }
        const pcm = floatTo16BitPcm(downsampleTo16k(input, context.sampleRate));
        const merged = new Int16Array(pcmRef.current.length + pcm.length);
        merged.set(pcmRef.current); merged.set(pcm, pcmRef.current.length); pcmRef.current = merged;
        flushPcm(false);
      };
      source.connect(processor); processor.connect(gain); gain.connect(context.destination);
      updateStatus('listening');
    } catch (error) {
      if (!current()) return;
      releaseAudio(); finishStop();
      optionsRef.current.onError?.(error instanceof Error ? error.message : '语音识别启动失败');
    }
  }, [finishStop, flushPcm, releaseAudio, updateStatus]);

  const toggle = useCallback(() => { if (statusRef.current === 'idle') void start(); else void stop(); }, [start, stop]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false; sessionRef.current += 1;
      releaseAudio(); finishStop();
    };
  }, [finishStop, releaseAudio]);

  return { status, listening: status !== 'idle', level, transcript, start, stop, toggle };
}
