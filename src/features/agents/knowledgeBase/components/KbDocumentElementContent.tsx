import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import type { MediaAsset, MediaAssetStructureContent, MediaAssetType } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
function ReactMarkdownView({ content, className }: { content: string; className?: string }) { return <div className={className}><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></div>; }

export const MEDIA_ASSET_TYPE_OPTIONS: Array<{ value: 'ALL' | MediaAssetType; label: string }> = [
  { value: 'ALL', label: '全部' },
  { value: 'IMAGE', label: '图片' },
  { value: 'TABLE', label: '表格' },
  { value: 'FORMULA', label: '公式' },
  { value: 'SEAL', label: '印章' },
  { value: 'SIGNATURE', label: '手写签字' }
];

const TYPE_LABELS: Record<MediaAssetType, string> = {
  IMAGE: '图片',
  TABLE: '表格',
  FORMULA: '公式',
  SEAL: '印章',
  SIGNATURE: '手写签字'
};

type StructureRecord = Record<string, unknown>;

function parseStructure(value?: MediaAssetStructureContent): unknown {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!text || (!text.startsWith('{') && !text.startsWith('['))) return value;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return value;
  }
}

function asRecord(value: unknown): StructureRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as StructureRecord)
    : null;
}

function textOf(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

function firstText(record: StructureRecord | null, keys: string[]): string | null {
  if (!record) return null;
  for (const key of keys) {
    const text = textOf(record[key]);
    if (text) return text;
  }
  return null;
}

function cellText(value: unknown): string {
  const simple = textOf(value);
  if (simple != null) return simple;
  const record = asRecord(value);
  const fromRecord = firstText(record, ['text', 'value', 'content', 'name', 'label']);
  if (fromRecord) return fromRecord;
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

type TableData = { headers: string[]; rows: string[][] };

function normalizeRows(value: unknown): string[][] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    if (Array.isArray(row)) return row.map(cellText);
    const record = asRecord(row);
    return record ? Object.values(record).map(cellText) : [cellText(row)];
  });
}

function tableDataOf(value: unknown): TableData | null {
  const record = asRecord(value);
  const directRows = Array.isArray(value) ? normalizeRows(value) : [];
  const rawRows = record?.rows ?? record?.data ?? record?.tableData ?? record?.table_data;
  const rows = directRows.length ? directRows : normalizeRows(rawRows);
  if (!rows.length) return null;

  const rawHeaders = record?.headers ?? record?.header ?? record?.columns ?? record?.columnNames ?? record?.column_names;
  const headers = Array.isArray(rawHeaders) ? rawHeaders.map(cellText) : [];
  return { headers, rows };
}

function tableHtmlOf(value: unknown): string | null {
  const text = textOf(value);
  if (text && /<\/?table[\s>]/i.test(text)) return text;
  const candidate = firstText(asRecord(value), [
    'html',
    'tableHtml',
    'table_html',
    'tableBody',
    'table_body',
    'previewHtml',
    'preview_html'
  ]);
  return candidate && /<\/?table[\s>]/i.test(candidate) ? candidate : null;
}

function tableMarkdownOf(value: unknown): string | null {
  const text = textOf(value);
  if (text && /\|.+\|/.test(text)) return text;
  const candidate = firstText(asRecord(value), [
    'markdown',
    'tableMarkdown',
    'table_markdown',
    'tableBody',
    'table_body',
    'text'
  ]);
  return candidate && /\|.+\|/.test(candidate) ? candidate : null;
}

function formulaTextOf(value: unknown): { text: string; label: string } | null {
  const text = textOf(value);
  if (text) {
    if (/<m:oMath(?:Para)?[\s>]/i.test(text)) return { text, label: 'OMML' };
    if (/<math[\s>]/i.test(text)) return { text, label: 'MathML' };
    return { text, label: 'LaTeX' };
  }
  const record = asRecord(value);
  const latex = firstText(record, ['latex', 'tex', 'formula', 'formulaText', 'formula_text']);
  if (latex) return { text: latex, label: 'LaTeX' };
  const mathml = firstText(record, ['mathml']);
  if (mathml) return { text: mathml, label: 'MathML' };
  const plain = firstText(record, ['text', 'content', 'value']);
  return plain ? { text: plain, label: '公式文本' } : null;
}

function sealTypeOf(value: unknown): string | null {
  const text = textOf(value);
  if (text) return text;
  return firstText(asRecord(value), [
    'sealType',
    'seal_type',
    'classification',
    'category',
    'type',
    'name'
  ]);
}

export function getMediaAssetType(asset?: Pick<MediaAsset, 'assetType'> | null): MediaAssetType {
  const raw = String(asset?.assetType ?? 'IMAGE').trim().toUpperCase();
  if (raw === 'TABLE') return 'TABLE';
  if (raw === 'FORMULA' || raw === 'EQUATION' || raw === 'MATH') return 'FORMULA';
  if (raw === 'SEAL' || raw === 'STAMP') return 'SEAL';
  if (raw === 'SIGNATURE') return 'SIGNATURE';
  return 'IMAGE';
}

export function mediaAssetTypeLabel(asset?: Pick<MediaAsset, 'assetType'> | null): string {
  return TYPE_LABELS[getMediaAssetType(asset)];
}

export function mediaAssetSourceLabel(source?: string | null): string | null {
  if (!source?.trim()) return null;
  const normalized = source.trim().toUpperCase();
  const labels: Record<string, string> = {
    DOCX: 'Docx',
    MINERU: 'MinerU',
    VISION: '视觉识别',
    OCR: 'OCR'
  };
  return labels[normalized] ?? source.trim();
}

/** 表格结构、公式文本/LaTex、印章分类信息的通用展示。 */
export function KbDocumentElementContent({
  asset,
  className = ''
}: {
  asset: MediaAsset;
  className?: string;
}) {
  const assetType = getMediaAssetType(asset);
  const structure = useMemo(() => parseStructure(asset.structureContent), [asset.structureContent]);
  const html = useMemo(() => tableHtmlOf(structure), [structure]);
  const safeHtml = useMemo(
    () => (html ? DOMPurify.sanitize(html, { FORBID_TAGS: ['video', 'audio', 'source', 'style'] }) : ''),
    [html]
  );
  const table = useMemo(() => tableDataOf(structure), [structure]);
  const markdown = useMemo(() => tableMarkdownOf(structure), [structure]);
  const formula = useMemo(() => formulaTextOf(structure), [structure]);
  const sealType = useMemo(() => sealTypeOf(structure), [structure]);

  if (assetType === 'IMAGE') return null;

  if (assetType === 'SIGNATURE') {
    const text = firstText(asRecord(structure), ['text']) ?? asset.ocrText?.trim() ?? asset.caption?.trim();
    return (
      <div className={`rounded-lg border border-border bg-muted/30 px-2 py-1.5 dark:border-border dark:bg-muted/30 ${className}`}>
        <p className="text-[10px] font-bold text-primary dark:text-primary">手写签字识别</p>
        <p className="mt-1 whitespace-pre-wrap break-words text-[10px] leading-relaxed text-muted-foreground">{text || '无法辨认'}</p>
      </div>
    );
  }


  if (assetType === 'TABLE') {
    if (safeHtml) {
      return (
        <div
          className={`overflow-auto rounded-lg border border-border/70 bg-card p-2 text-[10px] text-muted-foreground [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 ${className}`}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      );
    }
    if (table) {
      return (
        <div className={`overflow-auto rounded-lg border border-border/70 bg-card ${className}`}>
          <table className="min-w-full border-collapse text-[10px] text-muted-foreground">
            {table.headers.length ? (
              <thead className="bg-muted/70 text-foreground">
                <tr>
                  {table.headers.map((header, index) => (
                    <th key={`${header}-${index}`} className="whitespace-nowrap border border-border px-2 py-1 text-left font-bold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="max-w-48 border border-border px-2 py-1 align-top break-words">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (markdown) {
      return (
        <div className={`overflow-auto rounded-lg border border-border/70 bg-card p-2 [&_table]:w-full [&_table]:text-[10px] ${className}`}>
          <ReactMarkdownView content={markdown} className="text-[10px] [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1" />
        </div>
      );
    }
    const plainText = textOf(structure);
    if (plainText) {
      return (
        <pre className={`max-h-40 overflow-auto rounded-lg border border-border/70 bg-card p-2 whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-muted-foreground  ${className}`}>
          {plainText}
        </pre>
      );
    }
    return asset.structurePath ? (
      <p className={`rounded-lg bg-muted/50 px-2 py-1.5 text-[10px] text-muted-foreground ${className}`}>表格结构已归档</p>
    ) : null;
  }

  if (assetType === 'FORMULA') {
    const display = formula ?? (asset.ocrText?.trim() ? { text: asset.ocrText.trim(), label: '公式文本' } : null);
    if (!display) return asset.structurePath ? <p className={`rounded-lg bg-muted/50 px-2 py-1.5 text-[10px] text-muted-foreground ${className}`}>公式结构已归档</p> : null;
    return (
      <div className={`rounded-lg border border-border bg-muted/30 px-2 py-1.5 dark:border-border dark:bg-muted/30 ${className}`}>
        <p className="mb-1 text-[10px] font-bold text-primary dark:text-primary">{display.label}</p>
        <pre className="max-h-36 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-muted-foreground ">
          {display.text}
        </pre>
      </div>
    );
  }

  const detail = sealType ?? asset.caption?.trim();
  if (!detail && !asset.ocrText?.trim()) return null;
  return (
    <div className={`rounded-lg border border-border bg-muted/30 px-2 py-1.5 dark:border-border dark:bg-muted/30 ${className}`}>
      <p className="text-[10px] font-bold text-primary dark:text-primary">
        印章类型：{detail || '待识别'}
      </p>
      {asset.ocrText?.trim() ? (
        <p className="mt-1 whitespace-pre-wrap break-words text-[10px] leading-relaxed text-muted-foreground">{asset.ocrText.trim()}</p>
      ) : null}
    </div>
  );
}
