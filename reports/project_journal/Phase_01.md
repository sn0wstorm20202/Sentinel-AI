# Phase 01 — Enterprise Data Audit

## Objective

Conduct a comprehensive audit of the raw bank-fraud dataset to characterize its structure, quality, and statistical properties before any preprocessing or feature engineering begins.

## Methods

- Loaded `data/raw/bank_fraud_dataset.csv` and profiled shape, memory footprint, and dtype distribution.
- Computed missing-value counts at multiple severity thresholds (100%, >95%, >50%, 0%) to guide column-retention decisions.
- Checked for duplicate rows across all columns.
- Inspected the target variable `F3924` for class distribution and identified the degree of class imbalance.
- Tested `F3912` for target leakage by computing correlation with `F3924` and producing a full crosstab of their joint distribution.
- Examined `Unnamed: 0` for monotonicity and correlation with the target to determine whether it is an index artifact.
- Catalogued all eight object-typed columns, enumerating their cardinality, missing counts, and semantic roles.
- Computed skewness across all numeric features to flag distributional extremes.

## Observations

- **Shape**: 9,082 rows × 3,925 columns.
- **Memory**: 288.52 MB in-memory (float64-dominated).
- **Dtype mix**: 3,876 float64, 41 int64, 8 object (string).
- **Duplicates**: Zero duplicate rows detected.
- **Target (`F3924`)**: Binary (0/1). Class 0 = 9,001 (99.11%), Class 1 = 81 (0.89%) — extreme imbalance ratio ≈ 111:1.
- **Missing values**:
  - 63 columns are 100% empty (no non-null values).
  - 361 columns exceed 95% missing.
  - 1,138 columns exceed 50% missing.
  - 90 columns have zero missing values.
- **Target leakage (`F3912`)**: 99.94% value match with `F3924`. Crosstab reveals only 5 mismatched rows out of 9,082, confirming near-perfect leakage.
- **Index artifact (`Unnamed: 0`)**: Monotonically increasing integers 1–9,082 with a 0.16 correlation to the target — a row-index artifact with minor leakage risk.
- **Object columns**:
  - `F2230` — Period cohort label.
  - `F3886` — Account type (17 categories).
  - `F3888` — Date field spanning 1900–2025 (stored as string, requires datetime parsing).
  - `F3889` — Recency band (7 categories).
  - `F3890` — Location type (4 categories).
  - `F3891` — Occupation (7 categories).
  - `F3892` — Gender (M/F/O); 2,598 missing values (28.6%).
  - `F3893` — Customer segment (RETAIL / CORPORATE).
- **Skewness**: Many numeric features exhibit extreme skewness, with absolute skewness values reaching up to 95.29, indicating heavy tails and potential outlier concentrations.

## Challenges

- The dataset's 3,925-column width makes manual inspection infeasible; automated profiling pipelines were required for every quality metric.
- 63 fully empty columns and 361 near-empty columns inflate memory and dimensionality without contributing signal.
- `F3912` masquerades as a legitimate feature but is functionally a copy of the target — this would silently produce a perfect but useless model if left undetected.
- `Unnamed: 0` is a pandas serialization artifact that carries ordinal information correlated with data collection sequence, creating a subtle leakage channel.
- The 111:1 class imbalance in `F3924` means standard accuracy metrics will be misleading; specialized handling is required during modeling.
- `F3888` is stored as a raw string instead of a proper datetime type, blocking temporal feature extraction.
- `F3892` (gender) has 28.6% missing values, requiring a domain-informed imputation strategy rather than naive fill.

## Fixes

- Flagged 63 fully empty columns for removal in Phase 2 preprocessing.
- Flagged 361 columns with >95% missing for removal — these carry insufficient signal to justify imputation overhead.
- Marked `Unnamed: 0` for removal as a confirmed index artifact with leakage risk.
- Marked `F3912` for removal as confirmed target leakage (99.94% match with `F3924`).
- Retained all eight categorical columns pending encoding — each carries interpretable business semantics (account type, occupation, segment, etc.).
- Deferred class-imbalance mitigation (SMOTE, class weights, or threshold tuning) to the modeling phase where its interaction with the chosen algorithm can be evaluated.
- Scheduled `F3888` for datetime parsing and temporal feature extraction in Phase 2.
- Scheduled `F3892` for missing-value analysis and domain-appropriate imputation in Phase 2.

## Results

Audit complete. The raw dataset contains 9,082 transactions across 3,925 features with extreme sparsity, one confirmed target-leakage column, one index artifact, and a 111:1 class imbalance. A total of 425 columns (63 empty + 361 near-empty + `F3912` + `Unnamed: 0`) are marked for removal, reducing dimensionality to approximately 3,500 features before further selection.

## Validation

- Dataset shape: 9,082 × 3,925
- Memory footprint: 288.52 MB
- Dtype distribution: 3,876 float64 / 41 int64 / 8 object
- Duplicate rows: 0
- Target (`F3924`): binary, 0 = 9,001 (99.11%), 1 = 81 (0.89%)
- Class imbalance ratio: 111:1
- Fully empty columns (100% missing): 63
- Near-empty columns (>95% missing): 361
- High-missing columns (>50% missing): 1,138
- Zero-missing columns: 90
- Target leakage (`F3912` vs `F3924`): 99.94% match, 5 mismatches confirmed via crosstab
- Index artifact (`Unnamed: 0`): monotonic 1–9,082, r = 0.16 with target
- Object columns catalogued: 8 (F2230, F3886, F3888, F3889, F3890, F3891, F3892, F3893)
- Maximum absolute skewness observed: 95.29
- Columns flagged for removal: 425

## Next Step

Execute Phase 2 preprocessing in `02_Preprocessing.ipynb`: drop the 425 flagged columns, parse `F3888` as datetime, impute `F3892`, encode categorical features, and assess remaining feature distributions for normalization requirements.
