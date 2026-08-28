'use client';

/**
 * Stage 03 content — the calibrated score and the threshold it was compared to.
 *
 * The previous interface printed `99.9` in red and stopped there. A number with
 * no scale attached is not an explanation. Two things are missing from that, and
 * both are answerable from files already in this repository:
 *
 *   1. What was the number compared against? → configs/threshold_policy.json
 *   2. Why is the threshold *there*? → configs/business_config.json
 *
 * The second is the interesting one. The threshold sits at 3.97%, which looks
 * absurdly low until you see that missing a fraud is priced at 100× the cost of
 * reviewing a legitimate transaction. Then it is obviously correct. Showing the
 * arithmetic is the difference between a reader trusting the number and a reader
 * assuming it was picked at random.
 */

import { cn } from '@/lib/utils';
import { RiskMeter, Stamp } from '@/components/ui/risk';
import { formatProbability, riskMeta } from '@/lib/risk';
import {
  COST_FALSE_NEGATIVE,
  COST_FALSE_POSITIVE,
  COST_MANUAL_REVIEW,
  OPERATING_THRESHOLD,
} from '@/lib/pipeline';

const money = (n: number) => `$${n.toLocaleString()}`;

export function ScorePanel({
  tier,
  score,
  probability,
}: {
  tier: unknown;
  score?: number | null;
  probability?: number | null;
}) {
  const meta = riskMeta(tier);
  const p = typeof probability === 'number' && !Number.isNaN(probability) ? probability : null;
  const crossed = p !== null ? p >= OPERATING_THRESHOLD : null;
  const ratio = Math.round(COST_FALSE_NEGATIVE / COST_FALSE_POSITIVE);

  // Both markers sit on a plain linear 0–100% axis. That is deliberate: the
  // threshold really is squeezed against the left edge, and seeing it squeezed
  // is the point. A log axis would hide the asymmetry this panel exists to show.
  const thresholdPct = OPERATING_THRESHOLD * 100;
  const scorePct = p !== null ? Math.min(100, Math.max(0, p * 100)) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <RiskMeter tier={tier} score={score} probability={probability} />

      <div className="space-y-5">
        {/* ---- The comparison that produced the tier -------------------- */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Stamp className="text-foreground">The decision</Stamp>
            <span className="text-muted-foreground font-mono text-[11px]">
              linear scale · 0% to 100%
            </span>
          </div>

          <div className="relative pt-6 pb-9">
            {/* Axis */}
            <div className="bg-border relative h-px w-full">
              {/* Threshold */}
              <div
                className="absolute -top-6 bottom-0 w-px"
                style={{ left: `${thresholdPct}%` }}
                aria-hidden
              >
                <div className="bg-foreground/40 h-full w-px" />
              </div>
              <div
                className="absolute top-1.5 -translate-x-1/2 text-center whitespace-nowrap"
                style={{ left: `${thresholdPct}%` }}
              >
                <div className="text-foreground font-mono text-[11px]">
                  {thresholdPct.toFixed(2)}%
                </div>
                <div className="stamp text-muted-foreground-subtle">threshold</div>
              </div>

              {/* This transaction */}
              {scorePct !== null && (
                <>
                  <div
                    className="absolute -top-6 bottom-0 w-px"
                    style={{ left: `${scorePct}%`, background: meta.cssVar }}
                    aria-hidden
                  />
                  <div
                    className={cn(
                      'absolute -top-6 size-2 -translate-x-1/2 rounded-full',
                      meta.fill,
                    )}
                    style={{ left: `${scorePct}%` }}
                    aria-hidden
                  />
                  <div
                    className={cn(
                      'absolute top-1.5 whitespace-nowrap',
                      // Keep the label inside the box at either extreme.
                      scorePct > 80
                        ? '-translate-x-full pr-1 text-right'
                        : scorePct < 20
                          ? 'pl-1'
                          : '-translate-x-1/2 text-center',
                    )}
                    style={{ left: `${scorePct}%` }}
                  >
                    {/*
                      This number was printed in the tier colour, which measured
                      4.00:1 at 11px — under the 4.5:1 floor, and the smallest
                      type on the panel.

                      Raising it would have meant 19px bold to qualify for the
                      large-text allowance, which is absurd for an axis label and
                      would collide with the threshold label beside it.

                      But the real problem was that it disagreed with its own
                      neighbour. The threshold above renders in `text-foreground`.
                      Two readings of the same quantity on the same axis, one
                      white and one red, implies they differ in kind. They do
                      not — one is a policy line and one is a measurement, and
                      the comparison between them is the entire point of the
                      panel. So both are plain, both are legible, and the tier is
                      carried by the coloured dot and rule directly above.
                    */}
                    <div className="text-foreground font-mono text-[11px] font-medium">
                      {formatProbability(p)}
                    </div>
                    <div className="stamp text-muted-foreground-subtle">this transaction</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="text-foreground/85 max-w-[70ch] text-sm leading-relaxed">
            {crossed === null ? (
              <>No probability was returned for this case, so no comparison can be shown.</>
            ) : crossed ? (
              <>
                The model put this transaction at{' '}
                <span className="text-foreground font-mono">{formatProbability(p)}</span>, which is
                above the {thresholdPct.toFixed(2)}% operating threshold. That is what makes it{' '}
                <span className={meta.text}>{meta.label}</span> — not the size of the number on its
                own.
              </>
            ) : (
              <>
                The model put this transaction at{' '}
                <span className="text-foreground font-mono">{formatProbability(p)}</span>, below the{' '}
                {thresholdPct.toFixed(2)}% operating threshold. It clears without review, which is
                why the engine stops here.
              </>
            )}
          </p>
        </div>

        {/* ---- Why the threshold is where it is ------------------------- */}
        <div className="border-border space-y-3 border-t pt-4">
          <Stamp className="text-foreground">Why the threshold is so low</Stamp>
          <p className="text-muted-foreground max-w-[70ch] text-sm leading-relaxed">
            A {thresholdPct.toFixed(2)}% threshold looks over-sensitive until you price the two ways
            of being wrong. These are the institution&apos;s own numbers, and they are{' '}
            {ratio}:1 apart.
          </p>

          <dl className="grid gap-px overflow-hidden rounded-lg border sm:grid-cols-3">
            <CostCell
              label="Missing a fraud"
              value={money(COST_FALSE_NEGATIVE)}
              note="False negative — the money leaves."
              emphasis
            />
            <CostCell
              label="Flagging a good one"
              value={money(COST_FALSE_POSITIVE)}
              note="False positive — a customer is inconvenienced."
            />
            <CostCell
              label="One manual review"
              value={money(COST_MANUAL_REVIEW)}
              note="What an analyst's time costs."
            />
          </dl>

          <p className="text-muted-foreground max-w-[70ch] text-sm leading-relaxed">
            At {ratio}:1, it pays to review up to {ratio} legitimate transactions rather than let one
            fraud through. The threshold is the point where that trade stops being worth it — swept
            from the cost curve, not rounded to a tidy number.
          </p>
          <p className="text-muted-foreground-subtle font-mono text-[11px] break-words">
            configs/threshold_policy.json · configs/business_config.json
          </p>
        </div>
      </div>
    </div>
  );
}

function CostCell({
  label,
  value,
  note,
  emphasis,
}: {
  label: string;
  value: string;
  note: string;
  emphasis?: boolean;
}) {
  return (
    <div className={cn('bg-card space-y-1 px-3 py-3', emphasis && 'bg-inset')}>
      <dt className="stamp">{label}</dt>
      <dd
        className={cn(
          'numeral text-xl leading-none font-semibold',
          emphasis ? 'text-risk-high' : 'text-foreground',
        )}
      >
        {value}
      </dd>
      <dd className="text-muted-foreground text-xs leading-relaxed">{note}</dd>
    </div>
  );
}
