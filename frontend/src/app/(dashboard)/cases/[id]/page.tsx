'use client';

/**
 * THE CASE DOSSIER.
 *
 * What this replaces, and why:
 *
 *   • Three tabs labelled "Graph / Evidence / Timeline". Those name the widgets,
 *     not the reasoning. A reader arriving here could not tell that a model had
 *     run, what it decided, or in what order anything happened. The six pipeline
 *     stages are now the navigation, so moving through the page *is* following
 *     the engine's reasoning.
 *
 *   • `if (caseLoading || graphLoading)` and `if (caseError || !caseData ||
 *     !graphData)`. The graph is supplementary context served from a separate
 *     precomputed artifact, but a missing or slow graph blanked the entire page —
 *     including the score and the evidence, which had loaded fine. The two
 *     queries are now gated independently.
 *
 *   • A bare `99.9` in a red pill, with no scale, no threshold and no statement
 *     of what should happen next.
 *
 * The graph and the activity log are kept, below the trail, in a clearly
 * secondary position — and labelled as context that did not feed the decision,
 * because it did not. `HypothesisEngine` never reads the graph.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  Bookmark,
  ChevronRight,
  Network,
  Pin,
  ScrollText,
} from 'lucide-react';

import { useCaseExplain, useCaseGraph } from '@/lib/api/hooks/use-cases';
import { useInvestigationStore } from '@/store/investigation-store';
import { cn } from '@/lib/utils';
import { deriveStages, type StageId } from '@/lib/pipeline';
import { riskMeta, formatScore } from '@/lib/risk';

import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { RiskBadge, Stamp } from '@/components/ui/risk';
import { DecisionTrail } from '@/components/features/trail/decision-trail';
import { PayloadPanel } from '@/components/features/case/payload-panel';
import { AlignmentPanel } from '@/components/features/case/alignment-panel';
import { ScorePanel } from '@/components/features/case/score-panel';
import { EvidencePanel } from '@/components/features/case/evidence-panel';
import { HypothesisPanel } from '@/components/features/case/hypothesis-panel';
import { ActionPanel } from '@/components/features/case/action-panel';
import { NetworkGraph } from '@/components/graph/network-graph';
import { InvestigationTimeline } from '@/components/features/investigation/investigation-timeline';

export default function CaseDossierPage() {
  const params = useParams();
  const caseId = params?.id as string;

  const { data: caseData, isLoading, error } = useCaseExplain(caseId);
  // Independent: the graph is context, and its absence must not hide the case.
  const { data: graphData, isLoading: graphLoading, error: graphError } = useCaseGraph(caseId);

  /*
   * The selected stage lives in the store rather than in this component, because
   * the global shortcut handler has to be able to move it — `E` jumps straight to
   * the attribution stage from anywhere, setting the stage before it navigates.
   * The pointer carries the case it was set for, so one case's stage can never
   * leak into another: the trail always opens at step 01 for a case nobody has
   * aimed a shortcut at.
   */
  const storedStage = useInvestigationStore((s) => s.activeTrailStage);
  const storedStageCaseId = useInvestigationStore((s) => s.activeTrailStageCaseId);
  const setActiveTrailStage = useInvestigationStore((s) => s.setActiveTrailStage);
  const stage: StageId = storedStageCaseId === caseId ? storedStage : 'ingest';
  const setStage = useCallback(
    (next: StageId) => setActiveTrailStage(next, caseId),
    [caseId, setActiveTrailStage],
  );

  const togglePinned = useInvestigationStore((s) => s.togglePinnedInvestigation);
  const toggleBookmark = useInvestigationStore((s) => s.toggleBookmark);
  const pinned = useInvestigationStore((s) => s.pinnedInvestigations);
  const bookmarks = useInvestigationStore((s) => s.bookmarks);
  const openTab = useInvestigationStore((s) => s.openInvestigationTab);
  const addTimelineEvent = useInvestigationStore((s) => s.addTimelineEvent);

  useEffect(() => {
    if (!caseId) return;
    openTab(caseId);
    addTimelineEvent({
      id: `${caseId}-analyst-opened-${Date.now()}`,
      caseId,
      type: 'analyst_opened',
      title: 'Analyst opened the case',
      timestamp: new Date().toISOString(),
      actor: { name: 'Current analyst', type: 'analyst' },
      details: `Case ${caseId} was opened in the Sentinel workspace.`,
    });
  }, [addTimelineEvent, caseId, openTab]);

  const runs = useMemo(() => deriveStages(caseData), [caseData]);

  if (isLoading) return <DossierSkeleton />;

  if (error || !caseData) {
    return (
      <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="text-risk-high size-8" aria-hidden />
        <h1 className="font-display text-foreground text-lg font-semibold">
          This case could not be loaded
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The API did not return a case for <code className="font-mono">{caseId}</code>. It may not
          exist, or the backend may not be running.
        </p>
        <Link href="/cases" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Back to the queue
        </Link>
      </div>
    );
  }

  const { metadata, risk_assessment, intelligence, action_engine } = caseData;
  const meta = riskMeta(risk_assessment.risk_tier);
  const shortCircuited = meta.tier === 'Approve' || meta.tier === 'Elevated';
  const isPinned = pinned.includes(metadata.case_id);
  const isBookmarked = bookmarks.includes(metadata.case_id);

  const evidence = intelligence.evidence ?? [];
  const hypotheses = intelligence.hypotheses ?? intelligence.fraud_hypotheses ?? [];
  const recommendations = action_engine.recommendations ?? action_engine.recommended_actions ?? [];

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 sm:px-6">
      {/* ---- Identity bar ------------------------------------------------ */}
      <header className="border-border bg-background/85 sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href="/cases"
            className="stamp text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded focus-visible:ring-3 focus-visible:outline-none"
          >
            Queue
          </Link>
          <ChevronRight className="text-muted-foreground/40 size-3" aria-hidden />
          <h1 className="text-foreground truncate font-mono text-sm font-medium">
            {metadata.case_id}
          </h1>
          <RiskBadge tier={risk_assessment.risk_tier} size="sm" />
          <span className="text-muted-foreground font-mono text-[11px]">
            tx {metadata.transaction_id}
          </span>
          <span className="text-muted-foreground-subtle hidden text-[11px] sm:inline">
            {new Date(metadata.generated_at).toLocaleString()}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => togglePinned(metadata.case_id)}
            aria-label={isPinned ? 'Unpin this case' : 'Pin this case'}
            aria-pressed={isPinned}
            className={cn(isPinned && 'text-foreground')}
          >
            <Pin className={cn('size-4', isPinned && 'fill-current')} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => toggleBookmark(metadata.case_id)}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this case'}
            aria-pressed={isBookmarked}
            className={cn(isBookmarked && 'text-foreground')}
          >
            <Bookmark className={cn('size-4', isBookmarked && 'fill-current')} />
          </Button>
        </div>
      </header>

      {/* ---- The verdict, before any explanation ------------------------- */}
      <section className="grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <div className="space-y-3">
          <Stamp>The engine&apos;s decision</Stamp>
          <p className="font-display text-foreground max-w-[26ch] text-3xl leading-[1.1] font-semibold tracking-tight sm:text-4xl">
            {meta.directive}
          </p>
          <p className="text-muted-foreground max-w-[62ch] text-sm leading-relaxed">
            {meta.meaning}{' '}
            {shortCircuited
              ? 'Because nothing needs reviewing at this tier, the engine deliberately stopped after scoring — the trail below shows exactly where and why.'
              : 'The six stages below are the engine’s own reasoning, in the order it ran them. Read left to right, or step through with the arrow keys.'}
          </p>
        </div>

        <dl className="border-border grid grid-cols-2 gap-x-4 gap-y-4 self-start border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <Fact
            label="Risk score"
            value={formatScore(risk_assessment.risk_score)}
            suffix="/ 100"
            tone={meta.text}
          />
          <Fact label="Stages run" value={`${runs.filter((r) => r.state === 'done').length}`} suffix={`of ${runs.length}`} />
          <Fact label="Features ranked" value={String(evidence.length)} />
          <Fact label="Actions issued" value={String(recommendations.length)} />
        </dl>
      </section>

      {/* ---- The trail --------------------------------------------------- */}
      <DecisionTrail
        runs={runs}
        selected={stage}
        onSelectedChange={setStage}
        accent={meta.cssVar}
        content={{
          ingest: (
            <PayloadPanel
              caseId={metadata.case_id}
              transactionId={metadata.transaction_id}
              generatedAt={metadata.generated_at}
            />
          ),
          align: <AlignmentPanel />,
          score: (
            <ScorePanel
              tier={risk_assessment.risk_tier}
              score={risk_assessment.risk_score}
              probability={risk_assessment.probability}
            />
          ),
          attribute: <EvidencePanel evidence={evidence} skipped={shortCircuited} />,
          hypothesize: (
            <HypothesisPanel
              hypotheses={hypotheses}
              evidenceFeatureIds={evidence.map((e) => e.feature_id)}
              skipped={shortCircuited}
            />
          ),
          act: (
            <ActionPanel
              recommendations={recommendations}
              summary={intelligence.natural_language_summary}
              tier={risk_assessment.risk_tier}
              typologyCount={hypotheses.length}
              skipped={shortCircuited}
            />
          ),
        }}
      />

      {/* ---- Context that did not feed the decision ---------------------- */}
      <section className="mt-10 space-y-4">
        <div className="space-y-1.5">
          <Stamp className="text-foreground">Supporting context</Stamp>
          <p className="text-muted-foreground max-w-[74ch] text-sm leading-relaxed">
            Everything below is context an analyst may want, but none of it fed the score above. The
            entity graph is built by a separate engine and served from a precomputed artifact; the
            activity log records what has happened to the case since. Keeping them out of the trail
            is deliberate — putting them inside it would imply they influenced the decision.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {/* Entity graph */}
          <div className="border-border bg-card overflow-hidden rounded-xl border">
            <header className="border-border flex items-center justify-between gap-2 border-b px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Network className="text-muted-foreground size-3.5" aria-hidden />
                <h3 className="stamp text-foreground">Entity graph</h3>
              </div>
              <span className="text-muted-foreground font-mono text-[11px]">
                {graphData ? `${graphData.nodes.length} nodes · ${graphData.edges.length} edges` : '—'}
              </span>
            </header>
            <div className="h-[380px]">
              {graphLoading ? (
                <div className="grid h-full place-items-center">
                  <Skeleton className="h-full w-full rounded-none" />
                </div>
              ) : graphError || !graphData ? (
                <div className="grid h-full place-items-center px-6 text-center">
                  <div className="space-y-1.5">
                    <p className="text-foreground text-sm font-medium">
                      No graph is available for this case
                    </p>
                    <p className="text-muted-foreground mx-auto max-w-[46ch] text-sm leading-relaxed">
                      The graph endpoint returned nothing. The score and its reasoning above are
                      unaffected — they never depended on it.
                    </p>
                  </div>
                </div>
              ) : (
                <ErrorBoundary name="Entity graph">
                  <NetworkGraph data={graphData} />
                </ErrorBoundary>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="border-border bg-card overflow-hidden rounded-xl border">
            <header className="border-border flex items-center justify-between gap-2 border-b px-4 py-2.5">
              <div className="flex items-center gap-2">
                <ScrollText className="text-muted-foreground size-3.5" aria-hidden />
                <h3 className="stamp text-foreground">Case activity</h3>
              </div>
              <span className="text-muted-foreground font-mono text-[11px]">
                newest first
              </span>
            </header>
            <div className="h-[380px] overflow-auto">
              <ErrorBoundary name="Case activity">
                <InvestigationTimeline caseData={caseData} graphData={graphData} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Fact({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: string;
}) {
  return (
    <div className="space-y-1">
      <dt className="stamp">{label}</dt>
      <dd className="flex items-baseline gap-1.5">
        <span className={cn('numeral text-2xl leading-none font-semibold', tone ?? 'text-foreground')}>
          {value}
        </span>
        {suffix && <span className="text-muted-foreground text-xs">{suffix}</span>}
      </dd>
    </div>
  );
}

function DossierSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
