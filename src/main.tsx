import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster, toast } from 'sonner';

import { TooltipProvider } from '@/components/ui/tooltip';
import { router } from '@/routes';
import '@/styles/index.css';

// React Query 客户端（含全局错误兜底）
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // 只对没有自己处理 error 的查询兜底提示
      if (query.meta?.silentError) return;
      toast.error((error as Error).message ?? '请求失败');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silentError) return;
      toast.error((error as Error).message ?? '操作失败');
    },
  }),
});

// 初始化主题（从 localStorage 恢复）
const theme = localStorage.getItem('theme-storage');
if (theme) {
  try {
    const parsed = JSON.parse(theme);
    if (parsed.state?.isDark) {
      document.documentElement.classList.add('dark');
    }
  } catch {
    // ignore
  }
}

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-default)',
          },
        }}
      />
    </TooltipProvider>
  </QueryClientProvider>
);
