'use client';

import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useCaseExplain, useCaseGraph } from '@/lib/api/hooks/use-cases';
import { NetworkGraph } from '@/components/graph/network-graph';
import { HypothesisPanel } from '@/components/features/investigation/hypothesis-panel';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Network, ListChecks } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EvidenceBoard } from '@/components/features/investigation/evidence-board';
import { useMotionVariants } from '@/lib/motion/use-motion-variants';

// Animated skeleton that communicates loading state without layout shift
function CaseDetailSkeleton() {
  return (
    <motion.div
      className="flex flex-col h-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header skeleton */}
      <div className="border-b px-6 py-4 space-y-2 bg-card">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Body skeleton */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        {/* Left panel */}
        <div className="w-[30%] flex flex-col gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        {/* Right panel */}
        <div className="flex-1 flex flex-col gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </motion.div>
  );
}

export default function CaseDetailsPage() {
  const params = useParams();
  const caseId = params.id as string;

  const { data: caseData, isLoading: caseLoading, error: caseError } = useCaseExplain(caseId);
  const { data: graphData, isLoading: graphLoading } = useCaseGraph(caseId);
  const { fadeUpItem } = useMotionVariants();

  if (caseLoading || graphLoading) {
    return <CaseDetailSkeleton />;
  }

  if (caseError || !caseData || !graphData) {
    return (
      <motion.div
        className="flex h-full w-full items-center justify-center text-destructive flex-col gap-4"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <AlertCircle className="h-10 w-10" />
        <p>Error loading case details for ID: {caseId}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col h-full overflow-hidden"
      variants={fadeUpItem}
      initial="hidden"
      animate="visible"
    >
      {/* Page header */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Case: {caseData.metadata.case_id}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Transaction ID: {caseData.metadata.transaction_id} • Generated at {new Date(caseData.metadata.generated_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize={30} minSize={25} maxSize={40} className="p-4 bg-muted/10 border-r">
            <HypothesisPanel caseData={caseData} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={70} minSize={40}>
            <Tabs defaultValue="graph" className="h-full w-full flex flex-col">
              <div className="px-4 py-2 border-b bg-background">
                <TabsList>
                  <TabsTrigger value="graph"    className="gap-2"><Network    className="h-4 w-4" /> Graph View</TabsTrigger>
                  <TabsTrigger value="evidence" className="gap-2"><ListChecks className="h-4 w-4" /> Evidence Board</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="graph"    className="flex-1 p-4 m-0 overflow-hidden data-[state=active]:flex">
                <NetworkGraph data={graphData} />
              </TabsContent>
              <TabsContent value="evidence" className="flex-1 p-4 m-0 overflow-auto">
                <EvidenceBoard caseData={caseData} />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </motion.div>
  );
}
