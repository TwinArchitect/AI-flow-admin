import { Outlet, useMatches } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { RouteTabs } from './RouteTabs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useLayoutStore } from '@/stores/layout';
import { cn } from '@/lib/utils';
import { FloatingAiAssistant } from '@/features/agents/overview/components/FloatingAiAssistant';

export function MainLayout() {
  const matches = useMatches();
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore();
  const layoutMode = [...matches]
    .reverse()
    .map((match) => match.handle as { contentLayout?: 'fixed' | 'fullscreen' } | undefined)
    .find((handle) => handle?.contentLayout)?.contentLayout ?? 'fixed';
  const showSidebar = layoutMode === 'fixed';
  const showHeader = layoutMode !== 'fullscreen';

  return (
    <div className="flex h-screen bg-[var(--color-bg-page)]">
      {showSidebar && <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />}

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {showHeader && <Header />}
        <RouteTabs showBack={layoutMode !== 'fixed'} />

        <main className={cn('flex-1 min-h-0 overflow-y-auto', layoutMode !== 'fullscreen' && 'p-4')}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <FloatingAiAssistant />
    </div>
  );
}
