/** 对话附件覆盖参照默认类型，同时保留本项目已有文档和视频类型。 */
const EXTENSIONS = [
  'txt', 'md', 'doc', 'docx', 'csv', 'xls', 'xlsx', 'zip', 'pdf', 'ppt', 'pptx',
  'bmp', 'mp3', 'mp4', 'flv', 'svg', 'jpg', 'jpeg', 'png', 'gif', 'webp',
];
export const CHAT_FILE_ACCEPT = EXTENSIONS.map((type) => `.${type}`).join(',');

export function validateChatUploadFile(file: Pick<File, 'name' | 'size'>): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!EXTENSIONS.includes(extension)) return `不支持的文件类型：${extension || '未知'}`;
  if (file.size > 50 * 1024 * 1024) return `「${file.name}」超过 50MB 限制`;
  return null;
}
