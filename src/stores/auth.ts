import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentUser } from '@/types';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  user: CurrentUser | null;
  // 是否已登录
  isAuthenticated: boolean;
  // 设置 token
  setToken: (token: string, refreshToken?: string, tenantId?: string) => void;
  // 设置用户信息
  setUser: (user: CurrentUser) => void;
  // 清除所有认证信息（退出登录）
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      tenantId: null,
      user: null,
      isAuthenticated: false,

      setToken: (token, refreshToken = '', tenantId) =>
        set({ token, refreshToken, tenantId, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      clear: () =>
        set({ token: null, refreshToken: null, tenantId: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      // 持久化完整登录会话，页面刷新后可直接恢复。
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        tenantId: state.tenantId,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
