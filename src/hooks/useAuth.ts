import { prepareMenus } from '@/features/permissions/routes';
import { useMutation } from '@tanstack/react-query';
import { login, logout, getCurrentUser } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useLayoutStore } from '@/stores/layout';
import type { LoginPayload } from '@/types';

// 登录
export function useLogin() {
  const { setToken, setUser } = useAuthStore();
  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (data, variables) => {
      useLayoutStore.getState().resetLayout();
      setToken(data.token, data.refreshToken, data.tenantId, data.expiresIn);
      setUser(getCurrentUser(data, variables.username));
      if (data.permission?.menus !== undefined) useAuthStore.getState().setMenus(prepareMenus(data.permission.menus));
    },
  });
}

// 退出登录
export function useLogout() {
  const { clear } = useAuthStore();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // 无论成功失败都清除本地状态并跳登录页
      clear();
      useLayoutStore.getState().resetLayout();
      window.location.replace('/login');
    },
  });
}
