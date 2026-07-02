'use client';

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { CasesTable } from '@/components/features/investigation/cases-table';
import { CopilotPanel } from '@/components/features/copilot/chat-panel';

export default function CasesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
        {/* Queue Panel */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="border-r flex flex-col">
          <div className="px-3 py-2 border-b bg-muted/30 font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between shrink-0">
            <span>Investigation Queue</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <CasesTable />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Detail Panel */}
        <ResizablePanel defaultSize={55} className="flex flex-col bg-muted/10 relative">
          {children}
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Copilot Panel */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="border-l flex flex-col bg-background">
          <CopilotPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
