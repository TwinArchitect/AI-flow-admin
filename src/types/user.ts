import type { UserRole } from './auth';
import type { QueryParams } from './common';

// 用户实体
export interface User {
  id: number;
  username: string;
  nickname: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

// 用户状态
export type UserStatus = 'active' | 'disabled' | 'pending';

// 创建用户参数
export interface CreateUserPayload {
  username: string;
  nickname: string;
  email: string;
  password: string;
  role: UserRole;
}

// 更新用户参数
export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'password'>>;

// 用户列表查询参数
export interface UserQueryParams extends QueryParams {
  role?: UserRole;
  status?: UserStatus;
}
