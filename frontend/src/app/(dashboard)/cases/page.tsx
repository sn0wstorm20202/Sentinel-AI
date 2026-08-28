'use client';

/**
 * THE INVESTIGATION QUEUE.
 *
 * What this replaces, and why:
 *
 *   • A 25%-wide table permanently docked beside every case, inside a
 *     `ResizablePanelGroup` with `overflow-hidden` and a hard-coded
 *     `h-[calc(100vh-48px)]`. Columns truncated, the case beside it squeezed into
 *     70% of the viewport, and neither surface able to scroll. Both the queue and
 *     the dossier now get the full width.
 *
 *   • Sorting that was configured but never wired. `getSortedRowModel()` was
 *     passed to the table and the headers had no click handler, so every column
 *     looked sortable and none was. The headers here are real buttons and carry
 *     `aria-sort`.
 *
 *   • `variant={risk === 'Critical' ? 'destructive' : 'outline'}`, which folded
 *     four tiers into two. Tier now comes from the single source of truth in
 *     `lib/risk.ts`.
 *
 * A queue is a triage surface, so the first thing on it is the shape of the
 * workload — how many cases sit at each tier — before any individual row.
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';

import { useCases } from '@/lib/api/hooks/use-cases';
import { useInvestigationStore } from '@/store/investigation-store';
import { cn } from '@/lib/utils';
import {
  RISK_TIERS,
  normalizeTier,
  riskMeta,
  tierSeverity,
  formatScore,
  type RiskTier,
} from '@/lib/risk';
import { RiskDot, Stamp } from '@/components/ui/risk';
import { Skeleton } from '@/components/ui/skeleton';
import type { CaseSummary } from '@/types';

type SortKey = 'risk' | 'score' | 'id' | 'date' | 'status';
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: string; align?: 'right'; className?: string }[] = [
  { key: 'risk', label: 'Tier' },
  { key: 'id', label: 'Case' },
  { key: 'score', label: 'Score', align: 'right' },
  { key: 'date', label: 'Scored', className: 'hidden md:table-cell' },
  { key: 'status', label: 'Status', className: 'hidden sm:table-cell' },
];

export default function QueuePage() {
  const router = useRouter();
  const { data: cases, isLoading, error } = useCases();

  const [query, setQuery] = React.useState('');
  const [tierFilter, setTierFilter] = React.useState<RiskTier | 'all'>('all');
  const [sort, setSort] = React.useState<{ key: SortKey; dir: SortDir }>({
    key: 'risk',
    dir: 'desc',
  });

  const recent = useInvestigationStore((s) => s.recentCases);
  const pinned = useInvestigationStore((s) => s.pinnedInvestigations);

  const all = cases ?? [];

  /** Real counts per tier. Nothing here is estimated. */
  const counts = React.useMemo(() => {
    const c: Record<RiskTier, number> = { Approve: 0, Elevated: 0, High: 0, Critical: 0 };
    for (const item of all) c[normalizeTier(item.risk)] += 1;
    return c;
  }, [all]);

  const needsReview = counts.High + counts.Critical;

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = all.filter((item) => {
      if (tierFilter !== 'all' && normalizeTier(item.risk) !== tierFilter) return false;
      if (!q) return true;
      return (
        item.id.toLowerCase().includes(q) ||
        item.txId.toLowerCase().includes(q) ||
        item.risk.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
      );
    });

    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sort.key) {
        case 'risk': {
          const d = tierSeverity(a.risk) - tierSeverity(b.risk);
          return (d !== 0 ? d : a.score - b.score) * dir;
        }
        case 'score':
          return (a.score - b.score) * dir;
        case 'date':
          return (Date.parse(a.date) - Date.parse(b.date)) * dir;
        case 'status':
          return a.status.localeCompare(b.status) * dir;
        default:
          return a.id.localeCompare(b.id) * dir;
      }
    });
  }, [all, query, sort, tierFilter]);

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : // Tier and score are most useful highest-first; text ascending.
          { key, dir: key === 'risk' || key === 'score' || key === 'date' ? 'desc' : 'asc' },
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 sm:px-6">
      {/* ---- What this list is ------------------------------------------ */}
      <header className="space-y-3 pt-8 pb-6">
        <Stamp>Investigation queue</Stamp>
        <h1 className="font-display text-foreground max-w-[24ch] text-3xl leading-[1.1] font-semibold tracking-tight sm:text-4xl">
          {isLoading ? (
            <Skeleton className="h-10 w-72" />
          ) : needsReview > 0 ? (
            <>
              {needsReview} transaction{needsReview === 1 ? '' : 's'} need a human.
            </>
          ) : (
            <>Nothing is waiting on a human.</>
          )}
        </h1>
        <p className="text-muted-foreground max-w-[64ch] text-sm leading-relaxed">
          Every transaction the engine scored, highest risk first. Only{' '}
          <span className="text-risk-high">High</span> and{' '}
          <span className="text-risk-critical">Critical</span> get the full reasoning chain — the
          rest settle automatically, and the engine says so rather than pretending to investigate
          them. Open any case to follow the six steps that produced its decision.
        </p>
      </header>

      {/* ---- The shape of the workload ---------------------------------- */}
      <section aria-label="Cases by tier" className="border-border border-y py-4" data-tour="queue">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            {/* Proportional bar: width is share of total, so it cannot mislead. */}
            <div
              className="bg-muted flex h-2 w-full overflow-hidden rounded-full"
              role="img"
              aria-label={RISK_TIERS.map((t) => `${counts[t]} ${t}`).join(', ')}
            >
              {RISK_TIERS.map((t) =>
                counts[t] > 0 ? (
                  <div
                    key={t}
                    className={riskMeta(t).fill}
                    style={{ width: `${(counts[t] / Math.max(1, all.length)) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              <TierChip
                label="All"
                count={all.length}
                active={tierFilter === 'all'}
                onClick={() => setTierFilter('all')}
              />
              {RISK_TIERS.map((t) => (
                <TierChip
                  key={t}
                  tier={t}
                  label={riskMeta(t).label}
                  count={counts[t]}
                  active={tierFilter === t}
                  onClick={() => setTierFilter(tierFilter === t ? 'all' : t)}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ---- Filter ----------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <label className="relative flex-1 sm:max-w-xs">
          <span className="sr-only">Filter the queue by case, transaction, tier or status</span>
          <Search
            className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by case, transaction or status"
            /* `/` and the command palette both look for this. Without it the
               shortcut had nothing on this page to land on. */
            data-sentinel-search="cases"
            /* The placeholder is the only thing that tells you what this box
               accepts, and it is the one piece of text a DOM contrast sweep
               cannot reach — `::placeholder` has no element to measure. It was
               70% alpha on that basis alone. */
            className="border-border bg-card text-foreground placeholder:text-muted-foreground-subtle focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border pl-8 pr-2 text-sm focus-visible:ring-3 focus-visible:outline-none"
          />
        </label>
        <p className="text-muted-foreground font-mono text-[11px]">
          {rows.length === all.length
            ? `${all.length} case${all.length === 1 ? '' : 's'}`
            : `${rows.length} of ${all.length} shown`}
        </p>
      </div>

      {/* ---- The queue -------------------------------------------------- */}
      {error ? (
        <div className="border-border rounded-xl border border-dashed px-6 py-10 text-center">
          <p className="text-foreground text-sm font-medium">The queue could not be loaded</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-[52ch] text-sm leading-relaxed">
            The case list endpoint did not respond. Check that the backend is running on the port the
            dashboard proxies to.
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="border-border rounded-xl border border-dashed px-6 py-10 text-center">
          <p className="text-foreground text-sm font-medium">No case matches this filter</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-[46ch] text-sm leading-relaxed">
            {query ? (
              <>
                Nothing matches <span className="text-foreground font-mono">{query}</span>.
              </>
            ) : (
              <>No case sits at this tier.</>
            )}{' '}
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setTierFilter('all');
              }}
              className="text-foreground underline decoration-dotted underline-offset-2"
            >
              Clear the filter
            </button>
            .
          </p>
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-xl border" data-tour="queue-table">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              Scored transactions, sortable by tier, case, score, time and status
            </caption>
            <thead className="bg-inset">
              <tr>
                {COLUMNS.map((col) => {
                  const active = sort.key === col.key;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={cn('px-3 py-2 font-normal', col.className)}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={cn(
                          'stamp focus-visible:ring-ring/50 inline-flex items-center gap-1 rounded focus-visible:ring-3 focus-visible:outline-none',
                          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                          col.align === 'right' && 'w-full justify-end',
                        )}
                      >
                        {col.label}
                        {active &&
                          (sort.dir === 'asc' ? (
                            <ArrowUp className="size-3" aria-hidden />
                          ) : (
                            <ArrowDown className="size-3" aria-hidden />
                          ))}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {rows.map((item) => (
                <Row
                  key={item.id}
                  item={item}
                  pinned={pinned.includes(item.id)}
                  seen={recent.includes(item.id)}
                  onOpen={() => router.push(`/cases/${item.id}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({
  item,
  pinned,
  seen,
  onOpen,
}: {
  item: CaseSummary;
  pinned: boolean;
  seen: boolean;
  onOpen: () => void;
}) {
  const meta = riskMeta(item.risk);
  const reviewed = meta.tier === 'High' || meta.tier === 'Critical';

  return (
    <tr
      onClick={onOpen}
      className="hover:bg-inset/70 group cursor-pointer transition-colors"
    >
      {/* Tier — a coloured left edge plus the word, never colour alone. */}
      <td className="relative py-2.5 pr-3 pl-3">
        <span
          aria-hidden
          className={cn('absolute inset-y-0 left-0 w-[3px]', reviewed ? meta.fill : 'bg-transparent')}
        />
        <span className="flex items-center gap-2">
          <RiskDot tier={item.risk} />
          <span className={cn('text-sm', reviewed ? meta.text : 'text-muted-foreground')}>
            {meta.label}
          </span>
        </span>
      </td>

      {/* Identity */}
      <td className="px-3 py-2.5">
        <Link
          href={`/cases/${item.id}`}
          onClick={(e) => e.stopPropagation()}
          className="focus-visible:ring-ring/50 rounded font-mono text-sm focus-visible:ring-3 focus-visible:outline-none"
        >
          <span className="text-foreground group-hover:underline group-hover:decoration-dotted group-hover:underline-offset-2">
            {item.id}
          </span>
          <span className="text-muted-foreground ml-2 text-[11px]">{item.txId}</span>
        </Link>
        <div className="mt-0.5 flex items-center gap-2">
          {/*
            Both markers stay legible. The hierarchy between them is real —
            pinning is a decision you made, opening is just history — so it is
            carried by one step of the palette rather than by making the quieter
            one too faint to read.
          */}
          {pinned && <Stamp>Pinned</Stamp>}
          {seen && !pinned && <Stamp className="text-muted-foreground-subtle">Opened</Stamp>}
        </div>
      </td>

      {/* Score, with an inline bar so the number is comparable at a glance. */}
      <td className="px-3 py-2.5 text-right">
        <div className="ml-auto flex w-24 items-center justify-end gap-2">
          <span className="bg-muted relative h-1 flex-1 overflow-hidden rounded-full">
            <span
              className={cn('absolute inset-y-0 left-0 rounded-full', meta.fill)}
              style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }}
            />
          </span>
          <span className={cn('numeral text-sm', reviewed ? meta.text : 'text-muted-foreground')}>
            {formatScore(item.score)}
          </span>
        </div>
      </td>

      <td className="text-muted-foreground hidden px-3 py-2.5 font-mono text-[11px] md:table-cell">
        {item.date}
      </td>

      <td className="hidden px-3 py-2.5 sm:table-cell">
        <span className="text-muted-foreground text-sm">{item.status}</span>
      </td>
    </tr>
  );
}

function TierChip({
  tier,
  label,
  count,
  active,
  onClick,
}: {
  tier?: RiskTier;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const meta = tier ? riskMeta(tier) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'focus-visible:ring-ring/50 group flex items-baseline gap-2 rounded focus-visible:ring-3 focus-visible:outline-none',
        !active && 'opacity-70 hover:opacity-100',
      )}
    >
      <span className={cn('numeral text-xl font-semibold', meta?.text ?? 'text-foreground')}>
        {count}
      </span>
      <span
        className={cn(
          'stamp',
          active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
        )}
      >
        {label}
      </span>
      {active && <span className="bg-foreground/60 h-px w-3 self-center" aria-hidden />}
    </button>
  );
}
