/**
 * The typology library, and why it so rarely matches.
 *
 * This file exists because "0 hypotheses" is the most misleading thing the API
 * returns. It reads as a failure. It is not — it is the correct output of a
 * search that genuinely found nothing, and the reason is precise enough to state
 * exactly.
 *
 * `HypothesisEngine.generate_hypotheses()` does this:
 *
 *   1. For each piece of SHAP evidence, look up the feature's *concept* in
 *      knowledge/feature_metadata.json.
 *   2. Unmapped features raise KnowledgeBaseError and are skipped.
 *   3. A typology is proposed if at least one of its required concepts was
 *      observed among the mapped evidence.
 *
 * The whole thing therefore hinges on step 1. The knowledge base maps 11 feature
 * IDs to concepts — and of those 11, only four (F1863, F921, F330, F2041) are
 * actually columns in the deployed model. The remaining seven (F9000–F9006) are
 * placeholder identifiers that can never appear in evidence.
 *
 * So a typology can only ever be proposed when one of four specific columns, out
 * of 3,574, lands in the top five SHAP contributors. It usually does not. That is
 * a coverage gap in the knowledge base, not a defect in the model or a bug in the
 * matcher, and the interface says so rather than leaving a blank panel.
 *
 * Sources — verified, not assumed:
 *   knowledge/fraud_typologies.json
 *   knowledge/feature_metadata.json
 *   src/fie/HypothesisEngine.py
 *   frontend/public/schema/champion-features.json  (membership check)
 */

export interface Typology {
  id: string;
  name: string;
  description: string;
  /** Conceptual features the pattern needs to see. */
  requires: string[];
}

export const TYPOLOGIES: Typology[] = [
  {
    id: 'TYP_001',
    name: 'Dormant Account Abuse',
    description:
      'An account with historically low activity suddenly initiates high-velocity or high-value transfers.',
    requires: ['Transaction Velocity', 'Account Age', 'Amount Deviation'],
  },
  {
    id: 'TYP_002',
    name: 'Synthetic Identity',
    description:
      'An account exhibiting behaviours indicative of non-human or artificially constructed profiles.',
    requires: ['Identity Consistency', 'Credit Inquiry Frequency', 'Address Volatility'],
  },
  {
    id: 'TYP_003',
    name: 'Account Takeover',
    description:
      'Sudden deviation in geographical or device origin combined with immediate fund transfers.',
    requires: ['Geographical Risk', 'Device ID Change', 'Time of Day Deviation'],
  },
  {
    id: 'TYP_004',
    name: 'Money Mule Network',
    description:
      'Rapid succession of incoming deposits followed immediately by outbound transfers to multiple accounts.',
    requires: ['Inbound/Outbound Ratio', 'Transaction Velocity', 'Counterparty Diversity'],
  },
];

/**
 * Feature ID → concept, exactly as the knowledge base has it. `live` records
 * whether the ID is a real column in the deployed model — seven of the eleven
 * are not, which is the crux of the coverage gap.
 */
export const CONCEPT_MAP: Array<{ id: string; concept: string; live: boolean }> = [
  { id: 'F1863', concept: 'Transaction Velocity', live: true },
  { id: 'F921', concept: 'Geographical Risk', live: true },
  { id: 'F330', concept: 'Amount Deviation', live: true },
  { id: 'F2041', concept: 'Account Age', live: true },
  { id: 'F9000', concept: 'Identity Consistency', live: false },
  { id: 'F9001', concept: 'Credit Inquiry Frequency', live: false },
  { id: 'F9002', concept: 'Address Volatility', live: false },
  { id: 'F9003', concept: 'Device ID Change', live: false },
  { id: 'F9004', concept: 'Time of Day Deviation', live: false },
  { id: 'F9005', concept: 'Inbound/Outbound Ratio', live: false },
  { id: 'F9006', concept: 'Counterparty Diversity', live: false },
];

export const MAPPED_LIVE_COUNT = CONCEPT_MAP.filter((c) => c.live).length;
export const MODEL_COLUMN_COUNT = 3574;

/** Which concepts a set of evidence feature IDs resolves to. */
export function observedConcepts(featureIds: string[]): string[] {
  const byId = new Map(CONCEPT_MAP.map((c) => [c.id, c.concept]));
  const seen: string[] = [];
  for (const id of featureIds) {
    const concept = byId.get(id);
    if (concept && !seen.includes(concept)) seen.push(concept);
  }
  return seen;
}
