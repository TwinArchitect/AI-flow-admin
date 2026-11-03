import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** 与 MainLayout 页面滚动配合，路由设置 contentPadding: false。 */
export function ListPageLayout({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex min-h-full min-w-0 flex-col bg-background', className)} {...props} />;
}
export function ListPageHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('sticky top-0 z-20 shrink-0 space-y-5 bg-background p-4', className)} {...props} />;
}
export function ListPageContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('min-w-0 flex-1 px-4 pb-6', className)} {...props} />;
}
export function ListPageFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('sticky bottom-0 z-20 flex h-20 shrink-0 items-center border-t border-border bg-background px-6 [&>div]:w-full', className)} {...props} />;
}
