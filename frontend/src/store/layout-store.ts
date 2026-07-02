import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface LayoutState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  activePanel: 'copilot' | 'details' | null;
  setActivePanel: (panel: 'copilot' | 'details' | null) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  shortcutReferenceOpen: boolean;
  setShortcutReferenceOpen: (open: boolean) => void;
  notificationCenterOpen: boolean;
  setNotificationCenterOpen: (open: boolean) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      activePanel: null,
      setActivePanel: (panel) => set({ activePanel: panel }),
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      shortcutReferenceOpen: false,
      setShortcutReferenceOpen: (open) => set({ shortcutReferenceOpen: open }),
      notificationCenterOpen: false,
      setNotificationCenterOpen: (open) => set({ notificationCenterOpen: open }),
    }),
    {
      name: 'sentinel-layout',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activePanel: state.activePanel,
      }),
    }
  )
);
