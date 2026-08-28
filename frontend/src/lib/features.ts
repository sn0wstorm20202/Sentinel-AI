/**
 * Feature labelling.
 *
 * The champion model has 3,574 input columns, of which only nine carry
 * human-readable names. The rest are `F<n>` columns from an anonymised source
 * dataset, plus two derived families: `F<n>_Log1p` (log-scaled) and
 * `F<n>_is_missing` (a missingness indicator — the fact that a value was absent
 * is itself predictive).
 *
 * The previous UI printed raw identifiers like `F3898` into an "Evidence Log"
 * with no explanation, which tells a reader nothing. It cannot be fixed by
 * inventing friendly names — the underlying semantics genuinely are not
 * published. So this file does the only honest thing: it names what it can, and
 * for everything else it says plainly that the column is anonymised and what
 * kind of anonymised column it is.
 */

const NAMED: Record<string, string> = {
  Account_Year: 'Calendar year the account was opened',
  Account_Month: 'Calendar month the account was opened',
  Account_Quarter: 'Calendar quarter the account was opened',
  Account_Weekday: 'Day of the week the account was opened',
  Account_Age_Days: 'Account age in days at the time of the transaction',
  Account_Age_Years: 'Account age in years at the time of the transaction',
  Account_Tenure_Bucket: 'Account tenure, grouped into bands',
  Retail_Flag: 'Whether the customer is retail rather than corporate',
  Retail_Tenure_Interaction: 'Retail status combined with tenure (engineered interaction term)',
};

export type FeatureKind = 'named' | 'anonymised' | 'log-scaled' | 'missingness';

export interface FeatureLabel {
  /** The raw column name, always shown — it is the real identifier. */
  id: string;
  kind: FeatureKind;
  /** Short kind stamp, e.g. "ANONYMISED". */
  kindLabel: string;
  /** One line describing what the column is, honestly. */
  description: string;
}

export function describeFeature(id: string): FeatureLabel {
  if (NAMED[id]) {
    return { id, kind: 'named', kindLabel: 'DERIVED', description: NAMED[id] };
  }

  const missing = /^F(\d+)_is_missing$/.exec(id);
  if (missing) {
    return {
      id,
      kind: 'missingness',
      kindLabel: 'MISSINGNESS',
      description: `Whether anonymised column F${missing[1]} was absent from the source record. Absence itself carries signal.`,
    };
  }

  const log = /^F(\d+)_Log1p$/.exec(id);
  if (log) {
    return {
      id,
      kind: 'log-scaled',
      kindLabel: 'LOG-SCALED',
      description: `Log-scaled value of anonymised column F${log[1]}, compressed so that extreme values do not dominate.`,
    };
  }

  if (/^F\d+$/.test(id)) {
    return {
      id,
      kind: 'anonymised',
      kindLabel: 'ANONYMISED',
      description:
        'An anonymised behavioural column from the source dataset. Its business meaning is not published, so the model can show how much it mattered but not what it measures.',
    };
  }

  return {
    id,
    kind: 'anonymised',
    kindLabel: 'FEATURE',
    description: 'A model input column.',
  };
}

/**
 * What a signed SHAP value means, in words. Direction is *which way* a feature
 * pushed the score — it is not a severity rating, and the previous UI conflated
 * the two, printing "Critical" for every feature that pushed the score up.
 */
export function describeDirection(direction: string | undefined): {
  label: string;
  meaning: string;
  towardsFraud: boolean;
} {
  const towardsFraud = (direction ?? '').toLowerCase() === 'positive';
  return towardsFraud
    ? {
        label: 'RAISED',
        meaning: 'This feature pushed the score towards fraud.',
        towardsFraud: true,
      }
    : {
        label: 'LOWERED',
        meaning: 'This feature pushed the score away from fraud.',
        towardsFraud: false,
      };
}
