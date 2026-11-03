// 登录请求参数
export interface LoginPayload {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResult {
  token: string;
  permission?: { menus?: PermissionMenu[] };
  isPlatformAdmin?: boolean;
  isSuperAdmin?: boolean;
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
  isPlatformAdmin?: boolean;
}

// 用户角色枚举
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface PermissionMenu {
  id?: string | number; parentId?: string | number; name?: string; title?: string;
  path?: string; type?: number | string; hidden?: number | string; sort?: number | string;
  permission?: string; children?: PermissionMenu[]; childList?: PermissionMenu[];
}
