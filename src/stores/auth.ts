import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentUser } from '@/types';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: CurrentUser | null;
  // 是否已登录
  isAuthenticated: boolean;
  // 设置 token
  setToken: (token: string, refreshToken: string) => void;
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
      user: null,
      isAuthenticated: false,

      setToken: (token, refreshToken) =>
        set({ token, refreshToken, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      clear: () =>
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      // 只持久化 token，用户信息登录后重新拉取
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
