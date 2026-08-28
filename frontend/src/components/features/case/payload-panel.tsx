'use client';

/**
 * Stage 01 content — what actually arrived.
 *
 * For a stored case there is no payload to show: the API returns the reasoned
 * case, not the request that produced it. Rather than leave the stage empty or
 * imply the fields are hidden for some other reason, this says plainly that the
 * record does not contain them and points at where they can be seen.
 */

import * as React from 'react';

import { Stamp } from '@/components/ui/risk';
import { EmptyState } from '@/components/features/case/evidence-panel';
import { describeFeature } from '@/lib/features';

export function PayloadPanel({
  payload,
  caseId,
  transactionId,
  generatedAt,
}: {
  /** Present only when this UI issued the request itself. */
  payload?: Record<string, unknown> | null;
  caseId?: string;
  transactionId?: string;
  generatedAt?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  if (!payload) {
    return (
      <div className="space-y-4">
        <dl className="grid gap-px overflow-hidden rounded-lg border sm:grid-cols-3">
          <Field label="Case" value={caseId ?? '—'} mono />
          <Field label="Transaction" value={transactionId ?? '—'} mono />
          <Field
            label="Scored at"
            value={generatedAt ? new Date(generatedAt).toLocaleString() : '—'}
          />
        </dl>
        <EmptyState
          title="The original payload is not part of the stored record"
          body="This case was scored before you opened it. The API returns the reasoned case, not the request body that produced it, so there are no submitted field values to show here. Score a transaction in the Live Analyzer to watch this stage with real values."
        />
      </div>
    );
  }

  const keys = Object.keys(payload);
  const named = keys.filter((k) => describeFeature(k).kind === 'named');
  const shown = expanded ? keys : keys.slice(0, 24);

  return (
    <div className="space-y-4">
      <dl className="grid gap-px overflow-hidden rounded-lg border sm:grid-cols-3">
        <Field label="Fields submitted" value={keys.length.toLocaleString()} numeral />
        <Field label="Human-named among them" value={String(named.length)} numeral />
        <Field label="Transaction" value={transactionId ?? '—'} mono />
      </dl>

      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Stamp className="text-foreground">Submitted values</Stamp>
          {keys.length > 24 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="stamp text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded focus-visible:ring-3 focus-visible:outline-none"
            >
              {expanded ? 'Show fewer' : `Show all ${keys.length.toLocaleString()}`}
            </button>
          )}
        </div>
        <div className="border-border max-h-72 overflow-auto rounded-lg border">
          <table className="w-full text-left">
            <thead className="bg-inset sticky top-0">
              <tr>
                <th className="stamp text-muted-foreground px-3 py-2 font-normal">Field</th>
                <th className="stamp text-muted-foreground px-3 py-2 text-right font-normal">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {shown.map((k) => (
                <tr key={k}>
                  <td className="text-foreground/85 px-3 py-1.5 font-mono text-[11px]">{k}</td>
                  <td className="text-muted-foreground px-3 py-1.5 text-right font-mono text-[11px] tabular-nums">
                    {formatValue(payload[k])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!expanded && keys.length > 24 && (
          <p className="text-muted-foreground text-xs">
            Showing the first 24 of {keys.length.toLocaleString()} fields.
          </p>
        )}
      </div>
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return v.toLocaleString();
    return v.toFixed(4);
  }
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  const s = String(v);
  return s.length > 28 ? `${s.slice(0, 28)}…` : s;
}

function Field({
  label,
  value,
  mono,
  numeral,
}: {
  label: string;
  value: string;
  mono?: boolean;
  numeral?: boolean;
}) {
  return (
    <div className="bg-card space-y-1 px-3 py-2.5">
      <dt className="stamp">{label}</dt>
      <dd
        className={[
          'text-foreground truncate',
          numeral ? 'numeral text-lg leading-none font-semibold' : 'text-sm',
          mono ? 'font-mono text-[12px]' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
