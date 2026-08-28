/**
 * Risk tiers — the single source of truth.
 *
 * Before this file existed the codebase mapped tiers to colours in four
 * different places, each disagreeing with the others: the queue table treated
 * High as `secondary`, the case header collapsed everything that was not
 * Critical into one variant, the workspace tabs used `outline`, and the
 * hypothesis panel rendered *every* tier in destructive red — so a cleared
 * transaction appeared in full alarm colour. Four tiers rendered as three
 * visual states, inconsistently.
 *
 * Everything risk-coloured in the UI now reads from here.
 *
 * The tiers come from the backend's `threshold_policy.json` and are assigned by
 * `FraudDecisionEngine`; the frontend never derives a tier from a score, it
 * only renders the tier the engine reports.
 */

export const RISK_TIERS = ['Approve', 'Elevated', 'High', 'Critical'] as const;

export type RiskTier = (typeof RISK_TIERS)[number];

export interface RiskTierMeta {
  tier: RiskTier;
  /** Upper-case classification stamp. */
  label: string;
  /** What this tier means, in plain language, for someone who has never seen the product. */
  meaning: string;
  /** The institutional action the tier implies. */
  directive: string;
  /**
   * Whether `SentinelOrchestrator.process_transaction` runs the full reasoning
   * chain at this tier. Approve and Elevated short-circuit immediately after
   * scoring — SHAP attribution and the FIE chain are skipped by design to save
   * compute. This is a real property of the backend, and the UI states it
   * rather than pretending the stages ran and returned nothing.
   */
  reasons: boolean;
  /** Position on the thermal cool-to-hot ramp, 0..1. Drives the meter needle. */
  ramp: number;
  /** Tailwind class fragments. Never hand-pick a risk colour outside this file. */
  text: string;
  bg: string;
  bgStrong: string;
  border: string;
  fill: string;
  /** Raw CSS custom property, for canvas/ECharts/React Flow which cannot use classes. */
  cssVar: string;
}

export const RISK_META: Record<RiskTier, RiskTierMeta> = {
  Approve: {
    tier: 'Approve',
    label: 'APPROVE',
    meaning: 'The model is confident this transaction is legitimate.',
    directive: 'Let it through. No analyst time required.',
    reasons: false,
    ramp: 0.06,
    text: 'text-risk-approve',
    bg: 'bg-risk-approve/10',
    bgStrong: 'bg-risk-approve/20',
    border: 'border-risk-approve/35',
    fill: 'bg-risk-approve',
    cssVar: 'var(--risk-approve)',
  },
  Elevated: {
    tier: 'Elevated',
    label: 'ELEVATED',
    meaning: 'Slightly unusual, but below the review threshold.',
    directive: 'Approve and keep monitoring. No case is opened.',
    reasons: false,
    ramp: 0.36,
    text: 'text-risk-elevated',
    bg: 'bg-risk-elevated/10',
    bgStrong: 'bg-risk-elevated/20',
    border: 'border-risk-elevated/35',
    fill: 'bg-risk-elevated',
    cssVar: 'var(--risk-elevated)',
  },
  High: {
    tier: 'High',
    label: 'HIGH',
    meaning: 'Crosses the review threshold. A human needs to look at this.',
    directive: 'Open a case and investigate before the funds settle.',
    reasons: true,
    ramp: 0.72,
    text: 'text-risk-high',
    bg: 'bg-risk-high/10',
    bgStrong: 'bg-risk-high/20',
    border: 'border-risk-high/35',
    fill: 'bg-risk-high',
    cssVar: 'var(--risk-high)',
  },
  Critical: {
    tier: 'Critical',
    label: 'CRITICAL',
    meaning: 'The model is near-certain this is fraud.',
    directive: 'Freeze the account now, then investigate.',
    reasons: true,
    ramp: 1,
    text: 'text-risk-critical',
    bg: 'bg-risk-critical/12',
    bgStrong: 'bg-risk-critical/22',
    border: 'border-risk-critical/40',
    fill: 'bg-risk-critical',
    cssVar: 'var(--risk-critical)',
  },
};

/**
 * Coerce whatever the API sent into a known tier.
 *
 * The backend has used both `Approve` and `APPROVE` across artifacts, and some
 * precomputed phase artifacts omit the field entirely. An unrecognised value
 * falls back to Elevated — the neutral middle — rather than silently rendering
 * as the most alarming tier.
 */
export function normalizeTier(value: unknown): RiskTier {
  if (typeof value !== 'string') return 'Elevated';
  const key = value.trim().toLowerCase();
  const match = RISK_TIERS.find((t) => t.toLowerCase() === key);
  if (match) return match;
  // Tolerate a few aliases seen in the phase artifacts.
  if (key === 'approved' || key === 'low' || key === 'clear') return 'Approve';
  if (key === 'medium' || key === 'moderate' || key === 'watch') return 'Elevated';
  if (key === 'severe' || key === 'block' || key === 'freeze') return 'Critical';
  return 'Elevated';
}

export function riskMeta(value: unknown): RiskTierMeta {
  return RISK_META[normalizeTier(value)];
}

/** Order tiers most-severe-first — used for queue sorting and grouping. */
export function tierSeverity(value: unknown): number {
  return RISK_TIERS.indexOf(normalizeTier(value));
}

/**
 * The engine reports `risk_score` on a 0–100 scale and `probability` on 0–1.
 * Both arrive as raw floats: `probability` has been observed at sixteen
 * significant digits, which is meaningless precision for a calibrated model and
 * unreadable in a table. Round for display, and never round in a way that
 * turns a non-zero probability into "0".
 */
export function formatScore(score: number | undefined | null): string {
  if (score === undefined || score === null || Number.isNaN(score)) return '—';
  return score.toFixed(1);
}

export function formatProbability(p: number | undefined | null): string {
  if (p === undefined || p === null || Number.isNaN(p)) return '—';
  if (p > 0 && p < 0.0001) return '<0.01%';
  if (p < 1 && p > 0.9999) return '>99.99%';
  return `${(p * 100).toFixed(2)}%`;
}
