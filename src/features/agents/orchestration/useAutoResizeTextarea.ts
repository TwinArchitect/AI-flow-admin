import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/** 对话输入框按内容自动增高，默认最多 6 行，超出后内部滚动 */
export function useAutoResizeTextarea(value: string, maxLines = 6) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [expanded, setExpanded] = useState(false);

  const sync = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    const styles = window.getComputedStyle(el);
    const parsedLineHeight = Number.parseFloat(styles.lineHeight);
    const fontSize = Number.parseFloat(styles.fontSize) || 14;
    const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : fontSize * 1.5;
    const padding =
      (Number.parseFloat(styles.paddingTop) || 0) + (Number.parseFloat(styles.paddingBottom) || 0);
    const border =
      (Number.parseFloat(styles.borderTopWidth) || 0) +
      (Number.parseFloat(styles.borderBottomWidth) || 0);
    const minHeight = lineHeight + padding + border;
    const maxHeight = lineHeight * maxLines + padding + border;

    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight + 1 ? 'auto' : 'hidden';

    const isTall = next > minHeight + 2 || value.includes('\n');
    setExpanded((prev) => {
      if (isTall) return true;
      if (!prev) return false;
      // 撑开后改成通栏会变宽，避免因此立刻收回导致闪烁
      return value.trim().length > 8;
    });
  }, [maxLines, value]);

  useLayoutEffect(() => {
    sync();
  }, [sync, expanded]);

  return { textareaRef, sync, expanded };
}
