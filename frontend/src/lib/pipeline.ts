/**
 * The six-stage decision pipeline.
 *
 * This file is the narrative spine of the product. Sentinel AI is not a
 * black-box scorer: it scores a transaction and then shows its work. Each stage
 * below corresponds to a real, named component of the backend, in the order
 * `SentinelOrchestrator.process_transaction()` invokes it.
 *
 * The copy here is written for someone who has never seen the product. It says
 * what happens, where it happens, and what happens next — because a screen full
 * of SHAP values means nothing to a reader who does not yet know that a model
 * ran, that it was calibrated, or that a threshold was applied.
 *
 * Nothing here is invented. Where the API does not report a value, the stage
 * says so rather than filling the gap.
 */

import type { InvestigationCase } from '@/types';
import { normalizeTier, type RiskTier } from '@/lib/risk';

export const STAGE_IDS = [
  'ingest',
  'align',
  'score',
  'attribute',
  'hypothesize',
  'act',
] as const;

export type StageId = (typeof STAGE_IDS)[number];

export type StageState = 'pending' | 'running' | 'done' | 'skipped' | 'failed';

/**
 * Real operating constants, copied from the repository's config files. Cited
 * rather than guessed so the UI can explain *why* the threshold is where it is.
 *   configs/threshold_policy.json  → optimal_threshold
 *   configs/business_config.json   → false_positive_cost / false_negative_cost
 */
export const OPERATING_THRESHOLD = 0.039696969696969696;
export const COST_FALSE_POSITIVE = 50;
export const COST_FALSE_NEGATIVE = 5000;
export const COST_MANUAL_REVIEW = 25;

export interface StageDef {
  id: StageId;
  /** Two-digit ordinal. The content genuinely is a sequence, so it is numbered. */
  n: string;
  /** Upper-case stamp used on the rail. */
  name: string;
  /** Active-voice headline: what this stage does. */
  headline: string;
  /** Plain-English explanation, for a first-time reader. */
  what: string;
  /** Where it happens in the backend. Real module and class names. */
  engine: string;
  /** What follows. Answers "what next?" without the reader having to guess. */
  next: string;
}

export const STAGES: Record<StageId, StageDef> = {
  ingest: {
    id: 'ingest',
    n: '01',
    name: 'Ingest',
    headline: 'Accept the transaction',
    what:
      'A transaction arrives as JSON: an identifier, a timestamp, and a bag of raw feature values. Nothing is judged yet. The API only checks that the envelope is well formed.',
    engine: 'src/api/InvestigatorAPI.py · POST /api/v1/cases/explain',
    next: 'Next, the payload is reshaped to the exact schema the model was trained on.',
  },
  align: {
    id: 'align',
    n: '02',
    name: 'Align',
    headline: 'Reshape it to the model’s schema',
    what:
      'The champion model was trained on one exact, ordered list of columns. Fields it does not recognise are dropped. Fields it expects but did not receive are filled with NaN, which XGBoost handles natively rather than guessing a value. This single function is why the score and the explanation can never disagree — scoring and SHAP both read the same aligned row. A payload containing none of the expected columns is rejected outright with a 400.',
    engine: 'src/engine/FraudDecisionEngine.py · align_features()',
    next: 'Next, the aligned row is scored.',
  },
  score: {
    id: 'score',
    n: '03',
    name: 'Score',
    headline: 'Score it and assign a tier',
    what:
      'A calibrated XGBoost model returns a fraud probability — calibrated meaning 0.90 is intended to mean nine times out of ten, not merely "high". That probability is compared against the operating threshold, which was chosen from the cost of being wrong in each direction, not from a round number.',
    engine: 'models/champion_model_calibrated.pkl · configs/threshold_policy.json',
    next: 'Next, the engine explains the score it just produced.',
  },
  attribute: {
    id: 'attribute',
    n: '04',
    name: 'Attribute',
    headline: 'Work out which features drove it',
    what:
      'SHAP computes, for this one transaction, how much each individual feature pushed the score up or down. EvidenceEngine ranks those contributions and turns raw numbers into structured, citable facts. This is the stage that answers "why this transaction?" rather than "what does the model do in general?".',
    engine: 'src/fie/EvidenceEngine.py · SHAP TreeExplainer',
    next: 'Next, the evidence is tested against known fraud typologies.',
  },
  hypothesize: {
    id: 'hypothesize',
    n: '05',
    name: 'Hypothesise',
    headline: 'Match it against known fraud patterns',
    what:
      'The evidence is checked against a library of documented typologies — account takeover, mule networks, synthetic identity — loaded from the knowledge base. A typology is only proposed when the evidence it requires is actually present, so silence here is a real finding rather than a failure.',
    engine: 'src/fie/HypothesisEngine.py · knowledge/fraud_typologies.json',
    next: 'Next, the findings are converted into an instruction someone can act on.',
  },
  act: {
    id: 'act',
    n: '06',
    name: 'Act',
    headline: 'Decide what should happen',
    what:
      'RecommendationEngine selects institutional actions for this tier from the AML policy set, and NaturalLanguageEngine writes the summary an analyst reads first. The output is a complete dossier: a score, the evidence behind it, and a recommended action with its reason attached.',
    engine: 'src/fie/RecommendationEngine.py · src/fie/NaturalLanguageEngine.py',
    next: 'The case is complete and ready for an analyst to act on.',
  },
};

export const STAGE_LIST: StageDef[] = STAGE_IDS.map((id) => STAGES[id]);

/** A stage plus everything known about this particular run of it. */
export interface StageRun extends StageDef {
  state: StageState;
  /** Short value shown under the stage on the rail. Falsy renders as a dash. */
  readout: string;
  /** Why the stage is in this state, when that is not self-evident. */
  note?: string;
}

export interface DeriveOptions {
  /**
   * Number of feature keys actually submitted. Only known when this UI issued
   * the POST itself; a case fetched by id was scored before the page loaded.
   */
  submittedCount?: number;
  /** Alignment counts, computed client-side against the published schema. */
  alignment?: { matched: number; dropped: number; filled: number; total: number };
  /** How far a live run has progressed. Stages after this are pending. */
  upTo?: StageId;
}

function countHypotheses(c: InvestigationCase | undefined | null): number {
  if (!c) return 0;
  const i = c.intelligence ?? {};
  return (i.hypotheses ?? i.fraud_hypotheses ?? []).length;
}

function countRecommendations(c: InvestigationCase | undefined | null): number {
  if (!c) return 0;
  const a = c.action_engine ?? {};
  return (a.recommendations ?? a.recommended_actions ?? []).length;
}

function countEvidence(c: InvestigationCase | undefined | null): number {
  return c?.intelligence?.evidence?.length ?? 0;
}

/**
 * Turn a completed case into six stage runs.
 *
 * The important honest distinction this encodes: for an Approve or Elevated
 * transaction the orchestrator *short-circuits* — stages 04 to 06 never run,
 * deliberately, to avoid paying for SHAP on traffic nobody will review. Those
 * stages are marked `skipped`, not `done`-with-zero-results. Conflating the two
 * would tell the reader the engine looked and found nothing, when in fact it
 * never looked.
 */
export function deriveStages(
  c: InvestigationCase | undefined | null,
  opts: DeriveOptions = {},
): StageRun[] {
  const tier: RiskTier = normalizeTier(c?.risk_assessment?.risk_tier);
  const shortCircuited = tier === 'Approve' || tier === 'Elevated';
  const hasCase = Boolean(c);

  const evidence = countEvidence(c);
  const hypotheses = countHypotheses(c);
  const recommendations = countRecommendations(c);

  const alignment = opts.alignment;

  const runs: StageRun[] = [
    {
      ...STAGES.ingest,
      state: hasCase ? 'done' : 'pending',
      readout: opts.submittedCount
        ? `${opts.submittedCount.toLocaleString()} fields`
        : c?.metadata?.transaction_id ?? '—',
      note: opts.submittedCount
        ? undefined
        : hasCase
          ? 'This case was scored before you opened it, so its original payload is not part of the stored record. The Live Analyzer shows this stage with real submitted values.'
          : undefined,
    },
    {
      ...STAGES.align,
      state: hasCase ? 'done' : 'pending',
      readout: alignment
        ? `${alignment.matched.toLocaleString()} matched`
        : hasCase
          ? 'not reported'
          : '—',
      note: alignment
        ? undefined
        : hasCase
          ? 'The API does not return per-field alignment counts for a stored case. Run a transaction through the Live Analyzer to see this stage measured.'
          : undefined,
    },
    {
      ...STAGES.score,
      state: hasCase ? 'done' : 'pending',
      readout: hasCase ? tier.toUpperCase() : '—',
    },
    {
      ...STAGES.attribute,
      state: !hasCase ? 'pending' : shortCircuited ? 'skipped' : 'done',
      readout: shortCircuited
        ? 'skipped'
        : hasCase
          ? `${evidence} feature${evidence === 1 ? '' : 's'}`
          : '—',
      note: shortCircuited
        ? `The engine stops after scoring for ${tier} transactions. SHAP attribution is expensive and nobody reviews traffic at this tier, so it is deliberately not computed.`
        : evidence === 0
          ? 'The attribution stage ran but returned no ranked features for this case.'
          : undefined,
    },
    {
      ...STAGES.hypothesize,
      state: !hasCase ? 'pending' : shortCircuited ? 'skipped' : 'done',
      readout: shortCircuited
        ? 'skipped'
        : hasCase
          ? `${hypotheses} matched`
          : '—',
      note: shortCircuited
        ? 'Not reached — the engine short-circuited after scoring.'
        : hypotheses === 0
          ? 'The typology library was searched and nothing matched. The evidence for this case is anonymised behavioural features that do not map to a documented pattern, so the engine reports a baseline deviation instead of naming a scheme it cannot support.'
          : undefined,
    },
    {
      ...STAGES.act,
      state: !hasCase ? 'pending' : shortCircuited ? 'skipped' : 'done',
      readout: shortCircuited
        ? 'skipped'
        : hasCase
          ? `${recommendations} action${recommendations === 1 ? '' : 's'}`
          : '—',
      note: shortCircuited
        ? 'No action is recommended because no case is opened at this tier.'
        : undefined,
    },
  ];

  // A live run in progress: everything after `upTo` has not happened yet.
  if (opts.upTo) {
    const limit = STAGE_IDS.indexOf(opts.upTo);
    return runs.map((r, i) => {
      if (i < limit) return r;
      if (i === limit) return { ...r, state: 'running' as StageState };
      return { ...r, state: 'pending' as StageState, readout: '—', note: undefined };
    });
  }

  return runs;
}

/** Human summary of a trail, e.g. "6 stages · 3 ran · 3 skipped". */
export function trailSummary(runs: StageRun[]): string {
  const ran = runs.filter((r) => r.state === 'done').length;
  const skipped = runs.filter((r) => r.state === 'skipped').length;
  const parts = [`${runs.length} stages`, `${ran} ran`];
  if (skipped) parts.push(`${skipped} skipped`);
  return parts.join(' · ');
}

/* -------------------------------------------------------------------------- */
/* Schema alignment, computed client-side.                                    */
/*                                                                            */
/* `public/schema/champion-features.json` is a snapshot of the deployed        */
/* model's `feature_names_in_`. Comparing a payload against it performs the    */
/* same set operation `align_features()` performs server-side, which lets the  */
/* Align stage show a measured result instead of only a description.           */
/* -------------------------------------------------------------------------- */

export interface ChampionSchema {
  model: string;
  estimator: string;
  n_features: number;
  named_features: string[];
  features: string[];
}

let schemaPromise: Promise<ChampionSchema> | null = null;

export function loadChampionSchema(): Promise<ChampionSchema> {
  schemaPromise ??= fetch('/schema/champion-features.json').then((r) => {
    if (!r.ok) throw new Error(`Could not load the model schema (${r.status}).`);
    return r.json() as Promise<ChampionSchema>;
  });
  return schemaPromise;
}

export function computeAlignment(
  payload: Record<string, unknown>,
  schema: ChampionSchema,
): { matched: number; dropped: number; filled: number; total: number; droppedKeys: string[] } {
  const expected = new Set(schema.features);
  const submitted = Object.keys(payload);
  const droppedKeys = submitted.filter((k) => !expected.has(k));
  const matched = submitted.length - droppedKeys.length;
  return {
    matched,
    dropped: droppedKeys.length,
    filled: expected.size - matched,
    total: expected.size,
    droppedKeys,
  };
}
