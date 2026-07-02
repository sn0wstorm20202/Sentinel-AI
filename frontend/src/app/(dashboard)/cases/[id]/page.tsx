'use client';

import { useParams } from 'next/navigation';
import { useCaseExplain, useCaseGraph } from '@/lib/api/hooks/use-cases';
import { NetworkGraph } from '@/components/graph/network-graph';
import { HypothesisPanel } from '@/components/features/investigation/hypothesis-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Network, ListChecks } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EvidenceBoard } from '@/components/features/investigation/evidence-board';

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

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-background">
      {/* Dense Header */}
      <div className="px-4 py-2 border-b flex items-center justify-between shrink-0 bg-muted/10">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold font-mono tracking-tight">{caseData.metadata.case_id}</h1>
          <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
            TX: {caseData.metadata.transaction_id}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(caseData.metadata.generated_at).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Detail Content */}
      <div className="flex-1 overflow-hidden flex flex-row">
        {/* Left Side: Hypothesis */}
        <div className="w-[30%] border-r bg-muted/5 flex flex-col h-full shrink-0">
          <HypothesisPanel caseData={caseData} />
        </div>

        {/* Right Side: Graph & Evidence */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <Tabs defaultValue="graph" className="flex flex-col h-full w-full">
            <div className="px-3 py-1.5 border-b bg-muted/10 shrink-0">
              <TabsList className="h-7 text-xs">
                <TabsTrigger value="graph" className="h-6 gap-1.5 text-xs px-2"><Network className="h-3 w-3" /> Graph</TabsTrigger>
                <TabsTrigger value="evidence" className="h-6 gap-1.5 text-xs px-2"><ListChecks className="h-3 w-3" /> Evidence</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="graph" className="flex-1 p-0 m-0 overflow-hidden data-[state=active]:flex">
              <NetworkGraph data={graphData} />
            </TabsContent>
            <TabsContent value="evidence" className="flex-1 p-0 m-0 overflow-auto bg-card">
              <EvidenceBoard caseData={caseData} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
