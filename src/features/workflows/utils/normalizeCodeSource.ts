function countNewlines(value: string) {
  return (value.match(/\n/g) ?? []).length;
}

function stripMarkdownCodeFence(source: string) {
  const trimmed = source.trim();
  if (!trimmed.startsWith('```')) return source;
  const firstNewline = trimmed.indexOf('\n');
  if (firstNewline < 0) {
    return trimmed.match(/^```(?:[a-zA-Z0-9_+-]*)?\s*([\s\S]*?)\s*```$/)?.[1] ?? source;
  }
  let body = trimmed.slice(firstNewline + 1);
  if (body.endsWith('```')) body = body.slice(0, -3).replace(/\n$/, '');
  return body;
}

const CODE_RESUME_RE = /^(.*?)(?:\s+)(?=(?:return|var|let|const|if|for|while|function|switch|try|catch|throw|else|do|new|typeof|delete|void|}\s*;?|}\s*$))/;

function repairSingleLineSlashComments(source: string) {
  if (countNewlines(source) >= 2 || !source.includes('//')) return source;
  let output = '';
  let index = 0;
  let quote: "'" | '"' | '`' | null = null;
  let blockComment = false;

  while (index < source.length) {
    const char = source[index]!;
    const next = source[index + 1];
    if (blockComment) {
      output += char;
      if (char === '*' && next === '/') {
        output += '/';
        index += 2;
        blockComment = false;
      } else index += 1;
      continue;
    }
    if (quote) {
      output += char;
      if (char === '\\' && index + 1 < source.length) {
        output += source[index + 1];
        index += 2;
      } else {
        if (char === quote) quote = null;
        index += 1;
      }
      continue;
    }
    if (char === '/' && next === '*') {
      output += '/*';
      index += 2;
      blockComment = true;
      continue;
    }
    if (char === '/' && next === '/') {
      index += 2;
      const rest = source.slice(index);
      const newline = rest.indexOf('\n');
      const line = newline < 0 ? rest : rest.slice(0, newline);
      const resume = CODE_RESUME_RE.exec(line);
      if (resume) {
        output += `/*${(resume[1] ?? '').trim()}*/\n`;
        index += resume[0].length;
      } else {
        output += `/*${line}*/`;
        index += line.length;
      }
      continue;
    }
    if (char === "'" || char === '"' || char === '`') quote = char;
    output += char;
    index += 1;
  }
  return output;
}

export function normalizeCodeLineEndings(source: string | null | undefined) {
  return source == null ? '' : String(source).replace(/\r\n?/g, '\n');
}

export function normalizeCodeSource(source: string | null | undefined) {
  let value = normalizeCodeLineEndings(source);
  const realBreaks = countNewlines(value);
  const literalBreaks = (value.match(/\\n/g) ?? []).length;
  if (literalBreaks >= 2 && realBreaks < Math.max(2, literalBreaks / 2)) {
    value = value.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
  }
  value = stripMarkdownCodeFence(value)
    .replace(/^\uFEFF/, '')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '');
  return repairSingleLineSlashComments(value);
}
