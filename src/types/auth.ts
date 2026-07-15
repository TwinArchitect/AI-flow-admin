// 登录请求参数
export interface LoginPayload {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResult {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
  userId?: string;
  nickName?: string;
  username?: string;
  email?: string;
  tenantId?: string;
  roles?: Array<{ code?: string; name?: string }>;
}

// 当前登录用户信息
export interface CurrentUser {
  id: number | string;
  username: string;
  nickname: string;
  email: string;
  avatar?: string;
  role: UserRole;
  permissions: string[];
}

// 用户角色枚举
export type UserRole = 'admin' | 'editor' | 'viewer';
