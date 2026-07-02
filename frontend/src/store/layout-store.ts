import { create } from 'zustand';

interface LayoutState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  activePanel: 'copilot' | 'details' | null;
  setActivePanel: (panel: 'copilot' | 'details' | null) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel }),
}));
