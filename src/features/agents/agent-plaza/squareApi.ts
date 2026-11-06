import { http } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import type { AgentLabel } from '@/types/agent';

export interface SquareAgent {
  id: string;
  agentName?: string;
  headImg?: string;
  remark?: string;
  flowType?: number;
  squareLabelId?: string;
  squareTime?: string;
  welcomeText?: string;
  openingQuestions?: string[];
  useCount?: number;
  favoriteCount?: number;
  isFeatured?: number;
}

export interface SquareQuery {
  pageNum: number;
  pageSize: number;
  agentName?: string;
  squareLabelId?: string;
  featured?: boolean;
}

export interface SquareBanner {
  id: string;
  title: string;
  description?: string;
  tag?: string;
  imageFileId?: string;
  actionLabel?: string;
  actionUrl?: string;
  actionTarget?: 'internal' | 'external';
}

export function querySquare(params: SquareQuery, signal?: AbortSignal) {
  return http
    .post<{
      records: SquareAgent[];
      total: number;
    }>('/gpt/base/agent/square/query', params, { signal })
    .then((response) => response.data);
}

export function getSquareDetail(id: string, signal?: AbortSignal) {
  return http
    .get<SquareAgent>(`/gpt/base/agent/square/detail/${encodeURIComponent(id)}`, { signal })
    .then((response) => response.data);
}

export function getSquareLabels(signal?: AbortSignal) {
  return http
    .get<AgentLabel[]>('/gpt/base/agent/label/list/enabled?category=square', { signal })
    .then((response) => (Array.isArray(response.data) ? response.data : []));
}

export function parseSquareBanners(value: unknown): SquareBanner[] {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(source)) return [];
  return source
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .filter(
      (item) =>
        typeof item.title === 'string' &&
        item.title.trim() &&
        typeof item.imageFileId === 'string' &&
        item.imageFileId.trim() &&
        item.enabled !== false &&
        item.enabled !== 0 &&
        item.enabled !== '0'
    )
    .sort((a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0))
    .map<SquareBanner>((item, index) => {
      const text = (key: string) => (typeof item[key] === 'string' ? item[key].trim() : '');
      return {
        id: text('id') || `banner-${index}`,
        title: text('title'),
        description: text('description'),
        tag: text('tag') || '推荐应用',
        imageFileId: text('imageFileId'),
        actionLabel: text('actionLabel') || '立即体验',
        actionUrl: text('actionUrl'),
        actionTarget: item.actionTarget === 'internal' ? 'internal' : 'external',
      };
    });
}

export async function getSquareBanners(signal?: AbortSignal) {
  const tenantId = useAuthStore.getState().tenantId;
  const response = await http.get<{ squareBanners?: unknown }>('/gpt/auth/setting/public', {
    params: tenantId ? { tenantId } : undefined,
    signal,
  });
  return parseSquareBanners(response.data?.squareBanners);
}

export function squareAssetUrl(ref: string) {
  if (/^(https?:\/\/|\/|data:image\/)/i.test(ref)) return ref;
  return `/gpt/file/online?id=${encodeURIComponent(ref)}`;
}

export function getSquareWelcome(id: string, signal?: AbortSignal) {
  return http
    .get<{
      openingQuestions?: string[];
    }>(`/gpt/base/agent/welcome/${encodeURIComponent(id)}`, { signal })
    .then((response) => response.data);
}
