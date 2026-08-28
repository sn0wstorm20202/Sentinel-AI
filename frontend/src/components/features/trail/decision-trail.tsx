'use client';

/**
 * THE DECISION TRAIL — the signature element of this interface.
 *
 * Sentinel AI's whole claim is that it does not behave like a black box: it
 * scores a transaction and then shows every step of its reasoning. The previous
 * interface buried that behind three tabs labelled "graph / evidence /
 * timeline", which describe the *widgets* rather than the *process*, and left a
 * first-time reader with no idea what had happened or in what order.
 *
 * This component makes the process itself the navigation. Six numbered stages,
 * in the exact order the backend runs them, each showing what happens, where it
 * happens, the real result it produced, and what happens next.
 *
 * The numbering is not decoration. The skill's own test for numbered markers is
 * whether "the content actually is a sequence - like a real process". This is a
 * real process, with a fixed order, in which stage 02 exists so that stages 03
 * and 04 cannot disagree. Order carries information the reader needs.
 *
 * Everything else in the interface stays deliberately quiet so that this reads
 * as the one loud thing on the page.
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CornerDownRight,
  Minus,
  Play,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Stamp } from '@/components/ui/risk';
import {
  STAGE_IDS,
  trailSummary,
  type StageId,
  type StageRun,
  type StageState,
} from '@/lib/pipeline';

/* -------------------------------------------------------------------------- */

const STATE_LABEL: Record<StageState, string> = {
  pending: 'Not run yet',
  running: 'Running',
  done: 'Completed',
  skipped: 'Skipped by design',
  failed: 'Failed',
};

function StateIcon({ state }: { state: StageState }) {
  if (state === 'done') return <Check className="size-3" aria-hidden />;
  if (state === 'skipped') return <Minus className="size-3" aria-hidden />;
  if (state === 'running')
    return <span className="bg-current size-1.5 animate-sentinel-pulse rounded-full" aria-hidden />;
  // `failed` used to fall through to the hollow ring below — the same marker as
  // `pending`, so a stage that errored reported itself as "not run yet". It is
  // also the one state that keeps the tier colour here, since its label no
  // longer carries it.
  if (state === 'failed')
    return <TriangleAlert className="text-risk-critical size-3" aria-hidden />;
  return <span className="size-1.5 rounded-full border border-current" aria-hidden />;
}

/* -------------------------------------------------------------------------- */
/* One node on the rail.                                                      */
/* -------------------------------------------------------------------------- */

function StageNode({
  run,
  selected,
  accent,
  onSelect,
  buttonRef,
}: {
  run: StageRun;
  selected: boolean;
  /** CSS colour for the live/current stage. Risk-tier coloured, or undefined. */
  accent?: string;
  onSelect: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}) {
  const isSkipped = run.state === 'skipped';
  const isPending = run.state === 'pending';
  const isRunning = run.state === 'running';

  return (
    <button
      ref={buttonRef}
      type="button"
      role="tab"
      id={`trail-tab-${run.id}`}
      aria-selected={selected}
      aria-controls="trail-panel"
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      className={cn(
        'group/stage relative flex min-w-0 flex-1 flex-col items-start gap-2 rounded-lg px-2.5 py-2.5 text-left transition-colors',
        'focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none',
        selected ? 'bg-inset' : 'hover:bg-inset/60',
      )}
    >
      {/*
        Numbered marker.

        Four states, and none of them is "disabled" — a skipped stage is a
        deliberate engine decision the reader is supposed to understand, and a
        pending stage is the "what happens next" the trail exists to show. So
        the state is carried by border *style* and by the done state's inversion,
        not by fading text past the point of legibility. The dashed border is
        what says "did not run"; the text stays readable so you can find out why.
      */}
      <span
        className={cn(
          'flex h-7 w-9 shrink-0 items-center justify-center rounded-md border font-display text-[13px] font-semibold tabular-nums transition-colors',
          isSkipped && 'border-dashed border-border text-muted-foreground-subtle',
          isPending && 'border-border/60 text-muted-foreground-subtle',
          run.state === 'done' &&
            (selected
              ? 'border-foreground/40 bg-foreground text-background'
              : 'border-foreground/25 text-foreground'),
          isRunning && 'border-current',
        )}
        style={isRunning && accent ? { color: accent, borderColor: accent } : undefined}
      >
        {run.n}
      </span>

      <span className="flex w-full min-w-0 flex-col gap-1">
        <span
          className={cn(
            'stamp truncate',
            selected ? 'text-foreground' : 'text-muted-foreground',
            (isSkipped || isPending) && 'text-muted-foreground-subtle',
          )}
        >
          {run.name}
        </span>
        {/*
          The readout of a skipped stage is the sentence that explains the
          short-circuit — "not reached, tier was Approve". It was the faintest
          text in the trail and the only place that answers the question a
          skipped stage provokes.
        */}
        <span
          className={cn(
            'truncate font-mono text-[11px] leading-none',
            isSkipped || isPending ? 'text-muted-foreground-subtle' : 'text-muted-foreground',
          )}
          style={isRunning && accent ? { color: accent } : undefined}
        >
          {run.readout}
        </span>
      </span>

      {/* Selected marker: a hairline under the node, not a heavy pill. */}
      {selected && (
        <span
          className="bg-foreground absolute inset-x-2.5 bottom-0 h-px"
          aria-hidden
        />
      )}
    </button>
  );
}

/** The connector between two nodes. Dashed whenever it touches a stage that did not run. */
function Connector({ from, to }: { from: StageState; to: StageState }) {
  const broken =
    from === 'skipped' || to === 'skipped' || from === 'pending' || to === 'pending';
  return (
    <span
      aria-hidden
      className={cn(
        'mt-[18px] h-px w-3 shrink-0 self-start sm:w-5',
        broken
          ? 'border-t border-dashed border-border'
          : 'bg-foreground/25',
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* The trail.                                                                 */
/* -------------------------------------------------------------------------- */

export interface DecisionTrailProps {
  runs: StageRun[];
  /** Real content for each stage, rendered full-width in the panel body. */
  content?: Partial<Record<StageId, React.ReactNode>>;
  /** Risk-tier CSS colour used for the running stage. */
  accent?: string;
  /** Measured end-to-end latency of the run, in milliseconds. Never estimated. */
  elapsedMs?: number;
  selected?: StageId;
  onSelectedChange?: (id: StageId) => void;
  className?: string;
}

export function DecisionTrail({
  runs,
  content,
  accent,
  elapsedMs,
  selected: controlledSelected,
  onSelectedChange,
  className,
}: DecisionTrailProps) {
  const [uncontrolled, setUncontrolled] = React.useState<StageId>('ingest');
  const selected = controlledSelected ?? uncontrolled;
  const setSelected = React.useCallback(
    (id: StageId) => {
      setUncontrolled(id);
      onSelectedChange?.(id);
    },
    [onSelectedChange],
  );

  const shouldReduce = useReducedMotion();
  const tabRefs = React.useRef<Partial<Record<StageId, HTMLButtonElement | null>>>({});

  const index = STAGE_IDS.indexOf(selected);
  const run = runs[index];
  const prev = index > 0 ? runs[index - 1] : undefined;
  const next = index < runs.length - 1 ? runs[index + 1] : undefined;
  const atStart = index === 0;

  const goTo = React.useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(STAGE_IDS.length - 1, i));
      const id = STAGE_IDS[clamped];
      setSelected(id);
      tabRefs.current[id]?.focus();
    },
    [setSelected],
  );

  // Roving-tabindex keyboard model, as a tablist should have.
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        goTo(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        goTo(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        goTo(0);
        break;
      case 'End':
        e.preventDefault();
        goTo(STAGE_IDS.length - 1);
        break;
    }
  };

  if (!run) return null;

  return (
    <section
      className={cn('border-border bg-card overflow-hidden rounded-xl border', className)}
      aria-label="Decision trail"
      data-tour="decision-trail"
    >
      {/* ---- Header ------------------------------------------------------- */}
      <header className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="flex items-baseline gap-3">
          <h2 className="stamp text-foreground">Decision trail</h2>
          <span className="text-muted-foreground font-mono text-[11px]">
            {trailSummary(runs)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {typeof elapsedMs === 'number' && (
            <span className="text-muted-foreground font-mono text-[11px]">
              {(elapsedMs / 1000).toFixed(2)}s end to end
            </span>
          )}
          {/*
            This read "Walk me through it" and carried `disabled={index === 0}`.
            Index 0 is the default state, so the one control on the page that
            offers the guided walkthrough — the thing this whole component exists
            to provide — was greyed out on arrival, and only became clickable
            once the reader had already navigated the trail unaided.

            The `disabled` was presumably guarding "you are already at stage 01",
            but that conflates two different offers. At the start, the useful
            action is to *begin*. Anywhere else, it is to return to the
            beginning. Both are real, so the button always does one of them and
            says which one it is doing.
          */}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => goTo(atStart ? index + 1 : 0)}
            className="stamp"
          >
            {atStart ? (
              <Play className="size-3" data-icon="inline-start" />
            ) : (
              <RotateCcw className="size-3" data-icon="inline-start" />
            )}
            {atStart ? 'Walk me through it' : 'Start over'}
          </Button>
        </div>
      </header>

      {/* ---- The rail ----------------------------------------------------- */}
      <div
        role="tablist"
        aria-label="Pipeline stages"
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className="grid-field flex items-start gap-0 overflow-x-auto px-2 py-2"
      >
        {runs.map((r, i) => (
          <React.Fragment key={r.id}>
            {i > 0 && <Connector from={runs[i - 1].state} to={r.state} />}
            <StageNode
              run={r}
              selected={r.id === selected}
              accent={accent}
              onSelect={() => setSelected(r.id)}
              buttonRef={(el) => {
                tabRefs.current[r.id] = el;
              }}
            />
          </React.Fragment>
        ))}
      </div>

      {/* ---- The selected stage ------------------------------------------ */}
      <div
        role="tabpanel"
        id="trail-panel"
        aria-labelledby={`trail-tab-${run.id}`}
        tabIndex={-1}
        className="border-border border-t"
      >
        <motion.div
          key={run.id}
          initial={shouldReduce ? undefined : { opacity: 0, y: 6 }}
          animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Stage identity */}
          <div className="border-border flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Stamp>
                Stage {run.n} of {String(runs.length).padStart(2, '0')}
              </Stamp>
              <h3 className="font-display text-foreground text-lg leading-tight font-semibold">
                {run.headline}
              </h3>
            </div>
            {/*
              Skipped was 70% alpha and pending was 50% — the same ad-hoc dimming
              already removed from this component's marker, name and readout, and
              missed here only because every stage of a Critical case is `done`,
              so no audit of a real case ever rendered these two branches.

              "Skipped by design" is the phrase that stops a reader reading a
              dashed stage as a broken one. It has to be readable.

              `failed` keeps the tier colour on its icon rather than its text:
              --risk-critical measures 4.00:1 on --card, which is fine at meter
              sizes and under the floor at 10px.
            */}
            <span
              className={cn(
                'stamp flex items-center gap-1.5',
                run.state === 'done' && 'text-foreground',
                (run.state === 'skipped' || run.state === 'pending') &&
                  'text-muted-foreground-subtle',
                run.state === 'failed' && 'text-foreground font-semibold',
              )}
              style={run.state === 'running' && accent ? { color: accent } : undefined}
            >
              <StateIcon state={run.state} />
              {STATE_LABEL[run.state]}
            </span>
          </div>

          {/* What happens here / where */}
          <div className="border-border grid gap-x-8 gap-y-4 border-b px-4 py-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-2">
              <Stamp>What happens here</Stamp>
              <p className="text-foreground/85 max-w-[70ch] text-sm leading-relaxed">
                {run.what}
              </p>
              {run.note && (
                <p
                  className={cn(
                    'border-border/80 max-w-[70ch] border-l-2 pl-3 text-sm leading-relaxed',
                    run.state === 'skipped'
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {run.note}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Stamp>Runs in</Stamp>
              <p className="text-muted-foreground font-mono text-[11px] leading-relaxed break-words">
                {run.engine}
              </p>
            </div>
          </div>

          {/* Real content for this stage */}
          {content?.[run.id] && (
            <div className="border-border border-b px-4 py-4">{content[run.id]}</div>
          )}

          {/* What happens next + navigation */}
          <footer className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
            <div className="flex min-w-0 items-start gap-2">
              <CornerDownRight
                className="text-muted-foreground/60 mt-0.5 size-3.5 shrink-0"
                aria-hidden
              />
              <div className="min-w-0 space-y-0.5">
                <Stamp>{next ? 'What happens next' : 'End of the trail'}</Stamp>
                <p className="text-foreground/80 text-sm">{run.next}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goTo(index - 1)}
                disabled={!prev}
              >
                <ArrowLeft data-icon="inline-start" />
                {prev ? `${prev.n} ${prev.name}` : 'Back'}
              </Button>
              <Button
                variant={next ? 'default' : 'outline'}
                size="sm"
                onClick={() => goTo(index + 1)}
                disabled={!next}
              >
                {next ? `${next.n} ${next.name}` : 'Done'}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </footer>
        </motion.div>
      </div>
    </section>
  );
}
