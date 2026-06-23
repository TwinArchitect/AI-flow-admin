import { http } from './client';
import type { LoginPayload, LoginResult, CurrentUser } from '@/types';

// 登录
export function login(payload: LoginPayload) {
  return http.post<LoginResult>('/auth/login', payload).then(r => r.data);
}

// 退出登录
export function logout() {
  return http.post('/auth/logout').then(r => r.data);
}

// 获取当前用户信息
export function getCurrentUser() {
  return http.get<CurrentUser>('/auth/me').then(r => r.data);
}

// 刷新 token
export function refreshToken(token: string) {
  return http.post<LoginResult>('/auth/refresh', { refreshToken: token }).then(r => r.data);
}
