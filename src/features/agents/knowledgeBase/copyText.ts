/** 对齐参照：非安全上下文或剪贴板权限失败时，退回选区复制。 */
export async function copyText(text: string) {
  if (!text) throw new Error('没有可复制的内容');
  if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function' && window.isSecureContext !== false) {
    try { await navigator.clipboard.writeText(text); return; } catch { /* 使用选区复制兜底 */ }
  }
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') throw new Error('复制失败，请手动选择内容复制');
  const previous = document.activeElement;
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  try {
    input.focus(); input.select(); input.setSelectionRange(0, text.length);
    if (!document.execCommand('copy')) throw new Error('复制失败，请手动选择内容复制');
  } finally {
    input.remove();
    if (previous instanceof HTMLElement) previous.focus();
  }
}
