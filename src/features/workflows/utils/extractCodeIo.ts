let sequence = 0;
const generateRowId = (prefix: string) => `${prefix}-${++sequence}`;
import type { CodeInputVariable, CodeOutputVariable } from '../types';

const RESERVED_INPUT = new Set(['system_addInputParam', 'codeType', 'code']);
const RESERVED_OUTPUT = new Set(['system_rawResponse', 'error', 'system_addOutputParam', 'out_value']);
const IDENT = /^[A-Za-z_$][\w$]*$/;

/** 从 `function main(...)` 或脚本里的 arg0/arg1 抽出输入变量名。 */
export function extractCodeInputKeys(code: string): string[] {
  const src = code ?? '';
  const main = /\bfunction\s+main\s*\(([^)]*)\)/.exec(src)
    ?? /\bdef\s+main\s*\(([^)]*)\)/.exec(src);
  if (main) {
    const keys = parseParamList(main[1]).filter((key) => !RESERVED_INPUT.has(key));
    if (keys.length) return keys;
  }
  return inferArgKeys(src);
}

/** 从 `return { field }` 抽出输出字段名（相对返回值的 JSONPath）。 */
export function extractCodeOutputKeys(code: string): string[] {
  const src = code ?? '';
  const keys: string[] = [];
  const seen = new Set<string>();
  let from = 0;
  while (from < src.length) {
    const ret = indexOfReturn(src, from);
    if (ret < 0) break;
    let i = ret + 6;
    while (i < src.length && /\s/.test(src[i])) i += 1;
    if (src[i] !== '{') {
      from = i;
      continue;
    }
    for (const key of objectKeysAt(src, i)) {
      if (!key || RESERVED_OUTPUT.has(key) || seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
    }
    from = i + 1;
  }
  return keys;
}

export function extractedCodeInputs(code: string): CodeInputVariable[] {
  return extractCodeInputKeys(code).map((key, index) => ({
    id: generateRowId(`code-in-${index}`),
    key,
    label: key,
    value: '',
    required: true,
    valueType: 'string'
  }));
}

export function extractedCodeOutputs(code: string): CodeOutputVariable[] {
  return extractCodeOutputKeys(code).map((key, index) => ({
    id: generateRowId(`code-out-${index}`),
    key,
    label: key,
    valueType: 'any'
  }));
}

function parseParamList(raw: string): string[] {
  const text = raw.trim();
  if (!text) return [];
  const inner = text.startsWith('{') && text.endsWith('}') ? text.slice(1, -1) : text;
  return splitTopLevel(inner)
    .map((part) => {
      const cleaned = part.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/, '').trim();
      if (!cleaned || cleaned.startsWith('...')) return '';
      const name = cleaned.split(/[:=]/)[0]?.trim() ?? '';
      return IDENT.test(name) ? name : '';
    })
    .filter(Boolean);
}

function inferArgKeys(src: string): string[] {
  const keys: string[] = [];
  for (let i = 0; i < 8; i += 1) {
    const token = `arg${i}`;
    if (!new RegExp(`\\b${token}\\b`).test(src)) break;
    keys.push(i === 0 ? 'userChatInput' : token);
  }
  return keys;
}

function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let buf = '';
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      buf += ch;
      if (ch === '\\') {
        buf += text[i + 1] ?? '';
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === '{' || ch === '[' || ch === '(') depth += 1;
    if (ch === '}' || ch === ']' || ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      parts.push(buf);
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf);
  return parts;
}

function indexOfReturn(src: string, from: number): number {
  let i = from;
  while (i < src.length) {
    const idx = src.indexOf('return', i);
    if (idx < 0) return -1;
    const before = idx === 0 ? '' : src[idx - 1];
    const after = src[idx + 6] ?? '';
    if ((!before || !/[\w$]/.test(before)) && (!after || !/[\w$]/.test(after))) {
      return idx;
    }
    i = idx + 6;
  }
  return -1;
}

function objectKeysAt(src: string, braceIdx: number): string[] {
  const keys: string[] = [];
  let i = braceIdx + 1;
  let depth = 1;
  let expectKey = true;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '/' && src[i + 1] === '/') {
      i = src.indexOf('\n', i);
      if (i < 0) break;
      continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end < 0 ? src.length : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      const quoted = readQuoted(src, i);
      if (expectKey && depth === 1 && quoted.value) keys.push(quoted.value);
      expectKey = false;
      i = quoted.end;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      expectKey = true;
      i += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      expectKey = true;
      i += 1;
      continue;
    }
    if (ch === '[') {
      i = skipBalanced(src, i, '[', ']');
      expectKey = false;
      continue;
    }
    if (ch === '(') {
      i = skipBalanced(src, i, '(', ')');
      expectKey = false;
      continue;
    }
    if (depth !== 1) {
      i += 1;
      continue;
    }
    if (ch === ',') {
      expectKey = true;
      i += 1;
      continue;
    }
    if (ch === ':') {
      expectKey = false;
      i += 1;
      continue;
    }
    if (expectKey && /[A-Za-z_$]/.test(ch)) {
      const match = src.slice(i).match(/^[A-Za-z_$][\w$]*/);
      if (match && !['true', 'false', 'null', 'undefined'].includes(match[0])) {
        keys.push(match[0]);
      }
      i += match?.[0].length ?? 1;
      expectKey = false;
      continue;
    }
    i += 1;
  }
  return keys;
}

function readQuoted(src: string, start: number): { value: string; end: number } {
  const quote = src[start];
  let i = start + 1;
  let value = '';
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\') {
      value += src[i + 1] ?? '';
      i += 2;
      continue;
    }
    if (ch === quote) return { value, end: i + 1 };
    value += ch;
    i += 1;
  }
  return { value, end: i };
}

function skipBalanced(src: string, start: number, open: string, close: string): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = start; i < src.length; i += 1) {
    const ch = src[i];
    if (quote) {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === open) depth += 1;
    if (ch === close) {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return src.length;
}
