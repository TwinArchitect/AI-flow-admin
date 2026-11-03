export interface AgentFileUploadCapability {
  fileUploadEnabled?: boolean;
  fileSelectConfig?: {
    canSelectFile?: boolean; canSelectImg?: boolean; canSelectVideo?: boolean; canSelectAudio?: boolean;
    canSelectCustomFileExtension?: boolean; customFileExtensionList?: string[];
    canSelectFileExtension?: string[]; maxFiles?: number; maxFileSize?: number;
  } | null;
}

const DEFAULT_TYPES = '.pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp,.mp3,.mp4';
export function resolveAgentUploadGuide(capability?: AgentFileUploadCapability | null) {
  const cfg = capability?.fileSelectConfig;
  const types = new Set<string>();
  const add = (values: string[]) => values.forEach((value) => {
    const ext = String(value).trim().toLowerCase();
    if (ext) types.add(ext.startsWith('.') ? ext : `.${ext}`);
  });
  if (cfg?.canSelectFile) add('.pdf,.doc,.docx,.txt,.md,.xls,.xlsx,.ppt,.pptx,.csv'.split(','));
  if (cfg?.canSelectImg) add('.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.ico,.tiff'.split(','));
  if (cfg?.canSelectVideo) add(['.mp4', '.flv']);
  if (cfg?.canSelectAudio) add(['.mp3']);
  if (cfg?.canSelectCustomFileExtension) add(cfg.customFileExtensionList ?? []);
  add(cfg?.canSelectFileExtension ?? []);
  const size = Number(cfg?.maxFileSize);
  return {
    enabled: Boolean(capability?.fileUploadEnabled),
    types: types.size ? [...types].join(',') : DEFAULT_TYPES,
    maxSizeMB: Number.isFinite(size) && size > 0 ? size : 50,
    maxCount: Math.max(1, Math.min(20, Number(cfg?.maxFiles ?? 5) || 5)),
  };
}

export function validateAgentPhoto(file: Pick<File, 'name' | 'size'>, guide: ReturnType<typeof resolveAgentUploadGuide>) {
  if (!guide.enabled) return '该智能体未开启文件上传';
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!guide.types.split(',').includes(extension)) return '该智能体不支持此文件类型';
  if (file.size > guide.maxSizeMB * 1024 * 1024) return `文件大小不能超过 ${guide.maxSizeMB} MB`;
  return null;
}
