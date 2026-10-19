import type { WorkflowValueType } from '../types';

const LABELS: Record<WorkflowValueType, string> = {
  string: '文本', number: '数字', boolean: '布尔值', object: 'JSON 对象',
  array: '数组', arrayAny: '数组', arrayString: '文本数组', arrayNumber: '数字数组',
  arrayBoolean: '布尔数组', arrayObject: '对象数组', file: '文件数组', any: '任意类型',
  chatHistory: '聊天记录', datasetQuote: '知识库引用', dynamic: '动态类型',
  selectDataset: '知识库选择', selectApp: '应用选择',
};

export function getValueTypeLabel(type: WorkflowValueType) {
  return LABELS[type] ?? type;
}

/** 全局数组与节点参数数组使用不同协议码，但表示同一种通用数组。 */
export function getReferenceValueType(type: WorkflowValueType): WorkflowValueType {
  return type === 'array' ? 'arrayAny' : type;
}

export function isDataValueType(type: WorkflowValueType) {
  return !['dynamic', 'selectDataset', 'selectApp'].includes(type);
}

export const WORKFLOW_DATA_TYPES: WorkflowValueType[] = [
  'string', 'number', 'boolean', 'object', 'file',
  'arrayString', 'arrayNumber', 'arrayBoolean', 'arrayObject', 'arrayAny', 'any',
];

export function isArrayValueType(type: WorkflowValueType) {
  return type === 'array' || type.startsWith('array');
}
