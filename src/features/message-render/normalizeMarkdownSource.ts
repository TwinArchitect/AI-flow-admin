const FENCE_RE = /^\s*(```+|~~~+)/;
const TABLE_SEP_RE = /\|(?:[ \t]*:?-+:?[ \t]*\|)+/;
const COLLAPSED_TABLE_RE = /\|[^\n]*\|(?:[ \t]*:?-+:?[ \t]*\|)+[^\n]*\|/g;

function countNewlines(text: string) {
  return (text.match(/\n/g) ?? []).length;
}

function walkOutsideFences(text: string, visit: (line: string) => string | string[]) {
  const output: string[] = [];
  let fence = '';
  for (const line of text.split('\n')) {
    const match = FENCE_RE.exec(line);
    if (match) {
      const marker = match[1]!.startsWith('`') ? '`' : '~';
      fence = fence ? (fence === marker ? '' : fence) : marker;
      output.push(line);
      continue;
    }
    const mapped = fence ? line : visit(line);
    output.push(...(Array.isArray(mapped) ? mapped : [mapped]));
  }
  return output.join('\n');
}

function unescapeLiteralBreaks(text: string) {
  const literal = (text.match(/\\n/g) ?? []).length;
  return literal > 0 && countNewlines(text) < Math.max(2, literal / 2)
    ? text.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')
    : text;
}

function restoreCollapsedTables(text: string) {
  if (!TABLE_SEP_RE.test(text)) return text;
  return text.replace(COLLAPSED_TABLE_RE, (chunk) => {
    if (countNewlines(chunk) >= 2) return chunk;
    const separator = chunk.match(TABLE_SEP_RE)?.[0];
    if (!separator) return chunk;
    const columns = (separator.match(/\|/g) ?? []).length - 1;
    if (columns < 1) return chunk;
    const cells = chunk.split('|').slice(1, -1);
    const rows: string[][] = [];
    for (let index = 0; index < cells.length; index += columns) {
      const row = cells.slice(index, index + columns);
      if (row.length === columns) rows.push(row);
    }
    return rows.length >= 2 ? rows.map((row) => `|${row.join('|')}|`).join('\n') : chunk;
  });
}

function repairDelimiterRows(text: string) {
  return walkOutsideFences(text, (line) => {
    const match = TABLE_SEP_RE.exec(line);
    if (!match) return line;
    const end = match.index + match[0].length;
    const rest = line.slice(end).trimStart();
    if (!/[^|\s]/.test(rest)) return line;
    return [line.slice(0, end), rest.startsWith('|') ? rest : `| ${rest}`];
  });
}

function fixHeadings(text: string) {
  return walkOutsideFences(text, (line) => line.replace(/^(#{1,6})(?=[^\s#])/, '$1 '));
}

/**
 * 兼容部分模型把“Markdown 标题 + 中文无序列表”压成单行的异常输出：
 * `## 标题-条目一-条目二-条目三`。仅修复标题行、至少三个中文条目，
 * 避免把普通连字符、URL 或代码误判成列表。
 */
function restoreCollapsedHeadingLists(text: string) {
  if (countNewlines(text) >= 2) return text;
  return walkOutsideFences(text, (line) => {
    const heading = /^(#{1,6})\s*(.+)$/.exec(line);
    if (!heading || line.includes('://')) return line;
    const parts = heading[2]!
      .split(/-\s*(?=\p{Script=Han})/gu)
      .map((part) => part.trim());
    if (parts.length < 4 || parts.some((part) => !part)) return line;
    return [`${heading[1]} ${parts[0]}`, '', ...parts.slice(1).map((part) => `- ${part}`)];
  });
}

export function normalizeMarkdownSource(source: string) {
  if (!source) return source;
  let text = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = unescapeLiteralBreaks(text);
  if (countNewlines(text) < 2) {
    text = text
      .replace(/([^\n#])(#{1,6}(?: |[^\s#]))/g, '$1\n\n$2')
      .replace(/([；;。！？])\s*-\s*/g, '$1\n- ');
  }
  text = restoreCollapsedHeadingLists(text);
  text = restoreCollapsedTables(text);
  text = repairDelimiterRows(text);
  return fixHeadings(text);
}
