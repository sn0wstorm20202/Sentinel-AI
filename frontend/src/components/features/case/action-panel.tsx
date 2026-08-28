'use client';

/**
 * Stage 06 content — the recommended action and the analyst summary.
 *
 * Two things the old panel got wrong. It showed every action behind an amber
 * warning triangle, so a routine "Manual Review" looked as urgent as "Freeze
 * Account"; and it printed the summary with no indication of where the sentence
 * came from, which invites the assumption that a language model wrote it.
 *
 * It did not. `NaturalLanguageEngine` templates fixed sentences around values the
 * other engines produced — its own docstring says it "never interacts directly
 * with raw SHAP tensors". That is worth stating out loud: a templated summary
 * cannot invent a fact, which is the property you want in something an
 * institution has to defend.
 *
 * This panel also shows how the action was selected, because the selection is a
 * short and completely traceable chain:
 *
 *   typologies matched → AML policies that require them → actions
 *   nothing matched    → tier-only fallback
 *
 * A reader who saw stage 05 return nothing should be able to see, here, exactly
 * what that caused.
 */

import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Stamp } from '@/components/ui/risk';
import { riskMeta } from '@/lib/risk';
import { EmptyState } from '@/components/features/case/evidence-panel';
import type { InvestigationCase } from '@/types';

type Recommendation = NonNullable<InvestigationCase['action_engine']['recommendations']>[number];

/** Lower numbers are more urgent. 99 is the engine's "nothing needed" priority. */
function urgency(priority: number): { label: string; tone: string } {
  if (priority <= 1) return { label: 'Do this first', tone: 'text-risk-critical' };
  if (priority <= 3) return { label: `Then this`, tone: 'text-risk-high' };
  if (priority >= 99) return { label: 'No escalation', tone: 'text-risk-approve' };
  return { label: 'Follow-up', tone: 'text-risk-elevated' };
}

export function ActionPanel({
  recommendations,
  summary,
  tier,
  typologyCount,
  skipped,
}: {
  recommendations: Recommendation[] | undefined;
  summary: InvestigationCase['intelligence']['natural_language_summary'];
  tier: unknown;
  /** How many typologies stage 05 matched. Determines which selection path ran. */
  typologyCount: number;
  skipped?: boolean;
}) {
  const meta = riskMeta(tier);

  if (skipped) {
    return (
      <EmptyState
        title="No action was recommended"
        body="No case is opened at this tier, so the engine did not select an action. The transaction settles normally."
      />
    );
  }

  const actions = [...(recommendations ?? [])].sort((a, b) => a.priority - b.priority);
  const summaryText =
    typeof summary === 'string' ? summary : (summary?.hypothesis_explanation ?? null);
  const fromFallback = typologyCount === 0;

  return (
    <div className="space-y-6">
      {/* ---- The action ------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Stamp className="text-foreground">Recommended action</Stamp>
          <span className="text-muted-foreground font-mono text-[11px]">
            {actions.length} action{actions.length === 1 ? '' : 's'} · most urgent first
          </span>
        </div>

        {actions.length === 0 ? (
          <EmptyState
            title="The engine returned no actions"
            body="The response contained an empty recommendation set. That is unexpected at this tier — the engine has a tier-only fallback that should always produce at least one action."
          />
        ) : (
          <ol className="space-y-2">
            {actions.map((a, i) => {
              const u = urgency(a.priority);
              const first = i === 0;
              return (
                <li
                  key={`${a.priority}-${a.action}`}
                  className={cn(
                    'rounded-lg border px-4 py-3',
                    first ? 'border-border bg-inset' : 'border-border/70 bg-card',
                  )}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h4
                      className={cn(
                        'font-display font-semibold',
                        first ? 'text-foreground text-lg' : 'text-foreground/90 text-base',
                      )}
                    >
                      {a.action}
                    </h4>
                    <span className={cn('stamp', u.tone)}>{u.label}</span>
                  </div>
                  <p className="text-muted-foreground mt-1 max-w-[70ch] text-sm leading-relaxed">
                    {a.reason}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* ---- How it was selected --------------------------------------- */}
      <section className="border-border space-y-3 border-t pt-4">
        <Stamp className="text-foreground">How this was selected</Stamp>

        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <ChainStep
            label="Typologies matched"
            value={String(typologyCount)}
            dim={typologyCount === 0}
          />
          <ChainArrow />
          <ChainStep
            label="AML policies that fired"
            value={fromFallback ? '0' : 'matched'}
            dim={fromFallback}
          />
          <ChainArrow />
          <ChainStep
            label={fromFallback ? 'Tier-only fallback' : 'Policy actions'}
            value={fromFallback ? meta.label : `${actions.length}`}
            highlight
          />
        </ol>

        <p className="text-muted-foreground max-w-[74ch] text-sm leading-relaxed">
          {fromFallback ? (
            <>
              Every policy in the AML set requires <em className="not-italic">both</em> a risk tier
              and a named typology. Stage 05 matched no typology, so no policy could fire, and the
              action came from the engine&apos;s tier-only fallback instead — the safe default for a{' '}
              <span className={meta.text}>{meta.label}</span> transaction. The action is correct for
              the tier; it is just not policy-specific, and it would be dishonest to present it as
              though a named rule had been triggered.
            </>
          ) : (
            <>
              A documented AML policy matched both the risk tier and the typology from stage 05, so
              the actions above come from that policy&apos;s own text, with its stated reason
              attached to each one.
            </>
          )}
        </p>
        <p className="text-muted-foreground-subtle font-mono text-[11px] break-words">
          src/fie/RecommendationEngine.py · knowledge/aml_policies.json
        </p>
      </section>

      {/* ---- The analyst summary --------------------------------------- */}
      {summaryText && (
        <section className="border-border space-y-2 border-t pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Stamp className="text-foreground">Analyst summary</Stamp>
            <span className="text-muted-foreground font-mono text-[11px]">
              templated · not generated
            </span>
          </div>
          <blockquote className="border-foreground/20 max-w-[74ch] border-l-2 pl-4">
            <p className="text-foreground/90 text-sm leading-relaxed">{stripMarkdown(summaryText)}</p>
          </blockquote>
          <p className="text-muted-foreground max-w-[74ch] text-xs leading-relaxed">
            This sentence is assembled from a fixed template around values the earlier stages
            produced. No language model writes it, which means it cannot introduce a claim the
            evidence does not contain — the property you need when a decision has to be defended
            later.
          </p>
          <p className="text-muted-foreground-subtle font-mono text-[11px]">
            src/fie/NaturalLanguageEngine.py
          </p>
        </section>
      )}
    </div>
  );
}

function ChainStep({
  label,
  value,
  dim,
  highlight,
}: {
  label: string;
  value: string;
  dim?: boolean;
  highlight?: boolean;
}) {
  return (
    <li
      className={cn(
        'rounded-md border px-2.5 py-1.5',
        highlight ? 'border-foreground/30 bg-inset' : 'border-border',
        dim && !highlight && 'border-dashed',
      )}
    >
      {/*
        A dim step is one that produced nothing — no typologies matched, or the
        tier-only fallback fired. That is not a disabled control, it is the
        answer to "why did this case get no policy actions?", so the text stays
        readable and the dashed border does the de-emphasising on its own.
      */}
      <div className={cn('stamp', dim && !highlight ? 'text-muted-foreground-subtle' : undefined)}>
        {label}
      </div>
      <div
        className={cn(
          'font-mono text-xs',
          dim && !highlight ? 'text-muted-foreground' : 'text-foreground',
        )}
      >
        {value}
      </div>
    </li>
  );
}

function ChainArrow() {
  return (
    <li aria-hidden className="text-muted-foreground/40">
      <ArrowRight className="size-3.5" />
    </li>
  );
}

/**
 * The engine emits `**bold**` markers for a Markdown renderer the old UI never
 * had, so they were printed literally. Rather than pull in a Markdown parser for
 * one templated sentence, strip the markers — the wording is unchanged.
 */
function stripMarkdown(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, '$1').trim();
}
