import type { ChunkStrategyType, DocumentParseSubmit } from './types';

export const KB_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tif', 'tiff', 'ico', 'heic', 'heif', 'avif']);

export function normalizeChunkStrategy(value?: string | null): ChunkStrategyType {
  return (!value || value === 'ast' || value === 'sliding' ? 'naive' : value) as ChunkStrategyType;
}

/** 元素标签单独遵循最多 10 项；文档和分块标签不受此数量限制。 */
export function normalizeMediaTags(values: string[]): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const value of values) {
    const tag = value.trim().replace(/^[#、,，;；]+|[#、,，;；]+$/g, '');
    const key = tag.toLocaleLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag.slice(0, 20));
    if (tags.length === 10) break;
  }
  return tags;
}

export function formatMediaConfidence(value?: number): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return `${Math.round(value <= 1 ? value * 100 : value)}%`;
}

export function documentMetadataFieldCount(raw: unknown): number {
  let value = raw;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return 0; }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).length : 0;
}

export function normalizeChunkTags(tags: string[]) {
  const seen = new Set<string>();
  return tags.map((tag) => tag.trim().replace(/^[#、,，;；]+|[#、,，;；]+$/g, '').slice(0, 20)).filter((tag) => {
    const key = tag.toLocaleLowerCase();
    if (!tag || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function isParseSubmitSkipped(result?: DocumentParseSubmit | null) {
  if (!result) return false;
  if (result.skipped === true) return true;
  if (result.skipped === false) return false;
  return Array.isArray(result.taskIds) && result.taskIds.length === 0;
}

export const ACTIVE_DOCUMENT_STATUSES = ['PARSING', 'PARSED', 'CHUNKING', 'TAGGING', 'EMBEDDING', 'INDEXING'];
export const REPARSE_SKIPPED_MESSAGE = '服务端判定配置签名未变化，未创建任务；结果不对时可使用强制全量解析。';
