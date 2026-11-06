import { createContext, useContext, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const ScrollMode = createContext<'page' | 'table'>('page');
/** 表格模式配合路由 contentScroll: 'internal'，仅表格内容滚动。 */
export function ListPageLayout({ className, scrollMode = 'page', ...props }: HTMLAttributes<HTMLDivElement> & { scrollMode?: 'page' | 'table' }) {
  return <ScrollMode.Provider value={scrollMode}><div className={cn('flex min-w-0 flex-col bg-background', scrollMode === 'table' ? 'h-full min-h-0 overflow-hidden' : 'min-h-full', className)} {...props} /></ScrollMode.Provider>;
}
export function ListPageHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const internal = useContext(ScrollMode) === 'table';
  return <div className={cn('z-20 shrink-0 space-y-5 bg-background p-4', !internal && 'sticky top-0', className)} {...props} />;
}
export function ListPageContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const internal = useContext(ScrollMode) === 'table';
  return <div className={cn('min-w-0 flex-1 px-4 pb-6', internal && 'flex min-h-0 flex-col overflow-hidden', className)} {...props} />;
}
export function ListPageFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const internal = useContext(ScrollMode) === 'table';
  return <div className={cn('z-20 flex h-20 shrink-0 items-center border-t border-border bg-background px-6 [&>div]:w-full', !internal && 'sticky bottom-0', className)} {...props} />;
}
