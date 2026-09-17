import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RouteTab {
  path: string;
  title: string;
}

interface LayoutState {
  routeTabs: RouteTab[];
  activeTabPath: string;
  sidebarCollapsed: boolean;
  openRouteTab: (tab: RouteTab) => void;
  closeRouteTab: (path: string) => void;
  closeAllRouteTabs: () => void;
  closeRouteTabsLeft: (path: string) => void;
  closeRouteTabsRight: (path: string) => void;
  updateRouteTabTitle: (path: string, title: string) => void;
  setActiveTabPath: (path: string) => void;
  toggleSidebar: () => void;
  resetLayout: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      routeTabs: [{ path: '/', title: '工作台' }],
      activeTabPath: '/',
      sidebarCollapsed: false,
      openRouteTab: (tab) => set((state) => {
        const dashboard = { path: '/', title: '工作台' };
        const otherTabs = state.routeTabs.filter((item) => item.path !== '/');
        const nextTabs = tab.path === '/'
          ? otherTabs
          : otherTabs.some((item) => item.path === tab.path)
            ? otherTabs.map((item) => item.path === tab.path ? { ...item, title: tab.title } : item)
            : [...otherTabs, tab];
        return { routeTabs: [dashboard, ...nextTabs], activeTabPath: tab.path };
      }),
      closeRouteTab: (path) => set((state) => ({
        routeTabs: path === '/' ? state.routeTabs : state.routeTabs.filter((item) => item.path !== path),
        activeTabPath: state.activeTabPath === path ? '' : state.activeTabPath,
      })),
      closeAllRouteTabs: () => set({
        routeTabs: [{ path: '/', title: '工作台' }],
        activeTabPath: '/',
      }),
      closeRouteTabsLeft: (path) => set((state) => {
        const index = state.routeTabs.findIndex((item) => item.path === path);
        if (index < 0) return state;
        return { routeTabs: state.routeTabs.filter((item, itemIndex) => item.path === '/' || itemIndex >= index) };
      }),
      closeRouteTabsRight: (path) => set((state) => {
        const index = state.routeTabs.findIndex((item) => item.path === path);
        if (index < 0) return state;
        return { routeTabs: state.routeTabs.filter((item, itemIndex) => item.path === '/' || itemIndex <= index) };
      }),
      updateRouteTabTitle: (path, title) => set((state) => ({
        routeTabs: state.routeTabs.map((item) => item.path === path ? { ...item, title } : item),
      })),
      setActiveTabPath: (path) => set({ activeTabPath: path }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      resetLayout: () => set({
        routeTabs: [{ path: '/', title: '工作台' }],
        activeTabPath: '/',
        sidebarCollapsed: false,
      }),
    }),
    { name: 'app-layout-storage' },
  ),
);
