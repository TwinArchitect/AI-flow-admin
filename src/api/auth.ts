import { http } from './client';
import type { LoginPayload, LoginResult, CurrentUser } from '@/types';

// 登录
export function login(payload: LoginPayload) {
  return http.post<LoginResult>('/gpt/auth/user/login', payload).then(r => r.data);
}

// 退出登录
export function logout() {
  return http.post('/gpt/auth/user/logout').then(r => r.data);
}

// 获取当前用户信息
export function getCurrentUser(loginResult: LoginResult, fallbackUsername = ''): CurrentUser {
  return {
    id: loginResult.userId ?? loginResult.username ?? fallbackUsername,
    username: loginResult.username ?? fallbackUsername,
    nickname: loginResult.nickName ?? loginResult.username ?? fallbackUsername,
    email: loginResult.email ?? '',
    role: 'admin',
    permissions: loginResult.roles?.map((role) => role.code).filter(Boolean) as string[] ?? [],
  };
}

// 刷新 token
export function refreshToken(token: string) {
  return Promise.resolve({ token } satisfies LoginResult);
}
