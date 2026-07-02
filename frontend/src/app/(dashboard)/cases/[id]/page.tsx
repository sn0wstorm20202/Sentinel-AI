'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCaseExplain, useCaseGraph } from '@/lib/api/hooks/use-cases';
import { NetworkGraph } from '@/components/graph/network-graph';
import { HypothesisPanel } from '@/components/features/investigation/hypothesis-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Bookmark, Clock3, ListChecks, Network, Pin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EvidenceBoard } from '@/components/features/investigation/evidence-board';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { InvestigationTimeline } from '@/components/features/investigation/investigation-timeline';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInvestigationStore } from '@/store/investigation-store';
import { InvestigationTab } from '@/types';
import { cn } from '@/lib/utils';

function CaseDetailSkeleton() {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden p-4 gap-4">
      <div className="flex items-center gap-4 border-b pb-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex flex-1 overflow-hidden gap-4">
        <div className="w-[35%] flex flex-col gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="flex-1 flex flex-col gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}

export default function CaseDetailsPage() {
  const params = useParams();
  const caseId = params?.id as string;

  const { data: caseData, isLoading: caseLoading, error: caseError } = useCaseExplain(caseId);
  const { data: graphData, isLoading: graphLoading } = useCaseGraph(caseId);
  const activeInvestigationTab = useInvestigationStore((state) => state.activeInvestigationTab);
  const setActiveInvestigationTab = useInvestigationStore((state) => state.setActiveInvestigationTab);
  const openInvestigationTab = useInvestigationStore((state) => state.openInvestigationTab);
  const togglePinnedInvestigation = useInvestigationStore((state) => state.togglePinnedInvestigation);
  const toggleBookmark = useInvestigationStore((state) => state.toggleBookmark);
  const pinnedInvestigations = useInvestigationStore((state) => state.pinnedInvestigations);
  const bookmarks = useInvestigationStore((state) => state.bookmarks);
  const addTimelineEvent = useInvestigationStore((state) => state.addTimelineEvent);

  useEffect(() => {
    if (!caseId) return;
    openInvestigationTab(caseId);
    addTimelineEvent({
      id: `${caseId}-analyst-opened-${Date.now()}`,
      caseId,
      type: 'analyst_opened',
      title: 'Analyst Opened Case',
      timestamp: new Date().toISOString(),
      actor: { name: 'Current Analyst', type: 'analyst' },
      details: `Case ${caseId} was opened in the Sentinel investigator workspace.`,
    });
  }, [addTimelineEvent, caseId, openInvestigationTab]);

  if (caseLoading || graphLoading) {
    return <CaseDetailSkeleton />;
  }

  if (caseError || !caseData || !graphData) {
    return (
      <div className="flex h-full w-full items-center justify-center text-destructive flex-col gap-4">
        <AlertCircle className="h-10 w-10" />
        <p>Error loading case details for ID: {caseId}</p>
      </div>
    );
  }

  const isPinned = pinnedInvestigations.includes(caseData.metadata.case_id);
  const isBookmarked = bookmarks.includes(caseData.metadata.case_id);

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-background">
      {/* Dense Header */}
      <div className="px-4 py-2 border-b flex items-center justify-between shrink-0 bg-muted/10">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold font-mono tracking-tight">{caseData.metadata.case_id}</h1>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            TX: {caseData.metadata.transaction_id}
          </span>
          <Badge
            variant={caseData.risk_assessment.risk_tier === 'Critical' ? 'destructive' : 'secondary'}
            size="sm"
            className="uppercase"
          >
            {caseData.risk_assessment.risk_tier} · {caseData.risk_assessment.risk_score.toFixed(1)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(caseData.metadata.generated_at).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => togglePinnedInvestigation(caseData.metadata.case_id)}
            aria-label={isPinned ? 'Unpin investigation' : 'Pin investigation'}
            className={cn(isPinned && 'text-primary')}
          >
            <Pin className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => toggleBookmark(caseData.metadata.case_id)}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark investigation'}
            className={cn(isBookmarked && 'text-primary')}
          >
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail Content */}
      {/* @ts-expect-error autoSaveId is used by react-resizable-panels 4.x */}
      <ResizablePanelGroup orientation="horizontal" autoSaveId={`sentinel-case-${caseId}-panels`} className="flex-1 overflow-hidden">
        {/* Left Side: Hypothesis */}
        <ResizablePanel defaultSize={30} minSize={22} maxSize={45} className="border-r bg-muted/5 flex flex-col h-full shrink-0">
          <HypothesisPanel caseData={caseData} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Side: Graph & Evidence */}
        <ResizablePanel defaultSize={70} className="flex flex-col h-full overflow-hidden relative">
          <Tabs
            value={activeInvestigationTab}
            onValueChange={(value) => setActiveInvestigationTab(value as InvestigationTab)}
            className="flex flex-col h-full w-full"
          >
            <div className="px-3 py-1.5 border-b bg-muted/10 shrink-0">
              <TabsList className="h-7 text-xs">
                <TabsTrigger value="graph" className="h-6 gap-1.5 text-xs px-2"><Network className="h-3 w-3" /> Graph</TabsTrigger>
                <TabsTrigger value="evidence" className="h-6 gap-1.5 text-xs px-2"><ListChecks className="h-3 w-3" /> Evidence</TabsTrigger>
                <TabsTrigger value="timeline" className="h-6 gap-1.5 text-xs px-2"><Clock3 className="h-3 w-3" /> Timeline</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="graph" className="flex-1 p-0 m-0 overflow-hidden data-[state=active]:flex">
              <ErrorBoundary name="Graph">
                <NetworkGraph data={graphData} />
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="evidence" className="flex-1 p-0 m-0 overflow-auto bg-card" data-sentinel-evidence tabIndex={-1}>
              <ErrorBoundary name="Evidence">
                <EvidenceBoard caseData={caseData} />
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="timeline" className="flex-1 p-0 m-0 overflow-hidden bg-card">
              <ErrorBoundary name="Timeline">
                <InvestigationTimeline caseData={caseData} graphData={graphData} />
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
