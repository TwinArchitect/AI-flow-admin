// 登录请求参数
export interface LoginPayload {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResult {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// 当前登录用户信息
export interface CurrentUser {
  id: number;
  username: string;
  nickname: string;
  email: string;
  avatar?: string;
  role: UserRole;
  permissions: string[];
}

// 用户角色枚举
export type UserRole = 'admin' | 'editor' | 'viewer';
