export function sanitizePastedText(raw: string | null | undefined) {
  if (raw == null) return '';
  return String(raw)
    .replace(/^\uFEFF/, '')
    .replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, ' ')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
}

export function sanitizeDebugStringValue(raw: string | null | undefined) {
  return sanitizePastedText(raw).trim();
}
