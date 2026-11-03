import type { RetrievalChunk } from './types';

/** 与参照一致，优先有限数值的 snake_case 分数，再兼容 camelCase。 */
export function normalizeRetrievalChunk(item: RetrievalChunk): RetrievalChunk {
  const raw = item as RetrievalChunk & Record<string, unknown>;
  const score = (snake: string, camel: string) => {
    const first = raw[snake];
    if (typeof first === 'number' && Number.isFinite(first)) return first;
    const second = raw[camel];
    return typeof second === 'number' && Number.isFinite(second) ? second : undefined;
  };
  return { ...item,
    vector_similarity: score('vector_similarity', 'vectorSimilarity'),
    term_similarity: score('term_similarity', 'termSimilarity'),
    fusion_similarity: score('fusion_similarity', 'fusionSimilarity'),
    rerank_similarity: score('rerank_similarity', 'rerankSimilarity'),
  };
}
