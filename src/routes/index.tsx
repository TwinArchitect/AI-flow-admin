import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { DashboardPage } from '@/features/dashboard';
import { WorkflowsPage } from '@/features/workflows';
import { AgentsPage } from '@/features/agents';
import { UsersPage } from '@/features/users';
import { SettingsPage } from '@/features/settings';
import { LoginPage } from '@/features/auth';
import { PrivateRoute } from './PrivateRoute';
import { ComponentsLayout } from '@/features/components';
import { Skeleton } from '@/components/ui/skeleton';
import { AgentPlazaPage } from '@/features/agents/AgentPlaza';
import { AgentOverviewPage } from '@/features/agents/overview';
import { MyAgentsPage } from '@/features/agents/myAgents';
import { KnowledgeBasePage } from '@/features/agents/knowledgeBase';

// Demo 页懒加载，减少首屏 bundle 体积
const ButtonDemo = lazy(() => import('@/features/components/demos/ButtonDemo').then(m => ({ default: m.ButtonDemo })));
const CardDemo = lazy(() => import('@/features/components/demos/CardDemo').then(m => ({ default: m.CardDemo })));
const DialogDemo = lazy(() => import('@/features/components/demos/DialogDemo').then(m => ({ default: m.DialogDemo })));
const FormDemo = lazy(() => import('@/features/components/demos/FormDemo').then(m => ({ default: m.FormDemo })));
const InputDemo = lazy(() => import('@/features/components/demos/InputDemo').then(m => ({ default: m.InputDemo })));
const SelectDemo = lazy(() => import('@/features/components/demos/SelectDemo').then(m => ({ default: m.SelectDemo })));
const TableDemo = lazy(() => import('@/features/components/demos/TableDemo').then(m => ({ default: m.TableDemo })));
const TabsDemo = lazy(() => import('@/features/components/demos/TabsDemo').then(m => ({ default: m.TabsDemo })));
const AccordionDemo = lazy(() => import('@/features/components/demos/AccordionDemo').then(m => ({ default: m.AccordionDemo })));
const AlertDemo = lazy(() => import('@/features/components/demos/AlertDemo').then(m => ({ default: m.AlertDemo })));
const BadgeDemo = lazy(() => import('@/features/components/demos/BadgeDemo').then(m => ({ default: m.BadgeDemo })));
const AvatarDemo = lazy(() => import('@/features/components/demos/AvatarDemo').then(m => ({ default: m.AvatarDemo })));
const ToastDemo = lazy(() => import('@/features/components/demos/ToastDemo').then(m => ({ default: m.ToastDemo })));
const CheckboxDemo = lazy(() => import('@/features/components/demos/CheckboxDemo').then(m => ({ default: m.CheckboxDemo })));
const SwitchDemo = lazy(() => import('@/features/components/demos/SwitchDemo').then(m => ({ default: m.SwitchDemo })));
const RadioGroupDemo = lazy(() => import('@/features/components/demos/RadioGroupDemo').then(m => ({ default: m.RadioGroupDemo })));
const TextareaDemo = lazy(() => import('@/features/components/demos/TextareaDemo').then(m => ({ default: m.TextareaDemo })));
const ProgressDemo = lazy(() => import('@/features/components/demos/ProgressDemo').then(m => ({ default: m.ProgressDemo })));
const SkeletonDemo = lazy(() => import('@/features/components/demos/SkeletonDemo').then(m => ({ default: m.SkeletonDemo })));
const SliderDemo = lazy(() => import('@/features/components/demos/SliderDemo').then(m => ({ default: m.SliderDemo })));
const DropdownMenuDemo = lazy(() => import('@/features/components/demos/DropdownMenuDemo').then(m => ({ default: m.DropdownMenuDemo })));
const PopoverDemo = lazy(() => import('@/features/components/demos/PopoverDemo').then(m => ({ default: m.PopoverDemo })));
const TooltipDemo = lazy(() => import('@/features/components/demos/TooltipDemo').then(m => ({ default: m.TooltipDemo })));
const SheetDemo = lazy(() => import('@/features/components/demos/SheetDemo').then(m => ({ default: m.SheetDemo })));
const SeparatorDemo = lazy(() => import('@/features/components/demos/SeparatorDemo').then(m => ({ default: m.SeparatorDemo })));
const CalendarDemo = lazy(() => import('@/features/components/demos/CalendarDemo').then(m => ({ default: m.CalendarDemo })));
const CommandDemo = lazy(() => import('@/features/components/demos/CommandDemo').then(m => ({ default: m.CommandDemo })));
const DatePickerDemo = lazy(() => import('@/features/components/demos/DatePickerDemo').then(m => ({ default: m.DatePickerDemo })));
const MultiSelectDemo = lazy(() => import('@/features/components/demos/MultiSelectDemo').then(m => ({ default: m.MultiSelectDemo })));
const TimePickerDemo = lazy(() => import('@/features/components/demos/TimePickerDemo').then(m => ({ default: m.TimePickerDemo })));
const ReactQueryDemo = lazy(() => import('@/features/components/demos/ReactQueryDemo').then(m => ({ default: m.ReactQueryDemo })));

function DemoFallback() {
  return <div className="space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
}

export const router = createBrowserRouter([
  // 登录页（公开）
  {
    path: '/login',
    element: <LoginPage />,
  },
  // 需要登录的业务页（PrivateRoute 守卫）
  {
    path: '/',
    element: <PrivateRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'agents', element: <AgentsPage /> },
          { path: 'agents/AgentPlaza', element: <AgentPlazaPage /> },
          { path: 'agents/overview', element: <AgentOverviewPage /> },
          { path: 'agents/myAgents', element: <MyAgentsPage /> },
          { path: 'agents/knowledge', element: <KnowledgeBasePage /> },
          { path: 'workflows', element: <WorkflowsPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'settings', element: <SettingsPage /> },
          {
            path: 'components',
            element: <ComponentsLayout />,
            children: [
              { index: true, element: <Navigate to="button" replace /> },
              { path: 'button', element: <Suspense fallback={<DemoFallback />}><ButtonDemo /></Suspense> },
              { path: 'card', element: <Suspense fallback={<DemoFallback />}><CardDemo /></Suspense> },
              { path: 'dialog', element: <Suspense fallback={<DemoFallback />}><DialogDemo /></Suspense> },
              { path: 'form', element: <Suspense fallback={<DemoFallback />}><FormDemo /></Suspense> },
              { path: 'input', element: <Suspense fallback={<DemoFallback />}><InputDemo /></Suspense> },
              { path: 'select', element: <Suspense fallback={<DemoFallback />}><SelectDemo /></Suspense> },
              { path: 'table', element: <Suspense fallback={<DemoFallback />}><TableDemo /></Suspense> },
              { path: 'tabs', element: <Suspense fallback={<DemoFallback />}><TabsDemo /></Suspense> },
              { path: 'accordion', element: <Suspense fallback={<DemoFallback />}><AccordionDemo /></Suspense> },
              { path: 'alert', element: <Suspense fallback={<DemoFallback />}><AlertDemo /></Suspense> },
              { path: 'badge', element: <Suspense fallback={<DemoFallback />}><BadgeDemo /></Suspense> },
              { path: 'avatar', element: <Suspense fallback={<DemoFallback />}><AvatarDemo /></Suspense> },
              { path: 'toast', element: <Suspense fallback={<DemoFallback />}><ToastDemo /></Suspense> },
              { path: 'checkbox', element: <Suspense fallback={<DemoFallback />}><CheckboxDemo /></Suspense> },
              { path: 'switch', element: <Suspense fallback={<DemoFallback />}><SwitchDemo /></Suspense> },
              { path: 'radio-group', element: <Suspense fallback={<DemoFallback />}><RadioGroupDemo /></Suspense> },
              { path: 'textarea', element: <Suspense fallback={<DemoFallback />}><TextareaDemo /></Suspense> },
              { path: 'progress', element: <Suspense fallback={<DemoFallback />}><ProgressDemo /></Suspense> },
              { path: 'skeleton', element: <Suspense fallback={<DemoFallback />}><SkeletonDemo /></Suspense> },
              { path: 'slider', element: <Suspense fallback={<DemoFallback />}><SliderDemo /></Suspense> },
              { path: 'dropdown-menu', element: <Suspense fallback={<DemoFallback />}><DropdownMenuDemo /></Suspense> },
              { path: 'popover', element: <Suspense fallback={<DemoFallback />}><PopoverDemo /></Suspense> },
              { path: 'tooltip', element: <Suspense fallback={<DemoFallback />}><TooltipDemo /></Suspense> },
              { path: 'sheet', element: <Suspense fallback={<DemoFallback />}><SheetDemo /></Suspense> },
              { path: 'separator', element: <Suspense fallback={<DemoFallback />}><SeparatorDemo /></Suspense> },
              { path: 'calendar', element: <Suspense fallback={<DemoFallback />}><CalendarDemo /></Suspense> },
              { path: 'command', element: <Suspense fallback={<DemoFallback />}><CommandDemo /></Suspense> },
              { path: 'date-picker', element: <Suspense fallback={<DemoFallback />}><DatePickerDemo /></Suspense> },
              { path: 'multi-select', element: <Suspense fallback={<DemoFallback />}><MultiSelectDemo /></Suspense> },
              { path: 'time-picker', element: <Suspense fallback={<DemoFallback />}><TimePickerDemo /></Suspense> },
              { path: 'react-query', element: <Suspense fallback={<DemoFallback />}><ReactQueryDemo /></Suspense> },
            ],
          },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);
