import type { DocumentElementList, MediaAsset, MediaAssetBbox, MediaAssetStructureContent, MediaAssetType } from './types';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!text || (!text.startsWith('{') && !text.startsWith('['))) return value;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return value;
  }
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function finiteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function stringArray(value: unknown): string[] | undefined {
  const parsed = parseJsonValue(value);
  if (Array.isArray(parsed)) {
    const tags = parsed
      .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
      .filter(Boolean);
    return tags.length ? tags : [];
  }
  if (typeof parsed === 'string') {
    const tags = parsed.split(/[、,，;；\n]/).map((item) => item.trim()).filter(Boolean);
    return tags.length ? tags : [];
  }
  return undefined;
}

/** 兼容 camelCase / snake_case，以及 JSON 字符串形式的结构字段。 */
function structuredValue<T extends MediaAssetBbox | MediaAssetStructureContent>(value: unknown): T | undefined {
  const parsed = parseJsonValue(value);
  if (typeof parsed === 'string' || Array.isArray(parsed) || asRecord(parsed)) return parsed as T;
  return undefined;
}

export function normalizeMediaAssetType(value: unknown): MediaAssetType {
  const raw = String(value ?? 'IMAGE').trim().toUpperCase();
  if (raw === 'TABLE') return 'TABLE';
  if (raw === 'FORMULA' || raw === 'EQUATION' || raw === 'MATH') return 'FORMULA';
  if (raw === 'SEAL' || raw === 'STAMP') return 'SEAL';
  if (raw === 'SIGNATURE') return 'SIGNATURE';
  return 'IMAGE';
}

/**
 * 统一文档元素接口响应。新后端字段为 camelCase，仍兼容早期 media 表/开放接口的 snake_case。
 */
export function normalizeMediaAsset(value: unknown): MediaAsset {
  const row = asRecord(value) ?? {};
  const tags = stringArray(row.tags);
  const asset: MediaAsset = {
    assetId: firstString(row.assetId, row.asset_id, row.id) ?? '',
    assetType: normalizeMediaAssetType(row.assetType ?? row.asset_type ?? row.elementType ?? row.element_type)
  };

  const mimeType = firstString(row.mimeType, row.mime_type);
  const previewUrl = firstString(row.previewUrl, row.preview_url, row.url);
  const caption = firstString(row.caption, row.title, row.description);
  const ocrText = firstString(row.ocrText, row.ocr_text, row.text);
  const source = firstString(row.source, row.parserSource, row.parser_source);
  const structurePath = firstString(row.structurePath, row.structure_path);
  const width = finiteNumber(row.width);
  const height = finiteNumber(row.height);
  const pageNum = finiteNumber(row.pageNum ?? row.page_num ?? row.pageIndex ?? row.page_index);
  const confidence = finiteNumber(row.confidence ?? row.score);
  const bbox = structuredValue<MediaAssetBbox>(row.bbox ?? row.boundingBox ?? row.bounding_box);
  const structureContent = structuredValue<MediaAssetStructureContent>(
    row.structureContent ?? row.structure_content ?? row.content
  );

  if (mimeType) asset.mimeType = mimeType;
  if (previewUrl) asset.previewUrl = previewUrl;
  if (caption) asset.caption = caption;
  if (ocrText) asset.ocrText = ocrText;
  if (source) asset.source = source;
  if (structurePath) asset.structurePath = structurePath;
  if (width != null) asset.width = width;
  if (height != null) asset.height = height;
  if (pageNum != null) asset.pageNum = pageNum;
  if (confidence != null) asset.confidence = confidence;
  if (bbox != null) asset.bbox = bbox;
  if (structureContent != null) asset.structureContent = structureContent;
  if (tags != null) asset.tags = tags;
  return asset;
}

export function normalizeDocumentElementList(value: unknown): DocumentElementList {
  const row = asRecord(value) ?? {};
  const records = Array.isArray(row.records)
    ? row.records.map(normalizeMediaAsset)
    : Array.isArray(row.list)
      ? row.list.map(normalizeMediaAsset)
      : [];
  const total = finiteNumber(row.total) ?? records.length;
  return { total, records };
}

