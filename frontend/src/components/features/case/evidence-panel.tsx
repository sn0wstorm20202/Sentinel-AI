'use client';

/**
 * Stage 04 content — SHAP attribution.
 *
 * Replaces the previous "Evidence Log", which had three honesty problems:
 *   1. It printed `Critical` / `Elevated` severity badges derived from the SHAP
 *      *sign*. Sign means which direction a feature pushed the score; it says
 *      nothing about severity. A feature that lowered the score was labelled
 *      "Elevated".
 *   2. Its fallback branch generated a "Risk Weight" column from
 *      `feature.length + index` — the displayed weight was literally a function
 *      of how many characters the feature name had.
 *   3. It read `intelligence.fraud_hypotheses`, a key the API does not emit, so
 *      the fallback could never fire anyway.
 *
 * This version shows only what the engine actually returned, names each field
 * by what it really is, and explains the anonymised column identifiers instead
 * of presenting them bare.
 */

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Stamp } from '@/components/ui/risk';
import { describeDirection, describeFeature } from '@/lib/features';
import type { InvestigationCase } from '@/types';

type Evidence = NonNullable<InvestigationCase['intelligence']['evidence']>[number];

export function EvidencePanel({
  evidence,
  skipped,
}: {
  evidence: Evidence[] | undefined;
  /** True when the orchestrator short-circuited before attribution ran. */
  skipped?: boolean;
}) {
  if (skipped) {
    return (
      <EmptyState
        title="Attribution was not run for this transaction"
        body="The engine stops after scoring when a transaction is cleared. There is no attribution to show because none was computed — not because none was found."
      />
    );
  }

  if (!evidence || evidence.length === 0) {
    return (
      <EmptyState
        title="No ranked contributors were returned"
        body="The attribution stage ran but the response contained no evidence entries. Open the Live Analyzer and score a high-risk transaction to see this stage populated."
      />
    );
  }

  const maxMagnitude = Math.max(...evidence.map((e) => Math.abs(e.importance_score)), 0.0001);

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Stamp className="text-foreground">Feature attribution</Stamp>
          <span className="text-muted-foreground font-mono text-[11px]">
            top {evidence.length} of 3,574 columns
          </span>
        </div>
        <p className="text-muted-foreground max-w-[74ch] text-sm leading-relaxed">
          SHAP reads the model&apos;s own internals to work out how much each column moved{' '}
          <em className="text-foreground/90 not-italic">this one</em> transaction&apos;s score.
          These are not general feature importances and not correlations — they are this
          transaction&apos;s specific arithmetic, and they sum to the gap between its score and the
          model&apos;s average output.
        </p>
      </header>

      <ul className="divide-border divide-y">
        {evidence.map((e) => {
          const label = describeFeature(e.feature_id);
          const dir = describeDirection(e.direction);
          const width = (Math.abs(e.importance_score) / maxMagnitude) * 100;

          return (
            <li key={`${e.rank}-${e.feature_id}`} className="grid gap-3 py-3 sm:grid-cols-[2.5rem_minmax(0,1fr)_11rem]">
              {/* Rank. These carry the ordering of the whole list, so they are
                  the last thing that should be hard to read — same reasoning as
                  the stage ordinals on the command centre. */}
              <div className="flex items-start">
                <span className="numeral text-muted-foreground-subtle text-lg leading-none">
                  {String(e.rank).padStart(2, '0')}
                </span>
              </div>

              {/* Identity */}
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-foreground font-mono text-[13px] font-medium">
                    {e.feature_id}
                  </code>
                  <span className="stamp border-border text-muted-foreground-subtle rounded border px-1 py-0.5">
                    {label.kindLabel}
                  </span>
                </div>
                <p className="text-muted-foreground max-w-[62ch] text-xs leading-relaxed">
                  {label.description}
                </p>
              </div>

              {/* Contribution */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'stamp flex items-center gap-1',
                      dir.towardsFraud ? 'text-risk-high' : 'text-muted-foreground',
                    )}
                    title={dir.meaning}
                  >
                    {dir.towardsFraud ? (
                      <ArrowUpRight className="size-3" aria-hidden />
                    ) : (
                      <ArrowDownRight className="size-3" aria-hidden />
                    )}
                    {dir.label}
                  </span>
                  <span className="text-foreground font-mono text-xs">
                    {e.importance_score.toFixed(4)}
                  </span>
                </div>
                <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      dir.towardsFraud ? 'bg-risk-high' : 'bg-muted-foreground/50',
                    )}
                    style={{ width: `${width}%` }}
                  />
                </div>
                <p className="text-muted-foreground-subtle font-mono text-[10px]">
                  {(e.confidence * 100).toFixed(1)}% share of total attribution
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {/*
       * The backend field is named `confidence`, but EvidenceEngine computes it
       * as |SHAP| / Σ|SHAP| × 2 capped at 0.99 — its own source comment says
       * "this is a derived importance weight, not a statistical confidence
       * interval". Presenting it as confidence would misrepresent it.
       */}
      <p className="text-muted-foreground border-border border-t pt-3 text-xs leading-relaxed">
        <span className="stamp mr-2">How to read this</span>
        The signed value is the raw SHAP magnitude. &ldquo;Share of total attribution&rdquo; is that
        magnitude as a proportion of all attribution for this transaction (scaled ×2, capped at
        99%). The API returns it in a field called <code className="font-mono">confidence</code>,
        but it is a relative importance weight, not a statistical confidence interval — so it is
        not labelled as one here.
      </p>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-border/70 bg-inset/40 space-y-1.5 rounded-lg border border-dashed px-4 py-5">
      <p className="text-foreground text-sm font-medium">{title}</p>
      <p className="text-muted-foreground max-w-[70ch] text-sm leading-relaxed">{body}</p>
    </div>
  );
}
