import { http } from './client';
import type { Workflow, CreateWorkflowPayload, UpdateWorkflowPayload, WorkflowQueryParams } from '@/types';
import type { PageResult } from '@/types';

// 获取工作流列表（分页）
export function getWorkflows(params: WorkflowQueryParams) {
  return http.get<PageResult<Workflow>>('/workflows', { params }).then(r => r.data);
}

// 获取单个工作流
export function getWorkflowById(id: number) {
  return http.get<Workflow>(`/workflows/${id}`).then(r => r.data);
}

// 创建工作流
export function createWorkflow(payload: CreateWorkflowPayload) {
  return http.post<Workflow>('/workflows', payload).then(r => r.data);
}

// 更新工作流
export function updateWorkflow(id: number, payload: UpdateWorkflowPayload) {
  return http.put<Workflow>(`/workflows/${id}`, payload).then(r => r.data);
}

// 删除工作流
export function deleteWorkflow(id: number) {
  return http.delete(`/workflows/${id}`).then(r => r.data);
}

// 启动工作流
export function startWorkflow(id: number) {
  return http.post(`/workflows/${id}/start`).then(r => r.data);
}

// 暂停工作流
export function pauseWorkflow(id: number) {
  return http.post(`/workflows/${id}/pause`).then(r => r.data);
}
