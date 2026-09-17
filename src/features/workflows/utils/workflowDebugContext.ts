import type { StartVariable, WorkflowCanvasNode } from '../types';
import { resolveWorkflowFileType } from '../api/workflowDebugApi';
import { isSystemStartVariable, normalizeStartConfig } from '../contracts/startNodeContract';
import { sanitizeDebugStringValue } from './sanitizePastedText';

const WORKFLOW_FILE_EXTENSIONS = new Set([
  'txt', 'doc', 'docx', 'csv', 'xls', 'xlsx', 'zip', 'pdf', 'ppt', 'pptx',
  'bmp', 'mp3', 'mp4', 'flv', 'svg', 'jpg', 'jpeg', 'png',
]);

export function validateWorkflowUploadFile(file: File, maxSizeMb = 50) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!WORKFLOW_FILE_EXTENSIONS.has(extension)) return `不支持的文件类型：${extension || '未知'}`;
  if (file.size > maxSizeMb * 1024 * 1024) return `「${file.name}」超过 ${maxSizeMb}MB 限制`;
  return null;
}

export interface WorkflowDebugContext {
  customStartVariables: StartVariable[];
  needsVariableForm: boolean;
}

export interface DebugFileVariableValue {
  fileId: string;
  fileName: string;
}

export function serializeDebugFileValue(fileId: string, fileName: string): string {
  return JSON.stringify([{ fileId, fileName } satisfies DebugFileVariableValue]);
}

export function parseDebugFileValueList(raw: string): DebugFileVariableValue[] {
  const value = raw.trim();
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return items.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const record = item as Record<string, unknown>;
      const fileId = String(record.fileId ?? record.id ?? '').trim();
      if (!fileId) return [];
      const fileName = String(record.fileName ?? record.name ?? fileId).trim() || fileId;
      return [{ fileId, fileName }];
    });
  } catch {
    return [{ fileId: value, fileName: value }];
  }
}

export function parseDebugFileValue(raw: string): DebugFileVariableValue | null {
  return parseDebugFileValueList(raw)[0] ?? null;
}

export function getWorkflowDebugContext(nodes: WorkflowCanvasNode[]): WorkflowDebugContext {
  const startNode = nodes.find((node) => node.data.nodeType === 'start');
  const customStartVariables = startNode
    ? normalizeStartConfig(startNode.data.config).variables.filter(
        (variable) => !isSystemStartVariable(variable),
      )
    : [];

  return {
    customStartVariables,
    needsVariableForm: customStartVariables.length > 0,
  };
}

export function buildDebugVariableDefaults(variables: StartVariable[]): Record<string, string> {
  return Object.fromEntries(
    variables.map((variable) => [variable.key, variable.defaultValue ?? '']),
  );
}

export function validateDebugVariables(
  variables: StartVariable[],
  values: Record<string, string>,
): string | null {
  for (const variable of variables) {
    const name = variable.description?.trim() || variable.label?.trim() || variable.key;
    const raw = sanitizeDebugStringValue(values[variable.key] ?? '');
    if (variable.required && (variable.valueType === 'file' ? !parseDebugFileValue(raw) : !raw)) {
      return `请填写「${name}」`;
    }
    if (!raw) continue;
    if (variable.valueType === 'number' && Number.isNaN(Number(raw))) {
      return `「${name}」需为有效数字`;
    }
    if (variable.valueType === 'object' || variable.valueType === 'array') {
      try {
        JSON.parse(raw);
      } catch {
        return `「${name}」需为合法 JSON`;
      }
    }
  }
  return null;
}

export function buildWorkflowRunVariables(
  values: Record<string, string>,
  variables: StartVariable[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  variables.forEach((variable) => {
    const raw = values[variable.key]?.trim() ?? '';
    if (!raw) return;
    const apiKey = variable.label?.trim() || variable.key;
    if (variable.valueType === 'number') result[apiKey] = Number(raw);
    else if (variable.valueType === 'boolean') result[apiKey] = raw === 'true';
    else if (variable.valueType === 'file') {
      const files = parseDebugFileValueList(raw);
      if (files.length) result[apiKey] = files.map((file) => ({
        type: resolveWorkflowFileType(file.fileName),
        fileId: file.fileId,
        content: null,
      }));
    }
    else if (variable.valueType === 'object' || variable.valueType === 'array') {
      result[apiKey] = JSON.parse(raw) as unknown;
    } else result[apiKey] = raw;
  });
  return result;
}
