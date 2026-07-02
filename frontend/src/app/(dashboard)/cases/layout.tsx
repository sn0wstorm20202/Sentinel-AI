'use client';

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { CasesTable } from '@/components/features/investigation/cases-table';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { WorkspaceTabs } from '@/components/features/investigation/workspace-tabs';

export default function CasesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-48px)] w-full flex-col overflow-hidden">
      {/* @ts-expect-error autoSaveId is used by react-resizable-panels 4.x */}
      <ResizablePanelGroup orientation="horizontal" className="h-full w-full" autoSaveId="sentinel-cases-layout">
        {/* Queue Panel */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="border-r flex flex-col">
          <div className="px-3 py-2 border-b bg-muted/30 font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between shrink-0">
            <span>Investigation Queue</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <ErrorBoundary name="Queue">
              <CasesTable />
            </ErrorBoundary>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Detail Panel */}
        <ResizablePanel defaultSize={70} className="flex flex-col bg-muted/10 relative">
          <WorkspaceTabs />
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
