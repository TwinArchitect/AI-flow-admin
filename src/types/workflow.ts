import type { QueryParams } from './common';

// 工作流实体
export interface Workflow {
  id: number;
  name: string;
  description?: string;
  status: WorkflowStatus;
  triggerType: WorkflowTriggerType;
  runCount: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 工作流状态
export type WorkflowStatus = 'running' | 'paused' | 'stopped' | 'error';

// 触发类型
export type WorkflowTriggerType = 'manual' | 'schedule' | 'webhook' | 'event';

// 创建工作流参数
export interface CreateWorkflowPayload {
  name: string;
  description?: string;
  triggerType: WorkflowTriggerType;
}

// 更新工作流参数
export type UpdateWorkflowPayload = Partial<CreateWorkflowPayload>;

// 工作流查询参数
export interface WorkflowQueryParams extends QueryParams {
  status?: WorkflowStatus;
  triggerType?: WorkflowTriggerType;
}
