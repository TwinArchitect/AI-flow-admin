/**
 * 清理粘贴/富文本带来的脏空白与引号，保留真实换行。
 * 典型问题：Word / 网页复制的 NBSP（\u00a0）肉眼像空格，但 JSON.parse 会失败。
 */
export function sanitizePastedText(raw: string | null | undefined): string {
  if (raw == null) return '';
  return String(raw)
    .replace(/^\uFEFF/, '')
    // NBSP、窄 NBSP、各类 Unicode 空格 → 普通空格
    .replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, ' ')
    // 零宽字符去掉
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    // 智能引号 → ASCII
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
}

/** 调试提交前再 trim 两端（不折叠内部空白/换行） */
export function sanitizeDebugStringValue(raw: string | null | undefined): string {
  return sanitizePastedText(raw).trim();
}
