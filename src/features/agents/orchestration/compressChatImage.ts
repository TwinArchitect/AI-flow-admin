/** 对齐 Qwen3-VL 默认视觉预算：长边 1280、总像素 1280×32×32 */
const MAX_LONG_EDGE = 1280;
const MAX_PIXELS = 1280 * 32 * 32;
const JPEG_QUALITY = 0.82;
const MIN_QUALITY = 0.5;
const TARGET_MAX_BYTES = 2 * 1024 * 1024;

const SKIP_COMPRESS_EXTS = new Set(['gif', 'svg', 'ico']);
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'bmp', 'heic', 'heif']);

function fileExt(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function isCompressibleImage(file: File): boolean {
  const ext = fileExt(file.name);
  if (SKIP_COMPRESS_EXTS.has(ext)) return false;
  const mime = (file.type || '').toLowerCase();
  if (mime === 'image/gif' || mime === 'image/svg+xml') return false;
  if (mime.startsWith('image/')) return true;
  return IMAGE_EXTS.has(ext);
}

function scaleFor(width: number, height: number): number {
  const longEdge = Math.max(width, height);
  const pixels = width * height;
  const byEdge = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1;
  const byPixels = pixels > MAX_PIXELS ? Math.sqrt(MAX_PIXELS / pixels) : 1;
  return Math.min(1, byEdge, byPixels);
}

function withJpgName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '') || `photo-${Date.now()}`;
  return `${base}.jpg`;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

async function loadImageSource(
  file: File
): Promise<{ width: number; height: number; source: CanvasImageSource; close?: () => void } | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return {
      width: bitmap.width,
      height: bitmap.height,
      source: bitmap,
      close: () => bitmap.close()
    };
  } catch {
    /* Safari / HEIC 等走 img 回退 */
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        source: img
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * 对话附件：相册 / 拍照图过大时等比压到 VL 可吃的分辨率。
 * 非图片、GIF、解码失败或已足够小则原样返回。
 */
export async function compressChatImageIfNeeded(file: File): Promise<File> {
  if (typeof document === 'undefined' || !isCompressibleImage(file)) return file;

  const loaded = await loadImageSource(file);
  if (!loaded || loaded.width < 1 || loaded.height < 1) return file;

  const scale = scaleFor(loaded.width, loaded.height);
  if (scale >= 1 && file.size <= TARGET_MAX_BYTES) {
    loaded.close?.();
    return file;
  }

  const width = Math.max(1, Math.round(loaded.width * scale));
  const height = Math.max(1, Math.round(loaded.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    loaded.close?.();
    return file;
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(loaded.source, 0, 0, width, height);
  loaded.close?.();

  let quality = JPEG_QUALITY;
  let blob = await canvasToBlob(canvas, quality);
  while (blob && blob.size > TARGET_MAX_BYTES && quality > MIN_QUALITY + 0.01) {
    quality = Math.max(MIN_QUALITY, quality - 0.08);
    blob = await canvasToBlob(canvas, quality);
  }

  if (!blob) return file;
  if (blob.size >= file.size && scale >= 1) return file;

  return new File([blob], withJpgName(file.name), {
    type: 'image/jpeg',
    lastModified: Date.now()
  });
}
