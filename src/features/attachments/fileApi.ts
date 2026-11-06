import { http } from '@/api/client';
import { authFetch } from '@/lib/authSession';

export const fileBase = '/gpt/file';
export const voucherCode = 'file-manage';
export type ManagedFile = {
  id: string; oldFileName?: string; type?: string; size?: number; srcVoucherCode?: string;
  srcVoucherId?: string; status?: number; username?: string; creator?: string; createTime?: string;
};
export type UploadMode = 'single' | 'multi' | 'zip';
const extensions = new Set('txt doc docx csv xls xlsx zip pdf ppt pptx bmp mp3 mp4 flv svg jpg jpeg png'.split(' '));
const mimeExtensions: Record<string, string> = {
  'application/pdf': 'pdf', 'application/x-pdf': 'pdf', 'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt', 'text/csv': 'csv', 'image/jpeg': 'jpg', 'image/png': 'png',
  'image/bmp': 'bmp', 'image/svg+xml': 'svg', 'audio/mpeg': 'mp3', 'video/mp4': 'mp4',
};

export async function uploadFiles(files: File[], mode: UploadMode, voucherId: string, status: string, progress: (percent: number) => void) {
  const form = new FormData();
  for (const file of files) {
    const name = file.name.trim();
    const suffix = name.match(/\.([^.]+)$/)?.[1].toLowerCase();
    const ext = suffix || mimeExtensions[file.type.toLowerCase()];
    if (mode === 'zip' ? ext !== 'zip' : !extensions.has(ext)) {
      throw new Error(`该文件类型不允许上传：${ext || '未知'}`);
    }
    form.append(mode === 'multi' ? 'multipartFiles' : 'multipartFile', file, suffix ? name : `${name || 'file'}.${ext}`);
  }
  const params = new URLSearchParams({ srcVoucherId: voucherId, status });
  params.set(mode === 'single' ? 'srcVoucherCode' : 'memoryCode', voucherCode);
  if (mode === 'multi') params.set('toPdf', '0');
  const endpoint = mode === 'single' ? 'upload' : mode === 'multi' ? 'uploads' : 'zip/upload';
  const result = await http.post(`${fileBase}/${endpoint}?${params}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }, timeout: 0,
    onUploadProgress: event => { if (event.total) progress(Math.round(event.loaded / event.total * 100)); },
  });
  if (result.data === false) throw new Error('上传失败');
}

export async function fileBlob(path: string, init?: RequestInit) {
  const response = await authFetch(`${fileBase}/${path}`, init);
  if (response.headers.get('content-type')?.includes('application/json')) {
    const result = await response.json();
    throw new Error(result.message || '无法读取附件');
  }
  if (!response.ok) throw new Error(`无法读取附件（HTTP ${response.status}）`);
  return response.blob();
}

export async function downloadFile(path: string, name: string, init?: RequestInit) {
  const url = URL.createObjectURL(await fileBlob(path, init));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
