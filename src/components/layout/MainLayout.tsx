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
      <div className="flex-1 flex flex-col min-w-0 min-h-0" >
        <Header />
        
        {/* 页面内容 */}
        <main className="flex-1 bg-white overflow-hidden shadow-sheet rounded-[32px] p-8 mr-3 my-3 ml-4">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
