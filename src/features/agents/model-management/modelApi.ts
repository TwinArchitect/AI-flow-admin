import { http } from '@/api/client';
import type {
  AgentOpenModel,
  ModelCategoriesResult,
  ModelDebugPayload,
  ModelDebugResult,
  ModelQuery,
  ModelSavePayload,
} from './types';

type PageResult<T> = { records: T[]; total: number };

export async function getModelCategories() {
  const response = await http.get<ModelCategoriesResult>('/gpt/base/model/categories');
  return response.data;
}

export async function queryModels(params: ModelQuery) {
  const response = await http.post<PageResult<AgentOpenModel>>('/gpt/base/model/query', params);
  return response.data;
}

export async function getModel(id: string) {
  const response = await http.get<AgentOpenModel>(`/gpt/base/model/get/${id}`);
  return response.data;
}

export async function saveModel(payload: ModelSavePayload) {
  const { id: _id, ...body } = payload;
  const response = await http.post('/gpt/base/model/save', body);
  return response.data;
}

export async function updateModel(payload: ModelSavePayload & { id: string }) {
  const response = await http.post('/gpt/base/model/update', payload);
  return response.data;
}

export async function deleteModel(id: string) {
  const response = await http.delete(`/gpt/base/model/delete/${id}`);
  return response.data;
}

export async function debugModel(payload: ModelDebugPayload) {
  const response = await http.post<ModelDebugResult>('/gpt/base/model/debug', payload);
  return response.data;
}
