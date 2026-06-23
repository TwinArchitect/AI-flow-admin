import axios from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

// axios 实例
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器 — 自动注入 token
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const raw = localStorage.getItem('auth-storage');
  if (raw) {
    try {
      const { state } = JSON.parse(raw);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {
      // ignore
    }
  }
  return config;
});

// 响应拦截器 — 统一处理错误
http.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message, data } = response.data;
    // 业务错误（code !== 0 或 200）
    if (code !== 0 && code !== 200) {
      return Promise.reject(new Error(message ?? '请求失败'));
    }
    // 只返回 data 字段，调用方不需要关心外层结构
    response.data = data as never;
    return response;
  },
  (error) => {
    // HTTP 错误
    if (error.response?.status === 401) {
      // token 失效，清除本地存储并跳转登录页
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    const message = error.response?.data?.message ?? error.message ?? '网络错误';
    return Promise.reject(new Error(message));
  },
);
