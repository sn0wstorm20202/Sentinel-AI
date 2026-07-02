'use client';

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useLayoutStore } from "@/store/layout-store";
import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { CopilotPanel } from "@/components/features/copilot/chat-panel";
import { copilotPanelVariants } from "@/lib/motion/config";
import { useReducedMotion } from "framer-motion";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useSSE } from "@/lib/api/hooks/use-sse";
import { CommandPalette } from "@/components/layout/command-palette";
import { EnterpriseKeyboardShortcuts } from "@/components/layout/enterprise-keyboard-shortcuts";
import { ShortcutReference } from "@/components/layout/shortcut-reference";
import { NotificationCenter } from "@/components/layout/notification-center";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const sidebarCollapsed = useLayoutStore((state) => state.sidebarCollapsed);
  const activePanel      = useLayoutStore((state) => state.activePanel);
  const pathname         = usePathname();
  const shouldReduce     = useReducedMotion();

  useSSE();

  const panelVariants = shouldReduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
    : copilotPanelVariants;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <EnterpriseKeyboardShortcuts />
      <Sidebar collapsed={sidebarCollapsed} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-hidden">
        {/* @ts-expect-error autoSaveId is used by react-resizable-panels 4.x */}
        <ResizablePanelGroup orientation="horizontal" autoSaveId="sentinel-global-panels">
          <ResizablePanel defaultSize={100} minSize={30}>
              {/*
               * AnimatePresence with key=pathname drives the page-to-page
               * transition. mode="wait" ensures the exit animation completes
               * before the next page enters — prevents content overlap.
               */}
              <AnimatePresence mode="wait" initial={false}>
                <div
                  key={pathname}
                  className="h-full overflow-auto bg-background"
                >
                  {children}
                </div>
              </AnimatePresence>
            </ResizablePanel>

            {/* Copilot panel — spring slide from right */}
            <AnimatePresence>
              {activePanel && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                    <motion.div
                      key="copilot-panel"
                      className="h-full border-l bg-background"
                      variants={panelVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      style={{ willChange: 'opacity, transform' }}
                    >
                      {activePanel === 'copilot' ? (
                        <ErrorBoundary name="Copilot">
                          <CopilotPanel />
                        </ErrorBoundary>
                      ) : (
                        <div className="p-4">Details Panel Placeholder</div>
                      )}
                    </motion.div>
                  </ResizablePanel>
                </>
              )}
            </AnimatePresence>
          </ResizablePanelGroup>
        </main>
      </div>
      <CommandPalette />
      <ShortcutReference />
      <NotificationCenter />
    </div>
  );
}
