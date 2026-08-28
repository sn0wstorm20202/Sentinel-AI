'use client';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { formatProbability, formatScore, riskMeta, RISK_TIERS } from '@/lib/risk';

/* -------------------------------------------------------------------------- */
/* Stamp — the classification micro-label used to name regions of the screen. */
/* -------------------------------------------------------------------------- */

export function Stamp({
  children,
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span className={cn('stamp text-muted-foreground', className)} {...props}>
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* RiskBadge — one tier, one appearance, everywhere.                          */
/* -------------------------------------------------------------------------- */

const riskBadgeSize = cva(
  'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border font-mono font-medium uppercase tracking-[0.14em] whitespace-nowrap',
  {
    variants: {
      size: {
        sm: 'h-[18px] px-1.5 text-[9px]',
        default: 'h-6 px-2 text-[10px]',
        lg: 'h-7 px-2.5 text-[11px]',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

export function RiskBadge({
  tier,
  size,
  showDot = true,
  className,
}: {
  tier: unknown;
  showDot?: boolean;
  className?: string;
} & VariantProps<typeof riskBadgeSize>) {
  const meta = riskMeta(tier);
  return (
    <span
      className={cn(riskBadgeSize({ size }), meta.bg, meta.border, meta.text, className)}
      title={`${meta.label} — ${meta.meaning}`}
    >
      {showDot && (
        <span className={cn('size-1.5 shrink-0 rounded-full', meta.fill)} aria-hidden />
      )}
      {meta.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* RiskDot — the smallest possible tier indicator, for dense rows.            */
/* -------------------------------------------------------------------------- */

export function RiskDot({
  tier,
  live = false,
  className,
}: {
  tier: unknown;
  live?: boolean;
  className?: string;
}) {
  const meta = riskMeta(tier);
  return (
    <span className={cn('relative inline-flex size-2 shrink-0', className)} aria-hidden>
      <span className={cn('absolute inset-0 rounded-full', meta.fill)} />
      {live && (
        <span
          className={cn('absolute inset-0 rounded-full animate-sentinel-pulse', meta.fill)}
        />
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* RiskMeter — the calibrated readout.                                        */
/*                                                                            */
/* A needle on a thermal scale. Every tier boundary is labelled, so the        */
/* reader can see not just where this transaction landed but what the other    */
/* outcomes would have been. That context is the whole point: a lone number    */
/* like "99.9" says nothing to someone seeing the product for the first time.  */
/* -------------------------------------------------------------------------- */

export function RiskMeter({
  tier,
  score,
  probability,
  className,
  showGuidance = true,
}: {
  tier: unknown;
  score?: number | null;
  probability?: number | null;
  className?: string;
  showGuidance?: boolean;
}) {
  const meta = riskMeta(tier);
  // The needle tracks the engine's own score when present; otherwise it rests
  // at the tier's nominal position. Never invent a position.
  const pct =
    typeof score === 'number' && !Number.isNaN(score)
      ? Math.min(100, Math.max(0, score))
      : meta.ramp * 100;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1.5">
          <Stamp>Classification</Stamp>
          <div className={cn('font-display text-2xl leading-none font-semibold', meta.text)}>
            {meta.label}
          </div>
        </div>
        <div className="space-y-1.5 text-right">
          <Stamp>Risk score</Stamp>
          <div className="flex items-baseline justify-end gap-1.5">
            <span className={cn('numeral text-3xl leading-none font-semibold', meta.text)}>
              {formatScore(score)}
            </span>
            <span className="text-muted-foreground text-xs">/ 100</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div
          className="relative h-1.5 w-full overflow-hidden rounded-full"
          role="meter"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Risk score ${formatScore(score)} of 100, classified ${meta.label}`}
        >
          <div className="thermal-ramp absolute inset-0 opacity-25" />
          <div
            className={cn('absolute inset-y-0 left-0 rounded-full', meta.fill)}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/*
          Tier scale. Shows the reader the whole decision space, not just the
          point their transaction landed on.

          The unselected labels were `text-muted-foreground/45` — 2.27:1, the
          worst-measuring text in the product. They were dimmed on the theory
          that an unselected tier is an "inactive UI component", which WCAG
          1.4.3 exempts from contrast.

          That theory contradicts the paragraph above. These four words are not
          controls and cannot be activated; they are a scale legend, and the
          reason this component draws all four is so a first-time reader learns
          that CRITICAL is one of four outcomes rather than a lone verdict. Text
          cannot be the point and be incidental at the same time. So they get a
          real floor.

          Selection is now carried twice over — the active tier is the only
          coloured one *and* the only bold one — so it still reads at a glance,
          and it survives a reader who cannot separate the four hues.
        */}
        <div className="flex justify-between">
          {RISK_TIERS.map((t) => {
            const m = riskMeta(t);
            const isActive = t === meta.tier;
            return (
              <span
                key={t}
                className={cn(
                  'stamp transition-colors',
                  isActive ? cn(m.text, 'font-semibold') : 'text-muted-foreground-subtle',
                )}
              >
                {m.label}
              </span>
            );
          })}
        </div>
      </div>

      {showGuidance && (
        <div className="space-y-1 border-t pt-3">
          <p className="text-foreground text-sm">{meta.meaning}</p>
          <p className="text-muted-foreground text-sm">{meta.directive}</p>
          {typeof probability === 'number' && (
            <p className="text-muted-foreground pt-1 text-xs">
              Calibrated fraud probability{' '}
              <span className="text-foreground font-mono">{formatProbability(probability)}</span>
              {' · '}from the model&apos;s own confidence, not a heuristic
            </p>
          )}
        </div>
      )}
    </div>
  );
}
