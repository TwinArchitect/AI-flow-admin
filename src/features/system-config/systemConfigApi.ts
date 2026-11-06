import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/api/client';
import { useAuthStore } from '@/stores/auth';

export interface Banner {
  id: string;
  imageFileId?: string;
  title: string;
  tag?: string;
  description?: string;
  actionLabel?: string;
  actionUrl?: string;
  actionTarget?: 'internal' | 'external';
  enabled: boolean;
  sort: number;
}

export interface Brand {
  customLogo?: string;
  customBackground?: string;
  appName?: string;
  appIntro?: string;
  appCopyright?: string;
}

export interface Config extends Brand {
  id?: string;
  squareBanners: Banner[];
}

const base = '/gpt/auth/setting';
export const brandKey = ['public-system-config'];

export function useBrand() {
  const tenantId = useAuthStore((state) => state.tenantId);
  const { data } = useQuery({
    queryKey: [...brandKey, tenantId],
    queryFn: async ({ signal }) => {
      const query = tenantId ? '?' + new URLSearchParams({ tenantId }) : '';
      const response = await fetch(base + '/public' + query, { signal });
      const result = await response.json();
      if (!response.ok || ![0, 200].includes(result.code)) throw new Error('品牌配置加载失败');
      return result.data as Brand | null;
    },
    staleTime: 60_000,
    retry: false,
  });
  useEffect(() => {
    const title = data?.appName?.trim();
    if (!title) return;
    const previous = document.title;
    document.title = title;
    return () => { document.title = previous; };
  }, [data?.appName]);
  return data;
}

export async function getConfig() {
  const { data } = await http.get<Omit<Config, 'squareBanners'> & { squareBanners?: string | Banner[] }>(base + '/get');
  const source = data?.squareBanners;
  const banners: unknown = typeof source === 'string' && source.trim() ? JSON.parse(source) : source;
  if (banners != null && !Array.isArray(banners) && banners !== '') throw new Error('广告配置格式不正确');
  return { ...data, appName: data?.appName?.trim() || '睿创智枢', squareBanners: Array.isArray(banners) ? [...banners].sort((a, b) => a.sort - b.sort) : [] } as Config;
}

export async function saveConfig(config: Config) {
  const { data } = await http.post<Omit<Config, 'squareBanners'>>(base + '/save', {
    ...config,
    customLogo: config.customLogo?.trim() || null,
    customBackground: config.customBackground?.trim() || null,
    appName: config.appName?.trim(),
    appIntro: config.appIntro?.trim() ?? '',
    appCopyright: config.appCopyright?.trim() ?? '',
    squareBanners: JSON.stringify(config.squareBanners.map((banner, index) => ({ ...banner, sort: index + 1 }))),
  });
  return data;
}

export async function uploadConfigImage(file: File) {
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
    throw new Error('请选择 PNG、JPG、WebP 或 SVG 图片');
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('图片大小不能超过 5 MB');
  const form = new FormData();
  form.append('multipartFile', file);
  const { data } = await http.post<{ id?: string[] }>('/gpt/file/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { srcVoucherCode: 'system-config', srcVoucherId: 'system-config', status: 1 },
  });
  if (!data?.id?.[0]) throw new Error('上传成功但未获取到文件 ID');
  return data.id[0];
}
