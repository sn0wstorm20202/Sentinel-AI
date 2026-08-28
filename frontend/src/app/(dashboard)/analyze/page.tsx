'use client';

/**
 * THE LIVE ANALYZER.
 *
 * This page did not exist. Nothing in the frontend had ever issued
 * `POST /api/v1/cases/explain` — every screen read a precomputed artifact, which
 * meant the product's central claim ("it shows its work") could only ever be
 * demonstrated on cases someone else had already run. You could read a verdict.
 * You could not watch one being reached.
 *
 * Three numbered steps: pick a payload, send it, read what came back. The
 * numbering is load-bearing rather than decorative — you genuinely cannot do 02
 * before 01, and 03 does not exist until 02 returns.
 *
 * ── The one honesty problem on this page, and how it is handled ─────────────
 *
 * The API is atomic. It accepts a payload and returns a finished case; it does
 * not stream, and it does not report how long each of the six stages took. A
 * progress animation that ticked through "scoring… attributing… hypothesising…"
 * would be theatre — the interface would be inventing observations it never made.
 *
 * So: the only duration shown anywhere is the round-trip wall time measured in
 * this browser, and the staged reveal after the response lands is labelled as a
 * replay of one response in execution order. Both statements are visible on the
 * page, not buried here.
 */

import * as React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Check,
  FlaskConical,
  Loader2,
  RotateCcw,
  Send,
} from 'lucide-react';

import { useExplainTransaction, type ExplainResult } from '@/lib/api/hooks/use-cases';
import {
  STAGE_IDS,
  computeAlignment,
  deriveStages,
  loadChampionSchema,
  type ChampionSchema,
  type StageId,
} from '@/lib/pipeline';
import { formatProbability, formatScore, riskMeta } from '@/lib/risk';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RiskBadge, Stamp } from '@/components/ui/risk';
import { DecisionTrail } from '@/components/features/trail/decision-trail';
import { PayloadPanel } from '@/components/features/case/payload-panel';
import { AlignmentPanel } from '@/components/features/case/alignment-panel';
import { ScorePanel } from '@/components/features/case/score-panel';
import { EvidencePanel } from '@/components/features/case/evidence-panel';
import { HypothesisPanel } from '@/components/features/case/hypothesis-panel';
import { ActionPanel } from '@/components/features/case/action-panel';

/* -------------------------------------------------------------------------- */

interface Preset {
  id: 'legit' | 'fraud';
  file: string;
  title: string;
  /**
   * What the payload *is*. Never what the model will say about it.
   *
   * Both files were inspected before this copy was written: 3,574 keys each,
   * differing in 1,455 of them, with per-feature shifts that are mostly small
   * (F13: 0.54 vs 0.59). Describing either as "obviously fraudulent" would be a
   * claim about the model's output dressed up as a claim about the input.
   */
  body: string;
}

const PRESETS: Preset[] = [
  {
    id: 'legit',
    file: '/presets/legit.json',
    title: 'Baseline payload',
    body: 'Feature values sitting where the model saw them most often during training.',
  },
  {
    id: 'fraud',
    file: '/presets/fraud.json',
    title: 'Divergent payload',
    body: 'The same columns, shifted. Whether that shift is enough to flag anything is the model’s call, not ours.',
  },
];

/** Cadence of the replay, in ms per stage. Skipped entirely for reduced motion. */
const REPLAY_STEP_MS = 620;

/* -------------------------------------------------------------------------- */

export default function AnalyzerPage() {
  const [presetId, setPresetId] = React.useState<Preset['id']>('fraud');
  /**
   * Both payloads, not just the selected one.
   *
   * Loading the pair lets the page state how far apart they are as a measured
   * number instead of an adjective, and makes switching between them instant.
   */
  const [payloads, setPayloads] = React.useState<Record<
    Preset['id'],
    Record<string, unknown>
  > | null>(null);
  const [payloadError, setPayloadError] = React.useState<string | null>(null);
  const [schema, setSchema] = React.useState<ChampionSchema | null>(null);
  const [result, setResult] = React.useState<ExplainResult | null>(null);
  const [stage, setStage] = React.useState<StageId>('ingest');

  /** How far the replay has advanced. `null` once it has finished. */
  const [replayIndex, setReplayIndex] = React.useState<number | null>(null);
  const [elapsed, setElapsed] = React.useState(0);

  const explain = useExplainTransaction();
  const payload = payloads?.[presetId] ?? null;

  /* -- Load the model's own column list once. ----------------------------- */
  React.useEffect(() => {
    let cancelled = false;
    loadChampionSchema()
      .then((s) => !cancelled && setSchema(s))
      .catch(() => {
        /* The alignment readout degrades to "not reported"; nothing else breaks. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* -- Load both payloads once. ------------------------------------------- */
  React.useEffect(() => {
    let cancelled = false;
    Promise.all(
      PRESETS.map(async (p) => {
        const r = await fetch(p.file);
        if (!r.ok) throw new Error(`${p.file} — ${r.status} ${r.statusText}`);
        return [p.id, (await r.json()) as Record<string, unknown>] as const;
      }),
    )
      .then((pairs) => {
        if (cancelled) return;
        setPayloads(Object.fromEntries(pairs) as Record<Preset['id'], Record<string, unknown>>);
      })
      .catch((e: Error) => !cancelled && setPayloadError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  /* -- Live elapsed counter while the request is in flight. --------------- */
  React.useEffect(() => {
    if (!explain.isPending) return;
    const started = performance.now();
    setElapsed(0);
    const id = window.setInterval(() => setElapsed(performance.now() - started), 100);
    return () => window.clearInterval(id);
  }, [explain.isPending]);

  /* -- The replay. --------------------------------------------------------
   * Reveals the six stages in execution order once the response has landed.
   * `prefers-reduced-motion` skips straight to the finished trail; a media
   * query is read directly rather than via useReducedMotion() because this is
   * a timer, not a transition, and must not run at all.
   */
  const startReplay = React.useCallback(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setReplayIndex(null);
      setStage('ingest');
      return;
    }
    setReplayIndex(0);
    setStage(STAGE_IDS[0]);
  }, []);

  React.useEffect(() => {
    if (replayIndex === null) return;
    if (replayIndex >= STAGE_IDS.length - 1) {
      const done = window.setTimeout(() => setReplayIndex(null), REPLAY_STEP_MS);
      return () => window.clearTimeout(done);
    }
    const id = window.setTimeout(() => {
      const nextIndex = replayIndex + 1;
      setReplayIndex(nextIndex);
      setStage(STAGE_IDS[nextIndex]);
    }, REPLAY_STEP_MS);
    return () => window.clearTimeout(id);
  }, [replayIndex]);

  /* -- Derived ------------------------------------------------------------ */

  const alignment = React.useMemo(
    () => (payload && schema ? computeAlignment(payload, schema) : undefined),
    [payload, schema],
  );

  /**
   * How many columns actually differ between the two payloads.
   *
   * Measured here rather than written into the copy, so the sentence under the
   * picker can never drift from the files it describes.
   */
  const divergence = React.useMemo(() => {
    if (!payloads) return null;
    const keys = new Set([...Object.keys(payloads.legit), ...Object.keys(payloads.fraud)]);
    let differing = 0;
    keys.forEach((k) => {
      if (payloads.legit[k] !== payloads.fraud[k]) differing += 1;
    });
    return { differing, total: keys.size };
  }, [payloads]);

  const runs = React.useMemo(
    () =>
      deriveStages(result?.case, {
        submittedCount: payload ? Object.keys(payload).length : undefined,
        alignment,
        upTo: replayIndex === null ? undefined : STAGE_IDS[replayIndex],
      }),
    [result, payload, alignment, replayIndex],
  );

  const submit = () => {
    if (!payload) return;
    const stamp = new Date();
    const suffix = stamp.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    setResult(null);
    setReplayIndex(null);
    setStage('ingest');
    explain.mutate(
      {
        request_id: `REQ-UI-${suffix}`,
        case_id: `LIVE-${suffix}`,
        transaction_id: `TXN-${suffix}`,
        timestamp: stamp.toISOString(),
        features: payload,
      },
      {
        onSuccess: (data) => {
          setResult(data);
          startReplay();
        },
      },
    );
  };

  const reset = () => {
    setResult(null);
    setReplayIndex(null);
    setStage('ingest');
    explain.reset();
  };

  const fieldCount = payload ? Object.keys(payload).length : null;
  const meta = result ? riskMeta(result.case.risk_assessment.risk_tier) : null;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-20 sm:px-6">
      {/* ================= INTRO ======================================== */}
      <header className="max-w-[64ch] pt-12 pb-10 lg:pt-16">
        <Stamp className="text-muted-foreground">Live analyzer</Stamp>
        <h1 className="font-display text-foreground mt-4 text-3xl leading-[1.06] font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          Run the engine yourself.
        </h1>
        <p className="text-muted-foreground mt-5 text-base leading-relaxed">
          Every other screen in this dashboard reads a decision the engine made earlier. This one
          makes a new decision while you watch: the payload below is sent to the deployed model, and
          what comes back is whatever it says — not a stored answer.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12" data-tour="analyzer">
        {/* ================= STEPS 01 + 02 ============================== */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          {/* ---- 01 ---------------------------------------------------- */}
          <Step n="01" title="Choose what to send" active={!result}>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Two payloads are prepared, both covering the model&apos;s entire column list. Pick one.
            </p>

            <div
              role="radiogroup"
              aria-label="Payload to send"
              className="mt-3.5 grid gap-2"
            >
              {PRESETS.map((p) => {
                const checked = p.id === presetId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => {
                      setPresetId(p.id);
                      reset();
                    }}
                    className={cn(
                      'focus-visible:ring-ring/50 rounded-lg border px-3.5 py-3 text-left transition-colors focus-visible:ring-3 focus-visible:outline-none',
                      checked
                        ? 'border-foreground/35 bg-inset'
                        : 'border-border hover:border-foreground/20',
                    )}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-foreground text-sm font-medium">{p.title}</span>
                      {checked && <Check className="text-foreground mt-0.5 size-3.5 shrink-0" aria-hidden />}
                    </span>
                    <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                      {p.body}
                    </span>
                  </button>
                );
              })}
            </div>

            <dl className="border-border mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-3">
              <MiniFact
                label="Fields in payload"
                value={payloadError ? 'failed' : fieldCount?.toLocaleString() ?? null}
              />
              <MiniFact
                label="Model expects"
                value={schema ? schema.n_features.toLocaleString() : null}
              />
            </dl>
            {divergence && (
              <p className="text-muted-foreground mt-2.5 text-xs leading-relaxed">
                The two payloads differ in {divergence.differing.toLocaleString()} of{' '}
                {divergence.total.toLocaleString()} columns. Most of those differences are small —
                the point is not that one looks alarming to a human, but that the model separates
                them.
              </p>
            )}
            {payloadError && (
              <p className="text-risk-high mt-2 text-xs leading-relaxed">
                A payload file could not be read ({payloadError}). Reload the page to try again.
              </p>
            )}
          </Step>

          {/* ---- 02 ---------------------------------------------------- */}
          <Step n="02" title="Send it to the model" active={!result && !explain.isPending}>
            <p className="text-muted-foreground text-sm leading-relaxed">
              One POST to{' '}
              <code className="text-foreground font-mono text-[11px]">
                /api/v1/cases/explain
              </code>
              . The orchestrator aligns the payload, scores it, and — only if the tier warrants it —
              reasons about the result before replying.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                onClick={submit}
                disabled={!payload || explain.isPending}
                size="lg"
                data-tour="analyzer-submit"
              >
                {explain.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Scoring…
                  </>
                ) : (
                  <>
                    <Send className="size-4" aria-hidden />
                    {result ? 'Run it again' : 'Score this transaction'}
                  </>
                )}
              </Button>
              {result && (
                <Button variant="ghost" size="lg" onClick={reset}>
                  <RotateCcw className="size-4" aria-hidden />
                  Clear
                </Button>
              )}
            </div>

            {/* In flight: real elapsed time, and an honest statement of why
                there is nothing more granular to show. */}
            {explain.isPending && (
              <div className="border-border bg-inset/60 mt-3.5 rounded-lg border px-3.5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <Stamp>Waiting on the API</Stamp>
                  <span className="numeral text-foreground text-lg leading-none font-semibold">
                    {(elapsed / 1000).toFixed(1)}s
                  </span>
                </div>
                <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                  There is no progress bar here because the endpoint does not stream. It returns one
                  finished case, so the only thing genuinely measurable from the browser is how long
                  the whole round trip takes. A cold backend can add several seconds.
                </p>
              </div>
            )}

            {explain.isError && (
              <div className="border-risk-high/40 bg-risk-high/5 mt-3.5 rounded-lg border px-3.5 py-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-risk-high mt-0.5 size-4 shrink-0" aria-hidden />
                  <div className="space-y-1.5">
                    <p className="text-foreground text-sm font-medium">The request did not succeed</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {describeError(explain.error)}
                    </p>
                    <button
                      type="button"
                      onClick={submit}
                      className="stamp text-foreground hover:text-muted-foreground focus-visible:ring-ring/50 rounded focus-visible:ring-3 focus-visible:outline-none"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Step>

          {/* ---- 03 ---------------------------------------------------- */}
          <Step n="03" title="Read what came back" active={Boolean(result)} last>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {result
                ? 'The verdict is on the right, with the engine’s own six stages underneath it. Step through them with the arrow keys.'
                : 'Once the model answers, its verdict and all six stages of its reasoning appear on the right.'}
            </p>
          </Step>
        </div>

        {/* ================= THE RESULT ================================= */}
        <div className="min-w-0">
          {!result && !explain.isPending && (
            <EmptyStage
              schemaCount={schema?.n_features}
              onRun={submit}
              disabled={!payload}
            />
          )}

          {explain.isPending && <PendingStage elapsed={elapsed} />}

          {result && meta && (
            <div className="space-y-6" data-tour="analyzer-result">
              {/* ---- The verdict ------------------------------------- */}
              {/*
                Container query, not a viewport query. This card sits in the
                right-hand column of a two-column page, so at ~1120px the
                viewport says "wide" while the column is only ~400px. Breaking
                on the viewport put the directive — the loudest line on the
                screen — into four fragments. `@container` makes the card
                answer to its own box instead.
              */}
              <section
                className={cn(
                  'animate-step-in @container overflow-hidden rounded-xl border',
                  meta.border,
                  meta.bg,
                )}
              >
                <div className="grid gap-6 p-5 @xl:grid-cols-[minmax(0,1fr)_auto] @xl:items-center @xl:p-6">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <RiskBadge tier={result.case.risk_assessment.risk_tier} size="sm" />
                      <span className="text-muted-foreground font-mono text-[11px]">
                        {result.case.metadata.case_id}
                      </span>
                    </div>
                    <p className="font-display text-foreground max-w-[28ch] text-2xl leading-[1.12] font-semibold tracking-tight @xl:text-3xl">
                      {meta.directive}
                    </p>
                    <p className="text-muted-foreground max-w-[58ch] text-sm leading-relaxed">
                      {meta.meaning}
                    </p>
                  </div>

                  <dl className="border-border flex gap-6 border-t pt-4 @xl:border-t-0 @xl:border-l @xl:pt-0 @xl:pl-6">
                    <div className="space-y-1">
                      <dt className="stamp">Score</dt>
                      <dd
                        className={cn(
                          'numeral text-3xl leading-none font-semibold',
                          meta.text,
                        )}
                      >
                        {formatScore(result.case.risk_assessment.risk_score)}
                      </dd>
                      <dd className="text-muted-foreground text-[11px]">of 100</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="stamp">Probability</dt>
                      <dd className="numeral text-foreground text-3xl leading-none font-semibold">
                        {formatProbability(result.case.risk_assessment.probability)}
                      </dd>
                      <dd className="text-muted-foreground text-[11px]">calibrated</dd>
                    </div>
                  </dl>
                </div>
              </section>

              {/* ---- What you are about to look at ------------------- */}
              <div className="border-border bg-card rounded-xl border px-4 py-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
                  <Stamp className="text-foreground">
                    {replayIndex === null ? 'Replayed in execution order' : 'Replaying…'}
                  </Stamp>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {(result.elapsedMs / 1000).toFixed(2)}s round trip, measured in this browser
                  </span>
                </div>
                <p className="text-muted-foreground mt-2 max-w-[86ch] text-xs leading-relaxed">
                  The API answered with one complete case, not a stream, so the reveal below is that
                  single response played back in the order{' '}
                  <code className="font-mono">SentinelOrchestrator</code> ran its stages. The{' '}
                  {(result.elapsedMs / 1000).toFixed(2)}s above is the whole round trip including the
                  network — per-stage durations are not instrumented, so none are shown.
                </p>
              </div>

              {/* ---- The trail --------------------------------------- */}
              <DecisionTrail
                runs={runs}
                selected={stage}
                onSelectedChange={(id) => {
                  setReplayIndex(null); // taking manual control ends the replay
                  setStage(id);
                }}
                accent={meta.cssVar}
                elapsedMs={result.elapsedMs}
                content={buildContent(result, payload, alignment)}
              />

              <p className="text-muted-foreground text-xs leading-relaxed">
                This run was not saved. The queue lists cases from the backend&apos;s own stored
                artifact, so a live result will not appear there —{' '}
                <Link
                  href="/cases"
                  className="text-foreground hover:text-muted-foreground underline underline-offset-2"
                >
                  open the queue
                </Link>{' '}
                to read decisions that were.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stage content, wired to real values.                                       */
/* -------------------------------------------------------------------------- */

function buildContent(
  result: ExplainResult,
  payload: Record<string, unknown> | null,
  alignment: ReturnType<typeof computeAlignment> | undefined,
) {
  const c = result.case;
  const meta = riskMeta(c.risk_assessment.risk_tier);
  const shortCircuited = !meta.reasons;
  const evidence = c.intelligence.evidence ?? [];
  const hypotheses = c.intelligence.hypotheses ?? c.intelligence.fraud_hypotheses ?? [];
  const recommendations =
    c.action_engine.recommendations ?? c.action_engine.recommended_actions ?? [];

  return {
    ingest: (
      <PayloadPanel
        payload={payload}
        caseId={c.metadata.case_id}
        transactionId={c.metadata.transaction_id}
        generatedAt={c.metadata.generated_at}
      />
    ),
    align: <AlignmentPanel alignment={alignment} />,
    score: (
      <ScorePanel
        tier={c.risk_assessment.risk_tier}
        score={c.risk_assessment.risk_score}
        probability={c.risk_assessment.probability}
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
        summary={c.intelligence.natural_language_summary}
        tier={c.risk_assessment.risk_tier}
        typologyCount={hypotheses.length}
        skipped={shortCircuited}
      />
    ),
  };
}

function describeError(error: unknown): string {
  const e = error as
    | { response?: { status?: number; data?: { detail?: string } }; code?: string; message?: string }
    | undefined;
  const status = e?.response?.status;
  const detail = e?.response?.data?.detail;

  if (status === 400) {
    return `The engine rejected the payload: ${detail ?? 'none of its columns matched the trained schema'}. That is the 400 the Align stage describes.`;
  }
  if (status === 422) {
    return 'The request envelope was malformed. The endpoint expects request_id, case_id, transaction_id, timestamp and a features object.';
  }
  if (status === 500) {
    return `The backend failed while scoring: ${detail ?? 'no detail was returned'}.`;
  }
  if (e?.code === 'ECONNABORTED') {
    return 'The request timed out after two minutes. The backend is likely asleep — try once more, since the first request wakes it.';
  }
  return e?.message ?? 'No response was received from the backend.';
}

/* -------------------------------------------------------------------------- */
/* Small parts.                                                               */
/* -------------------------------------------------------------------------- */

function Step({
  n,
  title,
  active,
  last,
  children,
}: {
  n: string;
  title: string;
  active?: boolean;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'relative pl-11',
        !last && 'border-border ml-[1.0625rem] border-l pb-8 pl-[1.4375rem]',
      )}
    >
      {/* The ordinal sits on the rule, so the three steps read as one thread. */}
      <span
        className={cn(
          'bg-background absolute top-0 left-0 flex h-[2.125rem] w-[2.125rem] items-center justify-center rounded-full border font-display text-[13px] font-semibold tabular-nums transition-colors',
          !last && '-ml-[1.0625rem]',
          active
            ? 'border-foreground/40 text-foreground'
            : 'border-border text-muted-foreground-subtle',
        )}
        aria-hidden
      >
        {n}
      </span>
      <h2 className="font-display text-foreground pt-1.5 text-base leading-tight font-semibold tracking-tight">
        <span className="sr-only">Step {n}: </span>
        {title}
      </h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function MiniFact({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <dt className="stamp">{label}</dt>
      <dd>
        {value === null ? (
          <Skeleton className="h-5 w-16" />
        ) : (
          <span className="numeral text-foreground text-lg leading-none font-semibold">
            {value}
          </span>
        )}
      </dd>
    </div>
  );
}

function EmptyStage({
  schemaCount,
  onRun,
  disabled,
}: {
  schemaCount?: number;
  onRun: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="border-border grid-field grid min-h-[26rem] place-items-center rounded-xl border border-dashed px-6 py-12">
      <div className="max-w-[46ch] space-y-3 text-center">
        <FlaskConical className="text-muted-foreground/50 mx-auto size-6" aria-hidden />
        <h2 className="font-display text-foreground text-lg font-semibold tracking-tight">
          Nothing has been scored yet
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Send the payload
          {typeof schemaCount === 'number'
            ? ` — all ${schemaCount.toLocaleString()} columns of it — `
            : ' '}
          to the deployed model and its verdict, plus every stage of reasoning behind that
          verdict, appears in this space.
        </p>
        <Button onClick={onRun} disabled={disabled} variant="outline" size="sm" className="mt-1">
          Score this transaction
          <ArrowRight className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function PendingStage({ elapsed }: { elapsed: number }) {
  return (
    <div className="border-border bg-card grid min-h-[26rem] place-items-center rounded-xl border px-6 py-12">
      <div className="max-w-[44ch] space-y-3 text-center">
        <Loader2 className="text-muted-foreground mx-auto size-6 animate-spin" aria-hidden />
        <h2 className="font-display text-foreground text-lg font-semibold tracking-tight">
          The model is scoring it
        </h2>
        <p className="numeral text-foreground text-3xl leading-none font-semibold">
          {(elapsed / 1000).toFixed(1)}s
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Aligning the payload, running the calibrated model, and — if the score crosses the review
          threshold — computing SHAP attributions and matching typologies. All of it happens before
          the single response comes back.
        </p>
      </div>
    </div>
  );
}
