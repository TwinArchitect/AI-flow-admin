import { create } from 'zustand';

export interface ToastOptions {
  id?: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: ToastOptions[];
  addToast: (options: ToastOptions) => void;
  removeToast: (id: string) => void;
}

let toastId = 0;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  addToast: (options) => {
    const id = options.id || `toast-${++toastId}`;
    const duration = options.duration || 5000;

    set((state) => ({
      toasts: [...state.toasts, { ...options, id }],
    }));

    // Auto remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
