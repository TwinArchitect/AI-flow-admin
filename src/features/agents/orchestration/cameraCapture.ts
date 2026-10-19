import { compressChatImageIfNeeded } from './compressChatImage';

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif'];

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/heic': 'heic',
  'image/heif': 'heif'
};

/** 真实手机 / 窄屏触控设备（浮动窗 variant=mobile 不能当手机判断） */
export function isMobileCaptureDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPod|iPad|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const narrow = window.innerWidth <= 768;
  const touch = (navigator.maxTouchPoints ?? 0) > 0;
  return (coarse || touch) && narrow;
}

export function fileAcceptAllowsImages(fileAccept?: string): boolean {
  if (!fileAccept?.trim()) return true;
  const s = fileAccept.toLowerCase();
  if (s.includes('image/')) return true;
  return IMAGE_EXTS.some((ext) => s.includes(ext));
}

/** 拍照文件有时没有扩展名，补上后再走上传校验 */
export function normalizeChatUploadFile(file: File): File {
  const name = file.name?.trim() || '';
  if (/\.[a-z0-9]{2,8}$/i.test(name)) return file;
  const ext = MIME_TO_EXT[(file.type || '').toLowerCase()];
  if (!ext) return file;
  const base = name.replace(/\.[^.]*$/, '') || `photo-${Date.now()}`;
  return new File([file], `${base}.${ext}`, { type: file.type, lastModified: file.lastModified });
}

/** 补扩展名后按需压缩图片，再交给校验 / 上传 */
export async function prepareChatUploadFile(file: File): Promise<File> {
  return compressChatImageIfNeeded(normalizeChatUploadFile(file));
}
