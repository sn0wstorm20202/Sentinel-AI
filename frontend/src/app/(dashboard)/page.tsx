'use client';

/**
 * THE COMMAND CENTER.
 *
 * What this replaces: `redirect("/cases")`. There was no front page at all — the
 * first thing a new reader saw was a table of case IDs, with nothing to explain
 * that a model had run, what the tiers meant, or why some cases carry reasoning
 * and others do not.
 *
 * The job of this page is one sentence: *a fraud score is worthless unless you
 * can see how it was reached.* Everything on it either states that claim or
 * proves it. The six-step walkthrough is the page's spine and gets the boldest
 * typography in the product, because understanding the sequence is the thing
 * that makes every other screen legible.
 *
 * Every number here is read from a live endpoint or from a config file quoted by
 * path. Where a value is not available, the page says so.
 */

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, FlaskConical, Inbox, Radio, ShieldCheck } from 'lucide-react';

import { useCases } from '@/lib/api/hooks/use-cases';
import { useMLOpsMetrics } from '@/lib/api/hooks/use-mlops';
import {
  STAGE_LIST,
  OPERATING_THRESHOLD,
  COST_FALSE_NEGATIVE,
  COST_FALSE_POSITIVE,
} from '@/lib/pipeline';
import { RISK_TIERS, normalizeTier, riskMeta, tierSeverity, type RiskTier } from '@/lib/risk';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Stamp } from '@/components/ui/risk';

export default function CommandCenterPage() {
  const { data: cases, isLoading: casesLoading, error: casesError } = useCases();
  const { data: mlops } = useMLOpsMetrics();

  const all = cases ?? [];

  const counts = React.useMemo(() => {
    const c: Record<RiskTier, number> = { Approve: 0, Elevated: 0, High: 0, Critical: 0 };
    for (const item of all) c[normalizeTier(item.risk)] += 1;
    return c;
  }, [all]);

  const needsReview = counts.High + counts.Critical;

  /** The most severe real case, so "read a finished one" links somewhere useful. */
  const worstCase = React.useMemo(() => {
    if (all.length === 0) return null;
    return [...all].sort(
      (a, b) => tierSeverity(b.risk) - tierSeverity(a.risk) || b.score - a.score,
    )[0];
  }, [all]);

  const costRatio = Math.round(COST_FALSE_NEGATIVE / COST_FALSE_POSITIVE);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-20 sm:px-6">
      {/* ================= THE CLAIM ==================================== */}
      <section className="grid gap-10 pt-12 pb-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16 lg:pt-16">
        <div>
          <Stamp className="text-muted-foreground">Fraud intelligence · Sentinel AI</Stamp>
          <h1 className="font-display text-foreground mt-4 max-w-[22ch] text-4xl leading-[1.04] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            A score is not an answer.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-[58ch] text-base leading-relaxed">
            Most fraud systems return a number and expect you to trust it. Sentinel returns the
            number <em className="text-foreground not-italic">and the reasoning that produced it</em>{' '}
            — which features moved the score, which known fraud patterns the evidence matches, what
            an analyst should do about it, and where the engine deliberately stopped looking.
          </p>
          <p className="text-muted-foreground mt-3 max-w-[58ch] text-sm leading-relaxed">
            Six stages run in a fixed order. You can watch them run, or open any decision the engine
            has already made and walk back through them.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/analyze" className={buttonVariants({ size: 'lg' })}>
              <FlaskConical className="size-4" aria-hidden />
              Score a transaction now
            </Link>
            <Link href="/cases" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              <Inbox className="size-4" aria-hidden />
              Open the queue
              {needsReview > 0 && (
                <span className="text-risk-critical numeral font-semibold">{needsReview}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Instrument rail — four real readouts, each citing its source. */}
        <div className="border-border bg-card grid-field self-start rounded-xl border">
          <div className="border-border flex items-center justify-between border-b px-4 py-2.5">
            <h2 className="stamp text-foreground">Live state</h2>
            {casesError ? (
              <span className="stamp text-muted-foreground">backend unreachable</span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-1.5 font-mono text-[11px]">
                <Radio className="animate-sentinel-pulse size-3" aria-hidden />
                connected
              </span>
            )}
          </div>

          <dl className="divide-border divide-y">
            <Readout
              label="Transactions scored"
              value={casesLoading ? null : all.length.toLocaleString()}
              note="GET /api/v1/cases"
            />
            <Readout
              label="Awaiting a human"
              value={casesLoading ? null : String(needsReview)}
              tone={needsReview > 0 ? 'text-risk-critical' : undefined}
              note={
                casesLoading
                  ? undefined
                  : `${counts.Critical} Critical · ${counts.High} High · ${counts.Approve + counts.Elevated} settled automatically`
              }
            />
            <Readout
              label="Operating threshold"
              value={`${(OPERATING_THRESHOLD * 100).toFixed(2)}%`}
              note={`Chosen from cost, not convenience: a missed fraud is ${costRatio}× more expensive than a false alarm. configs/threshold_policy.json`}
            />
            <Readout
              label="Champion model"
              value={mlops?.champion_model ?? null}
              small
              note="models/champion_model_calibrated.pkl"
            />
          </dl>

          {/* Tier distribution — proportional, so it cannot flatter itself. */}
          {!casesLoading && all.length > 0 && (
            <div className="border-border border-t px-4 py-3.5">
              <div
                className="bg-muted flex h-1.5 w-full overflow-hidden rounded-full"
                role="img"
                aria-label={RISK_TIERS.map((t) => `${counts[t]} ${t}`).join(', ')}
              >
                {RISK_TIERS.map((t) =>
                  counts[t] > 0 ? (
                    <div
                      key={t}
                      className={riskMeta(t).fill}
                      style={{ width: `${(counts[t] / all.length) * 100}%` }}
                    />
                  ) : null,
                )}
              </div>
              <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">
                Colour in this dashboard only ever means risk. Nothing else is tinted.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================= THE SEQUENCE ================================= */}
      <section aria-labelledby="how" className="border-border border-t pt-12">
        <div className="max-w-[62ch]">
          <Stamp className="text-muted-foreground">The path a transaction takes</Stamp>
          <h2
            id="how"
            className="font-display text-foreground mt-3 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl"
          >
            How one decision gets made, start to finish.
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            These are not UI sections. Each one is a real component of the backend, invoked in this
            order by <code className="text-foreground font-mono text-xs">SentinelOrchestrator</code>.
            Read down the list and you have read the system.
          </p>
        </div>

        <ol className="mt-10 space-y-0">
          {STAGE_LIST.map((stage, i) => (
            <li
              key={stage.id}
              className="animate-step-in border-border grid gap-x-6 gap-y-2 border-t py-7 sm:grid-cols-[4.5rem_minmax(0,1fr)] lg:grid-cols-[4.5rem_minmax(0,26ch)_minmax(0,1fr)]"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              {/*
                The ordinal. The content genuinely is a sequence, so it counts.
                It was dimmed to 45% alpha, which measured 2.27:1 — you had to
                hunt for the number that exists to make the sequence scannable.
                A numbered list whose numbers are invisible is just a list.
              */}
              <div className="flex items-start gap-3 sm:block">
                <span className="numeral text-muted-foreground-subtle text-3xl leading-none font-semibold sm:text-4xl">
                  {stage.n}
                </span>
              </div>

              <div>
                <h3 className="font-display text-foreground text-lg leading-snug font-semibold tracking-tight">
                  {stage.headline}
                </h3>
                <p className="text-muted-foreground mt-1.5 font-mono text-[11px] leading-relaxed break-words">
                  {stage.engine}
                </p>
              </div>

              <div className="space-y-2.5">
                <p className="text-muted-foreground max-w-[76ch] text-sm leading-relaxed">
                  {stage.what}
                </p>
                <p className="text-foreground/80 flex items-start gap-1.5 text-sm leading-relaxed">
                  <ArrowRight className="text-muted-foreground-subtle mt-1 size-3.5 shrink-0" aria-hidden />
                  <span>{stage.next}</span>
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* The branch. The single most important thing to understand about the
            engine, and the easiest to mistake for a bug. */}
        <div className="border-border bg-inset/60 mt-8 rounded-xl border p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
            <div className="space-y-2">
              <h3 className="stamp text-foreground">One branch worth knowing about</h3>
              <p className="text-muted-foreground max-w-[80ch] text-sm leading-relaxed">
                Stages 04–06 do not always run. If stage 03 lands on{' '}
                <span className="text-risk-approve">Approve</span> or{' '}
                <span className="text-risk-elevated">Elevated</span>, the engine stops there on
                purpose — SHAP attribution is expensive and no analyst will ever open a case at those
                tiers. Only <span className="text-risk-high">High</span> and{' '}
                <span className="text-risk-critical">Critical</span> get the full reasoning chain.
              </p>
              <p className="text-muted-foreground max-w-[80ch] text-sm leading-relaxed">
                When a case shows those stages as <em className="not-italic">skipped</em>, that is the
                truth, not a gap. Reporting them as &ldquo;completed with no findings&rdquo; would
                claim the engine looked and found nothing, when it never looked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHERE TO GO ================================== */}
      <section aria-labelledby="next" className="border-border mt-14 border-t pt-10">
        <h2 id="next" className="stamp text-muted-foreground">
          Three ways in
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Route
            href="/analyze"
            n="A"
            title="Watch it run"
            body="Submit a transaction and follow all six stages as they execute against the live model. Two prepared payloads are included — one that clears, one that does not."
            cta="Open the analyzer"
          />
          <Route
            href={worstCase ? `/cases/${worstCase.id}` : '/cases'}
            n="B"
            title="Read a finished decision"
            body={
              worstCase
                ? `${worstCase.id} scored ${worstCase.score.toFixed(1)} and came back ${normalizeTier(worstCase.risk)}. Every stage, the ranked evidence and the recommended action are on one page.`
                : 'Open a scored case and walk back through the six stages that produced its verdict.'
            }
            cta={worstCase ? `Open ${worstCase.id}` : 'Open the queue'}
          />
          <Route
            href="/mlops"
            n="C"
            title="Inspect the model"
            body="The bake-off that chose the champion, its test-set metrics, and the drift monitors currently watching it — including what they are presently reporting."
            cta="Open model operations"
          />
        </div>
      </section>

      {/* ================= WHAT THIS BUILD IS =========================== */}
      <section className="border-border text-muted-foreground mt-12 border-t pt-6 text-[13px] leading-relaxed">
        <p className="max-w-[86ch]">
          <span className="stamp text-foreground mr-2">Scope of this build</span>
          Scores, SHAP attributions, evidence and recommendations are produced by the real trained
          artifacts in <code className="font-mono text-xs">models/</code>. The entity graph, the
          model bake-off and the drift reports are read from committed Phase 6–9 artifacts rather
          than recomputed per request. Authentication is a deliberate no-op and CORS is open, so this
          is a demonstration deployment, not a hardened one — that is stated here rather than left
          for someone to discover.
        </p>
      </section>
    </div>
  );
}

function Readout({
  label,
  value,
  note,
  tone,
  small,
}: {
  label: string;
  value: string | null;
  note?: string;
  tone?: string;
  small?: boolean;
}) {
  return (
    <div className="px-4 py-3.5">
      <dt className="stamp text-muted-foreground">{label}</dt>
      <dd className="mt-1.5">
        {value === null ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <span
            className={cn(
              'numeral font-semibold',
              small ? 'text-base' : 'text-2xl leading-none',
              tone ?? 'text-foreground',
            )}
          >
            {value}
          </span>
        )}
        {note && (
          <p className="text-muted-foreground-subtle mt-1.5 max-w-[44ch] font-mono text-[10px] leading-relaxed">
            {note}
          </p>
        )}
      </dd>
    </div>
  );
}

function Route({
  href,
  n,
  title,
  body,
  cta,
}: {
  href: string;
  n: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="border-border bg-card hover:border-foreground/25 focus-visible:ring-ring/50 group flex flex-col rounded-xl border p-5 transition-colors focus-visible:ring-3 focus-visible:outline-none"
    >
      <span className="stamp text-muted-foreground-subtle">{n}</span>
      <h3 className="font-display text-foreground mt-2.5 text-base font-semibold tracking-tight">
        {title}
      </h3>
      <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">{body}</p>
      <span className="text-foreground mt-4 flex items-center gap-1.5 text-sm font-medium">
        {cta}
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}
