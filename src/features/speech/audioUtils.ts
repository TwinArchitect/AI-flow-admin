const TARGET_SAMPLE_RATE = 16000;

/** 将浏览器采集的 Float32 PCM 重采样到 16kHz */
export function downsampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === TARGET_SAMPLE_RATE) return input;
  if (inputSampleRate <= 0 || input.length === 0) return input;

  const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  const outLength = Math.round(input.length / ratio);
  const output = new Float32Array(outLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < output.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < input.length; i += 1) {
      accum += input[i];
      count += 1;
    }
    output[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }
  return output;
}

export function floatTo16BitPcm(float32: Float32Array): Int16Array {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i += 1) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

export function computeRmsLevel(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    sum += samples[i] * samples[i];
  }
  return Math.min(1, Math.sqrt(sum / samples.length) * 4);
}

const ASR_PUNCT_RE = /[，。！？、,.!?;；：:\s]+/g;

function normalizeAsrText(text: string): string {
  return text.replace(ASR_PUNCT_RE, '');
}

function preferPunctuated(a: string, b: string): string {
  const punctCount = (s: string) => (s.match(/[，。！？、,.!?;；]/g) ?? []).length;
  const pa = punctCount(a);
  const pb = punctCount(b);
  if (pb !== pa) return pb > pa ? b : a;
  return b.length >= a.length ? b : a;
}

function appendNormalizedTail(prev: string, next: string, extraNorm: string): string {
  for (let i = 1; i <= next.length; i += 1) {
    if (normalizeAsrText(next.slice(next.length - i)) === extraNorm) {
      return `${prev}${next.slice(next.length - i)}`;
    }
  }
  return `${prev}${extraNorm}`;
}

/**
 * FunASR 流式结果可能是增量、滑窗重叠，或带标点的整句快照。
 * 按最长前后缀重叠合并，避免「你好」被拼成「你好你好」。
 */
export function mergeAsrText(prev: string, incoming: string): string {
  const next = incoming.trim();
  if (!next) return prev;
  if (!prev) return next;

  const prevN = normalizeAsrText(prev);
  const nextN = normalizeAsrText(next);
  if (!nextN) return prev;
  if (!prevN) return next;

  if (nextN === prevN) return preferPunctuated(prev, next);
  if (nextN.startsWith(prevN)) return next;
  if (prevN.startsWith(nextN)) return preferPunctuated(prev, next);
  if (prevN.endsWith(nextN)) return prev;

  const max = Math.min(prevN.length, nextN.length);
  const minOverlap = nextN.length <= 1 ? 1 : 2;
  for (let i = max; i >= minOverlap; i -= 1) {
    if (nextN.startsWith(prevN.slice(prevN.length - i))) {
      const extra = nextN.slice(i);
      if (!extra) return preferPunctuated(prev, next);
      return appendNormalizedTail(prev, next, extra);
    }
  }

  const maxRaw = Math.min(prev.length, next.length);
  for (let i = maxRaw; i >= minOverlap; i -= 1) {
    if (next.startsWith(prev.slice(prev.length - i))) {
      return `${prev}${next.slice(i)}`;
    }
  }

  return `${prev}${next}`;
}

export { TARGET_SAMPLE_RATE };
