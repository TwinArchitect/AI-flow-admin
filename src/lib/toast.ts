import { useToast } from '@/hooks/useToast';

// 封装业务 Toast 方法
export const toast = {
  success: (title: string, description?: string) => {
    useToast.getState().addToast({
      title,
      description,
      type: 'success',
      duration: 3000,
    });
  },

  error: (title: string, description?: string) => {
    useToast.getState().addToast({
      title,
      description,
      type: 'error',
      duration: 5000,
    });
  },

  warning: (title: string, description?: string) => {
    useToast.getState().addToast({
      title,
      description,
      type: 'warning',
      duration: 4000,
    });
  },

  info: (title: string, description?: string) => {
    useToast.getState().addToast({
      title,
      description,
      type: 'info',
      duration: 3000,
    });
  },

  // 操作确认
  confirm: (title: string, onConfirm: () => void) => {
    useToast.getState().addToast({
      title,
      type: 'info',
      action: {
        label: '确认',
        onClick: onConfirm,
      },
      duration: 10000,
    });
  },

  // 加载中
  loading: (title: string, promise: Promise<unknown>) => {
    useToast.getState().addToast({
      title: `${title}...`,
      type: 'info',
      duration: 60000,
    });

    promise
      .then(() => {
        useToast.getState().addToast({
          title: '操作成功',
          type: 'success',
          duration: 3000,
        });
      })
      .catch(() => {
        useToast.getState().addToast({
          title: '操作失败，请重试',
          type: 'error',
          duration: 5000,
        });
      });

    return promise;
  },

  // 自定义
  custom: useToast.getState().addToast,
};
