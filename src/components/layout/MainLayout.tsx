import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function MainLayout() {
  return (
    <div className="flex h-screen bg-[var(--color-bg-page)]">
      {/* 侧边栏 */}
      <Sidebar />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header />
        
        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
