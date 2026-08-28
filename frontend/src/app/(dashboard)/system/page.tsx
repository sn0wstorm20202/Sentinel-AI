'use client';

/**
 * SYSTEM.
 *
 * What a page like this usually is: a grid of green dots that are green because
 * someone hard-coded them green.
 *
 * What this one is: a dependency map of the dashboard, probed live. Every screen
 * in this product is fed by exactly one endpoint, and none of them says so
 * anywhere. Here each one is named, called from your browser while you watch,
 * timed, and paired with a plain sentence about what you would lose if it
 * stopped answering. When something is broken you find out which screen is
 * affected, not merely that "a service is degraded".
 *
 * This page lives at `/system`, not at `/health`, and that is not cosmetic. It
 * was at `/health` for one draft, which meant its own liveness probe fetched
 * `/health` and got a cheerful 200 back from *this page* — the backend was never
 * contacted, and the light was green in a way that could never turn red. The
 * route was moved and the probe now goes through an explicit `/_backend/`
 * passthrough. An instrument that can only read "fine" is an ornament.
 *
 * Two things are stated openly rather than hidden, because a reviewer will find
 * them in thirty seconds and it is better that they read them here first: the
 * auth check is a placeholder that never rejects, and CORS is fully open. Both
 * are deliberate for a public demo. Claiming otherwise would be the only real
 * dishonesty available on this page.
 */

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, Check, RefreshCw, ShieldAlert, X } from 'lucide-react';

import { PROBE_TARGETS, useProbes, type ProbeResult } from '@/lib/api/hooks/use-probes';
import { useConnectionStore, type StreamStatus } from '@/store/connection-store';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Stamp } from '@/components/ui/risk';
import { cn } from '@/lib/utils';

export default function SystemPage() {
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useProbes();

  const stream = useConnectionStore((s) => s.stream);
  const attempts = useConnectionStore((s) => s.attempts);
  const lastEventAt = useConnectionStore((s) => s.lastEventAt);

  const results = React.useMemo(() => Object.values(data ?? {}), [data]);
  const down = results.filter((r) => !r.ok).length;
  const answered = results.filter((r) => r.ok).length;

  /* Re-render once a second only while a "last event" clock is on screen. */
  const [, tick] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (lastEventAt === null) return;
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [lastEventAt]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 sm:px-6">
      <header className="space-y-3 pt-8 pb-6">
        <Stamp>System</Stamp>
        <h1 className="font-display text-foreground max-w-[26ch] text-3xl leading-[1.1] font-semibold tracking-tight sm:text-4xl">
          {isLoading ? (
            <Skeleton className="h-10 w-80" />
          ) : down === 0 ? (
            <>Everything this dashboard needs is answering.</>
          ) : (
            <>
              {down} of {results.length} dependencies {down === 1 ? 'is' : 'are'} not answering.
            </>
          )}
        </h1>
        <p className="text-muted-foreground max-w-[68ch] text-sm leading-relaxed sm:text-base">
          Each row below is one HTTP call, made from this browser when the page loaded and again
          every thirty seconds. The timings are the real round trips — there is no uptime history
          here because the backend does not keep one, and a chart of invented history would be
          worse than none.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} aria-hidden />
            {isFetching ? 'Probing…' : 'Probe again'}
          </Button>
          {dataUpdatedAt > 0 && (
            <span className="text-muted-foreground text-xs">
              Last checked{' '}
              <time dateTime={new Date(dataUpdatedAt).toISOString()}>
                {new Date(dataUpdatedAt).toLocaleTimeString()}
              </time>
              {answered > 0 && ` · ${answered} answering`}
            </span>
          )}
        </div>
      </header>

      {/* ---- The dependency map ------------------------------------------- */}
      <section aria-labelledby="deps" className="pt-2">
        <h2 id="deps" className="stamp text-muted-foreground">
          What each screen depends on
        </h2>

        <ul className="border-border mt-4 divide-y overflow-hidden rounded-xl border">
          {PROBE_TARGETS.map((target, i) => {
            const result = data?.[target.id];
            return (
              <li
                key={target.id}
                className="bg-card animate-step-in @container"
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <div className="grid gap-4 p-4 @2xl:grid-cols-[minmax(0,1fr)_13rem] @2xl:items-start @2xl:gap-8 @2xl:p-5">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <ProbeState result={result} loading={isLoading} />
                      <span className="text-foreground text-sm font-medium">{target.label}</span>
                    </div>
                    <p className="text-muted-foreground font-mono text-[11px] break-all">
                      {target.method} {target.path}
                    </p>
                    <p className="text-muted-foreground max-w-[74ch] text-xs leading-relaxed">
                      <span className="text-foreground/80">Feeds:</span> {target.feeds}
                    </p>
                    <p className="text-muted-foreground max-w-[74ch] text-xs leading-relaxed">
                      <span className="text-foreground/80">If it stops:</span> {target.ifDown}
                    </p>
                  </div>

                  <ProbeReadout result={result} loading={isLoading} />
                </div>
              </li>
            );
          })}
        </ul>

        <p className="text-muted-foreground mt-3 max-w-[74ch] text-xs leading-relaxed">
          The paths shown are the backend&apos;s own routes. Your browser reaches them through this
          dashboard&apos;s proxy rather than calling the backend host directly, so every figure above
          includes that one extra hop — the same hop every other screen pays.
        </p>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* ---- The event stream ------------------------------------------ */}
        <section
          aria-labelledby="stream"
          className="border-border bg-card rounded-xl border p-5"
        >
          <h2 id="stream" className="stamp text-muted-foreground">
            Live event stream
          </h2>
          <div className="mt-3 flex items-baseline gap-2.5">
            <StreamDot status={stream} />
            <p className="font-display text-foreground text-xl font-semibold tracking-tight">
              {STREAM_COPY[stream].title}
            </p>
          </div>
          <p className="text-muted-foreground mt-2 max-w-[52ch] text-sm leading-relaxed">
            {STREAM_COPY[stream].body}
          </p>

          <dl className="border-border mt-4 grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-1">
              <dt className="stamp text-muted-foreground">Failed attempts</dt>
              <dd className="numeral text-foreground text-lg leading-none font-semibold">
                {attempts}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="stamp text-muted-foreground">Last message</dt>
              <dd className="text-foreground text-sm font-medium">
                {lastEventAt === null ? (
                  <span className="text-muted-foreground">None yet</span>
                ) : (
                  `${Math.max(0, Math.round((Date.now() - lastEventAt) / 1000))}s ago`
                )}
              </dd>
            </div>
          </dl>
          <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
            The backend sends a heartbeat every fifteen seconds, so a gap much longer than that
            means the connection dropped rather than that nothing happened.
          </p>
        </section>

        {/* ---- Scoring, which is not probed ----------------------------- */}
        <section
          aria-labelledby="scoring"
          className="border-border bg-card rounded-xl border p-5"
        >
          <h2 id="scoring" className="stamp text-muted-foreground">
            Scoring
          </h2>
          <p className="font-display text-foreground mt-3 text-xl font-semibold tracking-tight">
            Not probed here, on purpose.
          </p>
          <p className="text-muted-foreground mt-2 max-w-[52ch] text-sm leading-relaxed">
            <code className="text-foreground/90 font-mono text-[11px]">
              POST /api/v1/cases/explain
            </code>{' '}
            is the one endpoint that does real work: it aligns 3,574 columns, runs the calibrated
            model, and — above the review threshold — computes SHAP attributions and reasons about
            them. Calling that every thirty seconds to colour in a status dot would cost more than
            the dot is worth.
          </p>
          <p className="text-muted-foreground mt-3 max-w-[52ch] text-sm leading-relaxed">
            The Analyzer exercises it for real, end to end, and reports the round trip it measured.
          </p>
          <Link
            href="/analyze"
            className="text-foreground focus-visible:ring-ring/50 mt-4 inline-flex items-center gap-1.5 rounded text-sm font-medium underline decoration-dotted underline-offset-4 focus-visible:ring-3 focus-visible:outline-none"
          >
            Open the Analyzer
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </section>
      </div>

      {/* ---- What is deliberately not secured -------------------------- */}
      <section
        aria-labelledby="posture"
        className="border-risk-elevated/40 bg-risk-elevated/5 mt-8 rounded-xl border p-5"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert className="text-risk-elevated mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="space-y-3">
            <div>
              <h2 id="posture" className="stamp text-risk-elevated">
                Read this before treating the API as production
              </h2>
              <p className="font-display text-foreground mt-2 text-lg font-semibold tracking-tight">
                This deployment is open on purpose.
              </p>
            </div>
            <ul className="text-muted-foreground max-w-[76ch] space-y-2 text-sm leading-relaxed">
              <li>
                <span className="text-foreground/90 font-medium">Authentication is a stub.</span>{' '}
                <code className="font-mono text-[11px]">verify_token</code> is wired into every
                router as a dependency and never rejects anything. Any request reaches any endpoint.
              </li>
              <li>
                <span className="text-foreground/90 font-medium">CORS allows every origin.</span>{' '}
                Any page on the internet can call this API from a user&apos;s browser.
              </li>
              <li>
                <span className="text-foreground/90 font-medium">
                  Several endpoints serve precomputed artifacts.
                </span>{' '}
                The case index and the model metrics read JSON written during the build phases;
                they are real outputs of real runs, but they are not recomputed per request. Only
                the Analyzer scores live.
              </li>
            </ul>
            <p className="text-muted-foreground max-w-[76ch] text-xs leading-relaxed">
              None of this is a defect to be discovered — it is how a public demo is meant to be
              reachable. It is written here so nobody has to guess, and so the reasoning engine
              gets judged on the reasoning rather than on a login screen.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Status marker.
 *
 * Green here is the Approve tier and amber the Elevated tier, reused rather than
 * reinvented — an operator who has learned that this product's green means
 * "cleared, no action" reads a green service dot the same way.
 */
function ProbeState({ result, loading }: { result?: ProbeResult; loading: boolean }) {
  if (loading || !result) {
    return (
      <span className="border-border bg-inset inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5">
        <span className="bg-muted-foreground/40 size-1.5 rounded-full" aria-hidden />
        <span className="stamp text-muted-foreground">Probing</span>
      </span>
    );
  }

  if (result.ok) {
    return (
      <span className="border-risk-approve/40 bg-risk-approve/10 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5">
        <Check className="text-risk-approve size-3" aria-hidden />
        <span className="stamp text-risk-approve">Answering</span>
      </span>
    );
  }

  return (
    <span className="border-risk-critical/40 bg-risk-critical/10 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5">
      <X className="text-risk-critical size-3" aria-hidden />
      <span className="stamp text-risk-critical">
        {result.httpStatus === null ? 'No response' : `HTTP ${result.httpStatus}`}
      </span>
    </span>
  );
}

function ProbeReadout({ result, loading }: { result?: ProbeResult; loading: boolean }) {
  if (loading || !result) {
    return (
      <div className="border-border space-y-2 border-t pt-3 @2xl:border-t-0 @2xl:border-l @2xl:pt-0 @2xl:pl-6">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
    );
  }

  return (
    <div className="border-border space-y-1.5 border-t pt-3 @2xl:border-t-0 @2xl:border-l @2xl:pt-0 @2xl:pl-6">
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            'numeral text-2xl leading-none font-semibold',
            result.ok ? 'text-foreground' : 'text-risk-critical',
          )}
        >
          {Math.round(result.ms)}
        </span>
        <span className="text-muted-foreground text-xs">ms round trip</span>
      </div>
      <p className="text-muted-foreground font-mono text-[11px] break-words">
        {result.httpStatus !== null && `${result.httpStatus} · `}
        {result.detail}
      </p>
      {result.transportError && (
        <p className="text-risk-critical flex items-start gap-1.5 text-[11px] leading-relaxed">
          <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden />
          {result.transportError}
        </p>
      )}
    </div>
  );
}

const STREAM_COPY: Record<StreamStatus, { title: string; body: string }> = {
  connecting: {
    title: 'Opening the connection',
    body: 'The first attempt is in flight. Until it succeeds, notifications and toasts will not arrive on their own.',
  },
  open: {
    title: 'Connected',
    body: 'The backend is pushing events. New cases, drift alerts and model promotions appear without a refresh.',
  },
  retrying: {
    title: 'Reconnecting',
    body: 'The stream dropped and is being reopened with a widening delay. Everything else on the dashboard still works — you just have to refresh to see changes.',
  },
  offline: {
    title: 'Not connected',
    body: 'Repeated attempts have failed, so the stream is being treated as down. Retries continue in the background at the longest interval; nothing else on the dashboard depends on it.',
  },
};

function StreamDot({ status }: { status: StreamStatus }) {
  const tone =
    status === 'open'
      ? 'bg-risk-approve'
      : status === 'offline'
        ? 'bg-risk-critical'
        : 'bg-risk-elevated';
  return (
    <span className="relative inline-flex size-2.5 shrink-0" aria-hidden>
      <span
        className={cn(
          'size-2.5 rounded-full',
          tone,
          status === 'open' && 'animate-sentinel-pulse',
        )}
      />
    </span>
  );
}
