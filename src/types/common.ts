// 通用 API 响应结构
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

// 分页响应结构
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 分页请求参数
export interface PageParams {
  page: number;
  pageSize: number;
}

// 通用排序方向
export type SortOrder = 'asc' | 'desc';

// 通用查询参数（可扩展）
export interface QueryParams extends PageParams {
  keyword?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
}
