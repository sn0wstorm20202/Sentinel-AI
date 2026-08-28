'use client';

/**
 * Stage 02 content — schema alignment.
 *
 * This is the least glamorous stage and arguably the most important one, because
 * it is the reason the score and the explanation can never disagree: both read
 * the same aligned row. Nothing in the old interface acknowledged it existed.
 *
 * The API does not report per-field alignment counts, so rather than describe the
 * step vaguely, `public/schema/champion-features.json` ships the deployed model's
 * own `feature_names_in_` list and the browser performs the identical set
 * operation `align_features()` performs server-side. When the counts are real
 * they are shown; when they are not available they are not invented.
 */

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Stamp } from '@/components/ui/risk';
import { EmptyState } from '@/components/features/case/evidence-panel';

export interface Alignment {
  matched: number;
  dropped: number;
  filled: number;
  total: number;
  droppedKeys?: string[];
}

export function AlignmentPanel({ alignment }: { alignment?: Alignment | null }) {
  const [showDropped, setShowDropped] = React.useState(false);

  if (!alignment) {
    return (
      <EmptyState
        title="Alignment counts are not reported for a stored case"
        body="The step definitely ran — scoring is impossible without it — but the API response does not include how many fields matched, were dropped, or were filled. The Live Analyzer computes these against the deployed model's own column list, so the stage is measured there rather than described."
      />
    );
  }

  const { matched, dropped, filled, total } = alignment;
  const matchedPct = total > 0 ? (matched / total) * 100 : 0;
  const droppedKeys = alignment.droppedKeys ?? [];

  return (
    <div className="space-y-4">
      <dl className="grid gap-px overflow-hidden rounded-lg border sm:grid-cols-4">
        <Cell
          label="Matched"
          value={matched.toLocaleString()}
          note="Recognised by the model and used as given."
          tone="text-risk-approve"
        />
        <Cell
          label="Filled with NaN"
          value={filled.toLocaleString()}
          note="Expected but absent. XGBoost handles a missing value natively rather than substituting a guess."
        />
        <Cell
          label="Dropped"
          value={dropped.toLocaleString()}
          note="Sent but not part of the trained schema, so ignored entirely."
          tone={dropped > 0 ? 'text-risk-elevated' : undefined}
        />
        <Cell
          label="Model expects"
          value={total.toLocaleString()}
          note="The champion model's exact, ordered column list."
        />
      </dl>

      {/* Coverage bar — matched against the full expected schema. */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Stamp>Schema coverage</Stamp>
          <span className="text-muted-foreground font-mono text-[11px]">
            {matchedPct.toFixed(1)}% of {total.toLocaleString()} columns supplied
          </span>
        </div>
        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
          <div className="bg-risk-approve h-full rounded-full" style={{ width: `${matchedPct}%` }} />
        </div>
        <p className="text-muted-foreground max-w-[74ch] text-xs leading-relaxed">
          A partial payload is legitimate here — the model was trained with missing values present
          and treats absence as information. Only a payload matching{' '}
          <em className="not-italic">none</em> of the expected columns is rejected, with a 400.
        </p>
      </div>

      {dropped > 0 && droppedKeys.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowDropped((v) => !v)}
            className="stamp text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded focus-visible:ring-3 focus-visible:outline-none"
            aria-expanded={showDropped}
          >
            {showDropped ? 'Hide' : 'Show'} the {dropped.toLocaleString()} dropped field
            {dropped === 1 ? '' : 's'}
          </button>
          {showDropped && (
            <div className="border-border max-h-40 overflow-auto rounded-lg border px-3 py-2">
              <ul className="flex flex-wrap gap-1.5">
                {droppedKeys.map((k) => (
                  <li
                    key={k}
                    className="border-border text-muted-foreground rounded border border-dashed px-1.5 py-0.5 font-mono text-[11px]"
                  >
                    {k}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Cell({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: string;
}) {
  return (
    <div className="bg-card space-y-1 px-3 py-2.5">
      <dt className="stamp">{label}</dt>
      <dd className={cn('numeral text-xl leading-none font-semibold', tone ?? 'text-foreground')}>
        {value}
      </dd>
      <dd className="text-muted-foreground text-xs leading-relaxed">{note}</dd>
    </div>
  );
}
