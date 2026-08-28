export interface KnowledgeReferencePart {
  id: string;
  content: string;
  title?: string;
  type?: string;
  score?: number;
  imageId?: string;
  imageUrl?: string;
  pageStart?: number;
  pageEnd?: number;
}

export interface KnowledgeReferenceSource {
  docId: string;
  datasetId: string;
  docName: string;
  fileExtension?: string;
  answerSource?: string;
  linkType?: string;
  parts: KnowledgeReferencePart[];
}

export interface KnowledgeReferenceData {
  contentType: 'reference';
  sources: KnowledgeReferenceSource[];
  imageUrls: string[];
}

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!text) return value;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return value;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  const parsed = parseJson(value);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : null;
}

function asText(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && Boolean(value.trim()))?.trim();
}

function asPositiveNumber(value: unknown) {
  return typeof value === 'number' && value > 0 ? value : undefined;
}

export function resolveKnowledgeImageUrl(imageUrl?: string, imageId?: string) {
  if (imageUrl) {
    if (/^https?:\/\//.test(imageUrl) || imageUrl.startsWith('/')) return imageUrl;
    return `/gpt/kb/media/preview/${imageUrl}`;
  }
  return imageId ? `/gpt/kb/media/preview/${imageId}` : undefined;
}

function parsePart(value: unknown, fallbackId: string): KnowledgeReferencePart | null {
  const row = asRecord(value);
  if (!row) return null;
  const content = asText(row.content, row.q, row.a) ?? '';
  const imageId = asText(row.imageId, row.image_id);
  const imageUrl = asText(row.imageUrl, row.image_url);
  const id = asText(row.id) ?? fallbackId;
  if (!content && !imageId && !imageUrl) return null;
  return {
    id,
    content,
    title: asText(row.title),
    type: asText(row.type),
    score: typeof row.score === 'number' ? row.score : undefined,
    imageId,
    imageUrl,
    pageStart: asPositiveNumber(row.pageStart ?? row.page_start),
    pageEnd: asPositiveNumber(row.pageEnd ?? row.page_end),
  };
}

function parseSource(value: unknown, index: number): KnowledgeReferenceSource | null {
  const row = asRecord(value);
  if (!row) return null;
  const rawDocId = asText(
    row.docId,
    row.doc_id,
    row.sourceId,
    row.source_id,
    row.collectionId,
    row.id,
  );
  const rawDocName = asText(
    row.docName,
    row.doc_name,
    row.sourceName,
    row.source_name,
    row.title,
  );
  if (!rawDocId && !rawDocName) return null;
  const docId = rawDocId ?? `reference-${index}`;
  const docName = rawDocName ?? `引用 ${index + 1}`;
  const rawParts = Array.isArray(row.parts) ? row.parts : [];
  let parts = rawParts
    .map((part, partIndex) => parsePart(part, `${docId}-${partIndex}`))
    .filter((part): part is KnowledgeReferencePart => Boolean(part));
  if (!parts.length) {
    const part = parsePart(row, docId);
    if (part) parts = [part];
  }
  return {
    docId,
    datasetId: asText(row.datasetId, row.dataset_id) ?? '',
    docName,
    fileExtension: asText(row.fileExtension, row.file_extension),
    answerSource: asText(row.answerSource, row.answer_source),
    linkType: asText(row.linkType, row.link_type),
    parts,
  };
}

/** 统一兼容 AgentSearchData、sources、quoteQA 数组和 JSON 字符串。 */
export function normalizeKnowledgeReference(value: unknown): KnowledgeReferenceData | null {
  const parsed = parseJson(value);
  const root = asRecord(parsed);
  const rawSources = Array.isArray(parsed)
    ? parsed
    : Array.isArray(root?.sources)
      ? root.sources
      : root
        ? [root]
        : [];
  const sources = rawSources
    .map(parseSource)
    .filter((source): source is KnowledgeReferenceSource => Boolean(source));
  if (!sources.length) return null;

  const imageUrls = new Set<string>();
  sources.forEach((source) => source.parts.forEach((part) => {
    const url = resolveKnowledgeImageUrl(part.imageUrl, part.imageId);
    if (url) imageUrls.add(url);
  }));
  const imageIds = Array.isArray(root?.imagesIds)
    ? root.imagesIds
    : Array.isArray(root?.imageIds)
      ? root.imageIds
      : [];
  imageIds.forEach((id) => {
    if (typeof id !== 'string') return;
    const url = resolveKnowledgeImageUrl(undefined, id.trim());
    if (url) imageUrls.add(url);
  });

  return { contentType: 'reference', sources, imageUrls: [...imageUrls] };
}
