const JS_KEYWORDS = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'default',
  'do',
  'else',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'import',
  'instanceof',
  'let',
  'new',
  'null',
  'return',
  'switch',
  'throw',
  'true',
  'try',
  'typeof',
  'undefined',
  'var',
  'void',
  'while',
  'async',
  'await',
  'of',
  'in'
]);

const PY_KEYWORDS = new Set([
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'False',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'None',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'True',
  'try',
  'while',
  'with',
  'yield'
]);

const TOKEN_CLASS = {
  keyword: 'text-violet-600 dark:text-violet-300',
  string: 'text-amber-700 dark:text-amber-300',
  comment: 'text-emerald-600 dark:text-emerald-500',
  number: 'text-sky-600 dark:text-sky-400',
  function: 'text-blue-600 dark:text-blue-300'
} as const;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function span(className: string, text: string): string {
  return `<span class="${className}">${escapeHtml(text)}</span>`;
}

function isFunctionCall(code: string, index: number, wordLength: number): boolean {
  return /^\s*\(/.test(code.slice(index + wordLength));
}

function highlightWithKeywords(
  code: string,
  keywords: Set<string>,
  commentStarter: (rest: string) => string | null,
  stringMatcher: (rest: string) => string | null
): string {
  let result = '';
  let i = 0;

  while (i < code.length) {
    const rest = code.slice(i);

    const comment = commentStarter(rest);
    if (comment) {
      result += span(TOKEN_CLASS.comment, comment);
      i += comment.length;
      continue;
    }

    const str = stringMatcher(rest);
    if (str) {
      result += span(TOKEN_CLASS.string, str);
      i += str.length;
      continue;
    }

    const numMatch = rest.match(/^\b\d+(?:\.\d+)?\b/);
    if (numMatch) {
      result += span(TOKEN_CLASS.number, numMatch[0]);
      i += numMatch[0].length;
      continue;
    }

    const idMatch = rest.match(/^[a-zA-Z_$][\w$]*/);
    if (idMatch) {
      const word = idMatch[0];
      if (keywords.has(word)) {
        result += span(TOKEN_CLASS.keyword, word);
      } else if (isFunctionCall(code, i, word.length)) {
        result += span(TOKEN_CLASS.function, word);
      } else {
        result += escapeHtml(word);
      }
      i += word.length;
      continue;
    }

    result += escapeHtml(code[i] ?? '');
    i += 1;
  }

  return result;
}

function jsComment(rest: string): string | null {
  if (rest.startsWith('//')) {
    const nl = rest.indexOf('\n');
    return nl === -1 ? rest : rest.slice(0, nl);
  }
  if (rest.startsWith('/*')) {
    const end = rest.indexOf('*/');
    return end === -1 ? rest : rest.slice(0, end + 2);
  }
  return null;
}

function jsString(rest: string): string | null {
  const m = rest.match(/^(['"`])(?:\\.|(?!\1)[^\\])*\1/);
  return m?.[0] ?? null;
}

function pyComment(rest: string): string | null {
  if (!rest.startsWith('#')) return null;
  const nl = rest.indexOf('\n');
  return nl === -1 ? rest : rest.slice(0, nl);
}

function pyString(rest: string): string | null {
  const m = rest.match(
    /^(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/
  );
  return m?.[0] ?? null;
}

function pyIdentifier(rest: string): string | null {
  const m = rest.match(/^[a-zA-Z_][\w]*/);
  return m?.[0] ?? null;
}

function highlightPython(code: string): string {
  let result = '';
  let i = 0;

  while (i < code.length) {
    const rest = code.slice(i);

    const comment = pyComment(rest);
    if (comment) {
      result += span(TOKEN_CLASS.comment, comment);
      i += comment.length;
      continue;
    }

    const str = pyString(rest);
    if (str) {
      result += span(TOKEN_CLASS.string, str);
      i += str.length;
      continue;
    }

    const numMatch = rest.match(/^\b\d+(?:\.\d+)?\b/);
    if (numMatch) {
      result += span(TOKEN_CLASS.number, numMatch[0]);
      i += numMatch[0].length;
      continue;
    }

    const word = pyIdentifier(rest);
    if (word) {
      if (PY_KEYWORDS.has(word)) {
        result += span(TOKEN_CLASS.keyword, word);
      } else if (isFunctionCall(code, i, word.length)) {
        result += span(TOKEN_CLASS.function, word);
      } else {
        result += escapeHtml(word);
      }
      i += word.length;
      continue;
    }

    result += escapeHtml(code[i] ?? '');
    i += 1;
  }

  return result;
}

export function highlightCode(code: string, language: 'js' | 'py'): string {
  if (!code) return '';
  if (language === 'py') return highlightPython(code);
  return highlightWithKeywords(code, JS_KEYWORDS, jsComment, jsString);
}
