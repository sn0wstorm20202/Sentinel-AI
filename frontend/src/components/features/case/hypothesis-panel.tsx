'use client';

/**
 * Stage 05 content — typology matching.
 *
 * The old panel printed "No fraud hypotheses generated for this case." in a grey
 * box and left it there. Every case reaches that branch, so in practice the
 * product's most interesting reasoning step rendered as a dead end.
 *
 * Worse, it read `intelligence.fraud_hypotheses` — a key the API does not emit —
 * so even a case *with* hypotheses would have shown the empty state.
 *
 * A search that returns nothing is still a result, and the reason it returned
 * nothing is knowable here. So instead of a blank, this panel shows the search
 * itself: the four typologies in the library, the concepts each one needs, and
 * which of those concepts the evidence actually resolved to. The reader can see
 * what was looked for and work out for themselves why nothing matched.
 */

import { Check, Minus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Stamp } from '@/components/ui/risk';
import { EmptyState } from '@/components/features/case/evidence-panel';
import {
  CONCEPT_MAP,
  MAPPED_LIVE_COUNT,
  MODEL_COLUMN_COUNT,
  TYPOLOGIES,
  observedConcepts,
} from '@/lib/typologies';
import type { InvestigationCase } from '@/types';

type Hypothesis = NonNullable<InvestigationCase['intelligence']['hypotheses']>[number];

export function HypothesisPanel({
  hypotheses,
  evidenceFeatureIds = [],
  skipped,
}: {
  hypotheses: Hypothesis[] | undefined;
  /** Feature IDs from stage 04, used to show which concepts were resolved. */
  evidenceFeatureIds?: string[];
  skipped?: boolean;
}) {
  if (skipped) {
    return (
      <EmptyState
        title="Typology matching was not reached"
        body="The engine short-circuited after scoring, so the typology library was never searched for this transaction."
      />
    );
  }

  const matches = hypotheses ?? [];
  const observed = observedConcepts(evidenceFeatureIds);

  if (matches.length > 0) {
    return (
      <div className="space-y-4">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <Stamp className="text-foreground">Patterns matched</Stamp>
          <span className="text-muted-foreground font-mono text-[11px]">
            {matches.length} of {TYPOLOGIES.length} typologies
          </span>
        </header>
        <ul className="space-y-2">
          {matches.map((h, i) => {
            const name = h.name ?? h.typology ?? `Typology ${i + 1}`;
            const conf = typeof h.confidence === 'number' ? h.confidence : null;
            const library = TYPOLOGIES.find((t) => t.name.toLowerCase() === String(name).toLowerCase());
            return (
              <li key={`${name}-${i}`} className="border-border bg-inset/40 rounded-lg border px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="font-display text-foreground text-base font-semibold">{name}</h4>
                  {conf !== null && (
                    <span className="text-muted-foreground font-mono text-xs">
                      {(conf * 100).toFixed(0)}% match strength
                    </span>
                  )}
                </div>
                {(h.description ?? library?.description) && (
                  <p className="text-muted-foreground mt-1 max-w-[70ch] text-sm leading-relaxed">
                    {h.description ?? library?.description}
                  </p>
                )}
                {h.supporting_features && h.supporting_features.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Stamp>Evidence</Stamp>
                    {h.supporting_features.map((f) => (
                      <code
                        key={f}
                        className="border-border text-foreground/80 rounded border px-1.5 py-0.5 font-mono text-[11px]"
                      >
                        {f}
                      </code>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-muted-foreground border-border border-t pt-3 text-xs leading-relaxed">
          <span className="stamp mr-2">Note</span>
          Match strength is coverage of the pattern&apos;s required concepts, weighted by the
          attribution behind each one and capped at 99%. It is a matching score, not a probability
          that this specific scheme occurred.
        </p>
      </div>
    );
  }

  /* ---- Nothing matched. Show the search, not a blank. ------------------- */
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Stamp className="text-foreground">Nothing matched — here is what was searched</Stamp>
          <span className="text-muted-foreground font-mono text-[11px]">
            0 of {TYPOLOGIES.length} typologies
          </span>
        </div>
        <p className="text-foreground/85 max-w-[74ch] text-sm leading-relaxed">
          The engine compared this transaction&apos;s evidence against every documented pattern in
          the library and proposed none of them. That is a finding, not an error: naming a scheme
          the evidence cannot support would be worse than saying nothing.
        </p>
      </header>

      {/* The library, with concept coverage marked. */}
      <ul className="grid gap-2 sm:grid-cols-2">
        {TYPOLOGIES.map((t) => (
          <li key={t.id} className="border-border rounded-lg border border-dashed px-3 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="text-foreground text-sm font-medium">{t.name}</h4>
              <span className="stamp text-muted-foreground-subtle">{t.id}</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{t.description}</p>
            <div className="mt-2 space-y-1">
              <Stamp className="text-muted-foreground-subtle">Needs to see</Stamp>
              <ul className="space-y-1">
                {t.requires.map((concept) => {
                  const hit = observed.includes(concept);
                  return (
                    /*
                      The unmatched concepts were dimmed to 70% alpha — 3.79:1 —
                      on the reasonable-sounding logic that a thing which was not
                      observed should recede.

                      Backwards, for this panel specifically. Every typology here
                      failed to match, so *every* row is an absence, and the list
                      of what the engine needed but never saw is the only thing on
                      screen that answers "why did nothing match?". Fading it
                      leaves the reader with four boxes of grey and no finding.

                      Presence is marked by the tick and by full-strength
                      foreground; absence gets the quiet token, which is quiet and
                      still readable.
                    */
                    <li
                      key={concept}
                      className={cn(
                        'flex items-center gap-1.5 text-xs',
                        hit ? 'text-foreground' : 'text-muted-foreground-subtle',
                      )}
                    >
                      {hit ? (
                        <Check className="text-risk-elevated size-3 shrink-0" aria-hidden />
                      ) : (
                        <Minus className="size-3 shrink-0 opacity-50" aria-hidden />
                      )}
                      {concept}
                      <span className="sr-only">{hit ? ' — observed' : ' — not observed'}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      {/* The real reason, stated plainly. */}
      <div className="border-border space-y-2 border-t pt-4">
        <Stamp className="text-foreground">Why nothing could match</Stamp>
        <p className="text-muted-foreground max-w-[74ch] text-sm leading-relaxed">
          Matching works by concept, not by column. Before a pattern can be tested, each ranked
          feature has to be resolved to a named concept through the knowledge base — and the
          knowledge base currently maps {CONCEPT_MAP.length} feature identifiers, of which only{' '}
          <span className="text-foreground font-mono">{MAPPED_LIVE_COUNT}</span> are real columns in
          the deployed model:{' '}
          {CONCEPT_MAP.filter((c) => c.live).map((c, i, arr) => (
            <span key={c.id}>
              <code className="text-foreground font-mono text-[12px]">{c.id}</code>
              <span className="text-muted-foreground-subtle"> ({c.concept})</span>
              {i < arr.length - 1 ? ', ' : ''}
            </span>
          ))}
          .
        </p>
        <p className="text-muted-foreground max-w-[74ch] text-sm leading-relaxed">
          So a typology can only be proposed when one of those{' '}
          <span className="text-foreground font-mono">{MAPPED_LIVE_COUNT}</span> columns — out of{' '}
          <span className="text-foreground font-mono">
            {MODEL_COLUMN_COUNT.toLocaleString()}
          </span>{' '}
          — reaches the top of the attribution ranking.{' '}
          {observed.length === 0
            ? 'For this transaction, none did.'
            : `For this transaction the evidence resolved to ${observed.join(', ')}, which no single pattern in the library requires.`}{' '}
          This is a coverage gap in the knowledge base, not a failure of the model or of the matcher.
          Closing it means mapping more of the anonymised columns to concepts — which needs the
          source dataset&apos;s documentation, not more code.
        </p>
        <p className="text-muted-foreground-subtle font-mono text-[11px] break-words">
          knowledge/fraud_typologies.json · knowledge/feature_metadata.json ·
          src/fie/HypothesisEngine.py
        </p>
      </div>
    </div>
  );
}
