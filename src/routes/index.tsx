import { SystemConfigPage } from '@/features/system-config/SystemConfigPage';
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { DashboardPage } from '@/features/dashboard';
import { WorkflowsPage } from '@/features/workflows';
import { UsersPage } from '@/features/users';
import { MenuManagementPage } from '@/features/permissions/MenuManagementPage';
import { RoleManagementPage } from '@/features/roles/RoleManagementPage';
import { DepartmentManagementPage } from '@/features/departments/DepartmentManagementPage';
import { PostManagementPage } from '@/features/posts/PostManagementPage';
import { DictManagementPage } from '@/features/dict/DictManagementPage';
import { OrganizationTreePage } from '@/features/organization-tree/OrganizationTreePage';
import { MessageManagementPage } from '@/features/messages/MessageManagementPage';
import { AttachmentManagementPage } from '@/features/attachments/AttachmentManagementPage';
import { TenantManagementPage } from '@/features/tenants/TenantManagementPage';
import { SettingsPage } from '@/features/settings';
import { LoginPage } from '@/features/auth';
import { PrivateRoute } from './PrivateRoute';
import { ComponentsLayout } from '@/features/components';
import { Skeleton } from '@/components/ui/skeleton';
import { AgentOverviewPage } from '@/features/agents/overview';
import { MyAgentsPage } from '@/features/agents/myAgents';
import { KbEngineSettingsPage, KnowledgeBasePage } from '@/features/agents/knowledgeBase';
import { KbOpenApiDocPage } from '@/features/agents/knowledgeBase/KbOpenApiDocPage';
import { HttpToolsPage, McpToolsPage } from '@/features/agents/tools';
import { TagManagementPage } from '@/features/agents/tag-management';
import { AgentPlazaPage, AgentChatPage } from '@/features/agents/agent-plaza';
import { ModelManagementPage } from '@/features/agents/model-management';
import { MemoryMaintenancePage } from '@/features/agents/memory-maintenance';
import { RouteAccess, RouteStatusPage } from './RouteAccess';
import { EmbedAssistantPage } from '@/features/agents/overview/EmbedAssistantPage';
import { ChatAgentOrchestrationPage } from '@/features/agents/orchestration';
import { AgentAuditPage } from '@/features/agents/audit/AgentAuditPage';


// Demo 页懒加载，减少首屏 bundle 体积
const ButtonDemo = lazy(() =>
  import('@/features/components/demos/ButtonDemo').then((m) => ({ default: m.ButtonDemo }))
);
const CardDemo = lazy(() =>
  import('@/features/components/demos/CardDemo').then((m) => ({ default: m.CardDemo }))
);
const DialogDemo = lazy(() =>
  import('@/features/components/demos/DialogDemo').then((m) => ({ default: m.DialogDemo }))
);
const FormDemo = lazy(() =>
  import('@/features/components/demos/FormDemo').then((m) => ({ default: m.FormDemo }))
);
const InputDemo = lazy(() =>
  import('@/features/components/demos/InputDemo').then((m) => ({ default: m.InputDemo }))
);
const SelectDemo = lazy(() =>
  import('@/features/components/demos/SelectDemo').then((m) => ({ default: m.SelectDemo }))
);
const TableDemo = lazy(() =>
  import('@/features/components/demos/TableDemo').then((m) => ({ default: m.TableDemo }))
);
const TabsDemo = lazy(() =>
  import('@/features/components/demos/TabsDemo').then((m) => ({ default: m.TabsDemo }))
);
const AccordionDemo = lazy(() =>
  import('@/features/components/demos/AccordionDemo').then((m) => ({ default: m.AccordionDemo }))
);
const AlertDemo = lazy(() =>
  import('@/features/components/demos/AlertDemo').then((m) => ({ default: m.AlertDemo }))
);
const BadgeDemo = lazy(() =>
  import('@/features/components/demos/BadgeDemo').then((m) => ({ default: m.BadgeDemo }))
);
const AvatarDemo = lazy(() =>
  import('@/features/components/demos/AvatarDemo').then((m) => ({ default: m.AvatarDemo }))
);
const ToastDemo = lazy(() =>
  import('@/features/components/demos/ToastDemo').then((m) => ({ default: m.ToastDemo }))
);
const CheckboxDemo = lazy(() =>
  import('@/features/components/demos/CheckboxDemo').then((m) => ({ default: m.CheckboxDemo }))
);
const SwitchDemo = lazy(() =>
  import('@/features/components/demos/SwitchDemo').then((m) => ({ default: m.SwitchDemo }))
);
const RadioGroupDemo = lazy(() =>
  import('@/features/components/demos/RadioGroupDemo').then((m) => ({ default: m.RadioGroupDemo }))
);
const TextareaDemo = lazy(() =>
  import('@/features/components/demos/TextareaDemo').then((m) => ({ default: m.TextareaDemo }))
);
const ProgressDemo = lazy(() =>
  import('@/features/components/demos/ProgressDemo').then((m) => ({ default: m.ProgressDemo }))
);
const SkeletonDemo = lazy(() =>
  import('@/features/components/demos/SkeletonDemo').then((m) => ({ default: m.SkeletonDemo }))
);
const SliderDemo = lazy(() =>
  import('@/features/components/demos/SliderDemo').then((m) => ({ default: m.SliderDemo }))
);
const DropdownMenuDemo = lazy(() =>
  import('@/features/components/demos/DropdownMenuDemo').then((m) => ({
    default: m.DropdownMenuDemo,
  }))
);
const PopoverDemo = lazy(() =>
  import('@/features/components/demos/PopoverDemo').then((m) => ({ default: m.PopoverDemo }))
);
const TooltipDemo = lazy(() =>
  import('@/features/components/demos/TooltipDemo').then((m) => ({ default: m.TooltipDemo }))
);
const SheetDemo = lazy(() =>
  import('@/features/components/demos/SheetDemo').then((m) => ({ default: m.SheetDemo }))
);
const SeparatorDemo = lazy(() =>
  import('@/features/components/demos/SeparatorDemo').then((m) => ({ default: m.SeparatorDemo }))
);
const CalendarDemo = lazy(() =>
  import('@/features/components/demos/CalendarDemo').then((m) => ({ default: m.CalendarDemo }))
);
const CommandDemo = lazy(() =>
  import('@/features/components/demos/CommandDemo').then((m) => ({ default: m.CommandDemo }))
);
const DatePickerDemo = lazy(() =>
  import('@/features/components/demos/DatePickerDemo').then((m) => ({ default: m.DatePickerDemo }))
);
const MultiSelectDemo = lazy(() =>
  import('@/features/components/demos/MultiSelectDemo').then((m) => ({
    default: m.MultiSelectDemo,
  }))
);
const TimePickerDemo = lazy(() =>
  import('@/features/components/demos/TimePickerDemo').then((m) => ({ default: m.TimePickerDemo }))
);
const PaginationDemo = lazy(() => import('@/features/components/demos/PaginationDemo').then(m => ({ default: m.PaginationDemo })));
const ReactQueryDemo = lazy(() =>
  import('@/features/components/demos/ReactQueryDemo').then((m) => ({ default: m.ReactQueryDemo }))
);

function DemoFallback() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export const router = createBrowserRouter([
  { path: '/embed/assistant', element: <EmbedAssistantPage /> },
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
        children: [{ element: <RouteAccess />, children: [
          { index: true, element: <DashboardPage /> },
          { path: 'agents', element: <Navigate to="myAgents" replace /> },
          { path: 'agents/AgentPlaza', element: <AgentPlazaPage /> },
          { path: 'agents/audit', element: <AgentAuditPage />, handle: { contentScroll: 'internal' } },
          {
            path: 'agents/overview',
            element: <AgentOverviewPage />,
          },
          { path: 'agents/myAgents', element: <MyAgentsPage />, handle: { contentPadding: false } },
          { path: 'agents/orchestration', element: <ChatAgentOrchestrationPage />, handle: { contentLayout: 'fullscreen' } },
          { path: 'agents/knowledge', element: <KnowledgeBasePage />, handle: { contentPadding: false, contentScroll: 'internal' } },
          { path: 'agents/knowledge/settings', element: <KbEngineSettingsPage /> },
          { path: 'agents/knowledge/api-doc', element: <KbOpenApiDocPage /> },
          { path: 'agents/tags', element: <TagManagementPage />, handle: { contentPadding: false, contentScroll: 'internal' } },
          { path: 'agents/AgentPlaza/chat', element: <AgentChatPage /> },
          { path: 'agents/models', element: <ModelManagementPage />, handle: { contentPadding: false } },
          { path: 'agents/memory', element: <MemoryMaintenancePage />, handle: { contentScroll: 'internal' } },
          { path: 'agents/httpTools', element: <HttpToolsPage />, handle: { contentPadding: false } },
          { path: 'agents/mcpTools', element: <McpToolsPage />, handle: { contentPadding: false } },

          {
            path: 'workflows',
            element: <WorkflowsPage />,
            handle: { contentLayout: 'fullscreen' },
          },
          { path: 'system/user', element: <UsersPage />, handle: { contentPadding: false, contentScroll: 'internal' } },
          { path: 'system/menu', element: <MenuManagementPage />, handle: { contentPadding: false, contentScroll: 'internal' } },
          { path: 'system/role', element: <RoleManagementPage />, handle: { contentPadding: false, contentScroll: 'internal' } },
          { path: 'system/dept', element: <DepartmentManagementPage />, handle: { contentPadding: false, contentScroll: 'internal' } },
          { path: 'system/post', element: <PostManagementPage />, handle: { contentPadding: false, contentScroll: 'internal' } },
          { path: 'system/dict', element: <DictManagementPage />, handle: { contentPadding: false, contentScroll: 'internal' } },
          { path: 'system/tree', element: <OrganizationTreePage />, handle: { contentPadding: false, contentScroll: 'internal' } },
          { path: 'system/message', element: <MessageManagementPage />, handle: { contentPadding: false, contentScroll: 'internal' } },
          { path: 'system/file', element: <AttachmentManagementPage />, handle: { contentPadding: false, contentScroll: 'internal' } },
          { path: 'system/config', element: <SystemConfigPage /> },
          { path: 'system/tenant', element: <TenantManagementPage />, handle: { contentPadding: false, contentScroll: 'internal' } },
          { path: 'users', element: <Navigate to="/system/user" replace /> },
          { path: 'settings', element: <SettingsPage /> },
          ...(import.meta.env.DEV ? [{
            path: 'components',
            element: <ComponentsLayout />,
            children: [
              { index: true, element: <Navigate to="button" replace /> },
              { path: 'pagination', element: <Suspense fallback={<DemoFallback />}><PaginationDemo /></Suspense> },
              {
                path: 'button',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <ButtonDemo />
                  </Suspense>
                ),
              },
              {
                path: 'card',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <CardDemo />
                  </Suspense>
                ),
              },
              {
                path: 'dialog',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <DialogDemo />
                  </Suspense>
                ),
              },
              {
                path: 'form',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <FormDemo />
                  </Suspense>
                ),
              },
              {
                path: 'input',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <InputDemo />
                  </Suspense>
                ),
              },
              {
                path: 'select',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <SelectDemo />
                  </Suspense>
                ),
              },
              {
                path: 'table',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <TableDemo />
                  </Suspense>
                ),
              },
              {
                path: 'tabs',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <TabsDemo />
                  </Suspense>
                ),
              },
              {
                path: 'accordion',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <AccordionDemo />
                  </Suspense>
                ),
              },
              {
                path: 'alert',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <AlertDemo />
                  </Suspense>
                ),
              },
              {
                path: 'badge',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <BadgeDemo />
                  </Suspense>
                ),
              },
              {
                path: 'avatar',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <AvatarDemo />
                  </Suspense>
                ),
              },
              {
                path: 'toast',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <ToastDemo />
                  </Suspense>
                ),
              },
              {
                path: 'checkbox',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <CheckboxDemo />
                  </Suspense>
                ),
              },
              {
                path: 'switch',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <SwitchDemo />
                  </Suspense>
                ),
              },
              {
                path: 'radio-group',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <RadioGroupDemo />
                  </Suspense>
                ),
              },
              {
                path: 'textarea',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <TextareaDemo />
                  </Suspense>
                ),
              },
              {
                path: 'progress',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <ProgressDemo />
                  </Suspense>
                ),
              },
              {
                path: 'skeleton',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <SkeletonDemo />
                  </Suspense>
                ),
              },
              {
                path: 'slider',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <SliderDemo />
                  </Suspense>
                ),
              },
              {
                path: 'dropdown-menu',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <DropdownMenuDemo />
                  </Suspense>
                ),
              },
              {
                path: 'popover',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <PopoverDemo />
                  </Suspense>
                ),
              },
              {
                path: 'tooltip',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <TooltipDemo />
                  </Suspense>
                ),
              },
              {
                path: 'sheet',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <SheetDemo />
                  </Suspense>
                ),
              },
              {
                path: 'separator',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <SeparatorDemo />
                  </Suspense>
                ),
              },
              {
                path: 'calendar',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <CalendarDemo />
                  </Suspense>
                ),
              },
              {
                path: 'command',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <CommandDemo />
                  </Suspense>
                ),
              },
              {
                path: 'date-picker',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <DatePickerDemo />
                  </Suspense>
                ),
              },
              {
                path: 'multi-select',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <MultiSelectDemo />
                  </Suspense>
                ),
              },
              {
                path: 'time-picker',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <TimePickerDemo />
                  </Suspense>
                ),
              },
              {
                path: 'react-query',
                element: (
                  <Suspense fallback={<DemoFallback />}>
                    <ReactQueryDemo />
                  </Suspense>
                ),
              },
            ],
          }] : []),
          { path: '403', element: <RouteStatusPage status="forbidden" /> },
          { path: '404', element: <RouteStatusPage status="not-found" /> },
          { path: '*', element: <RouteStatusPage status="not-found" />, handle: { unimplemented: true } },
        ] }],
      },
    ],
  },
]);
