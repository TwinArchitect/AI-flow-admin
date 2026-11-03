function countNewlines(text: string): number {
  return (text.match(/\n/g) ?? []).length;
}

/**
 * 去掉模型偶发包裹的 markdown 代码围栏，保留围栏内原文换行。
 */
function stripMarkdownCodeFence(source: string): string {
  const trimmed = source.trim();
  if (!trimmed.startsWith('```')) return source;

  const firstNl = trimmed.indexOf('\n');
  if (firstNl === -1) {
    const m = trimmed.match(/^```(?:[a-zA-Z0-9_+-]*)?\s*([\s\S]*?)\s*```$/);
    return m?.[1] ?? source;
  }

  let body = trimmed.slice(firstNl + 1);
  if (body.endsWith('```')) {
    body = body.slice(0, -3);
    if (body.endsWith('\n')) body = body.slice(0, -1);
  }
  return body;
}

/**
 * 代码源规范化（加载 / 保存 / AI 回填）：
 * - 保留真实换行，禁止把多行压成一行
 * - 将双转义字面量 `\n` 还原为真换行（仅当内容明显被压成一行时）
 * - 去掉 markdown 代码围栏
 * - 保留注释原文，不猜测或改写注释中的语句
 *
 * 注意：不要在编辑器逐字 onChange 中调用（会干扰正在输入的尾部换行与字面量 `\n`）。
 */
export function normalizeCodeSource(source: string | null | undefined, language: 'js' | 'py' = 'js'): string {
  if (source == null) return '';
  let text = String(source).replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const realBreaks = countNewlines(text);
  const literalBreaks = (text.match(/\\n/g) ?? []).length;
  // 整段几乎无真换行、却大量字面量 \n 时，视为传输/AI 双转义，还原为真换行
  if (language === 'js' && literalBreaks >= 2 && realBreaks < Math.max(2, literalBreaks / 2)) {
    text = text.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
  }

  text = stripMarkdownCodeFence(text);
  // 只裁剪首尾空白，绝不折叠内部空白 / 换行
  text = text.replace(/^\uFEFF/, '').replace(/^\n+/, '').replace(/\n+$/, '');
  return text;
}

/** 编辑过程中仅统一换行符，不做转义还原 / 围栏剥离 */
export function normalizeCodeLineEndings(source: string | null | undefined): string {
  if (source == null) return '';
  return String(source).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
