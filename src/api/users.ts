import { http } from './client';
import type { User, CreateUserPayload, UpdateUserPayload, UserQueryParams } from '@/types';
import type { PageResult } from '@/types';

// 获取用户列表（分页）
export function getUsers(params: UserQueryParams) {
  return http.get<PageResult<User>>('/users', { params }).then(r => r.data);
}

// 获取单个用户
export function getUserById(id: number) {
  return http.get<User>(`/users/${id}`).then(r => r.data);
}

// 创建用户
export function createUser(payload: CreateUserPayload) {
  return http.post<User>('/users', payload).then(r => r.data);
}

// 更新用户
export function updateUser(id: number, payload: UpdateUserPayload) {
  return http.put<User>(`/users/${id}`, payload).then(r => r.data);
}

// 删除用户
export function deleteUser(id: number) {
  return http.delete(`/users/${id}`).then(r => r.data);
}

// 批量删除用户
export function deleteUsers(ids: number[]) {
  return http.delete('/users/batch', { data: { ids } }).then(r => r.data);
}
