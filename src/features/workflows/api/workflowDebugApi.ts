import { http } from '@/api/client';

export interface WorkflowDebugFile {
  id: string;
  name: string;
}

interface UploadResponse {
  id?: string | Array<string | number>;
  fileNames?: string | string[];
  oldFileName?: string;
}

export async function uploadWorkflowDebugFile(
  file: File,
  voucherId: string,
): Promise<WorkflowDebugFile> {
  const body = new FormData();
  body.append('multipartFile', file);
  const query = new URLSearchParams({
    srcVoucherCode: 'workflow-debug',
    srcVoucherId: voucherId,
    status: '1',
  });
  const response = await http.post<UploadResponse>(`/gpt/file/upload?${query}`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const data = response.data;
  const id = Array.isArray(data.id) ? data.id[0] : data.id;
  const names = data.fileNames;
  const name = Array.isArray(names) ? names[0] : names;
  if (id == null || !String(id).trim()) {
    throw new Error(`「${file.name}」上传失败：后端未返回 fileId`);
  }
  return {
    id: String(id),
    name: name || data.oldFileName || file.name,
  };
}

export function resolveWorkflowFileType(fileName: string): 'image' | 'document' | 'video' {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'bmp', 'svg', 'gif', 'webp'].includes(extension)) return 'image';
  if (['mp4', 'flv'].includes(extension)) return 'video';
  return 'document';
}
