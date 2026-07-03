# Phase 03 — Feature Engineering

## Feature Engineering Philosophy
The supplied dataset already contains thousands of anonymous engineered variables likely generated from historical banking transactions. Therefore, this phase deliberately avoids creating hundreds of synthetic mathematical combinations. Instead, only a small number of interpretable business features are introduced. This minimizes feature explosion while maximizing explainability and production maintainability. 

**NO TARGET INFORMATION WAS USED DURING FEATURE ENGINEERING.**

## Objective
Generate domain-informed candidate features intended to capture customer lifecycle and behavioural characteristics. Their predictive contribution will be quantitatively evaluated during the Feature Intelligence and Selection phase. 

## Methods
- Instantiated an Enterprise Feature Registry to formally log every engineered feature (`Feature`, `Source`, `Type`, `Business Meaning`, `Created In`).
- Generated `Account_Tenure_Bucket` representing customer lifecycle stages using `Account_Age_Days`.
- Created missing-indicator features (e.g., `F1863_is_missing`), since missingness may encode useful behavioural information and is therefore explicitly represented.
- Binarized categorical segments (e.g., `Retail_Flag`) for crisp decision splits.
- Created interpretable interactions (`Retail_Tenure_Interaction`) combining lifecycle features and customer segments.
- Applied selective logarithmic transformations (Log1p) to highly skewed numerical variables while preserving sentinel missing-value markers (-999).

## Feature Inventory
| Feature                   | Type              | Reason               |
| ------------------------- | ----------------- | -------------------- |
| Account_Tenure_Bucket     | Temporal          | Customer lifecycle   |
| F1863_is_missing          | Missing Indicator | Preserve missingness |
| Retail_Flag               | Business          | Explicit segment     |
| Retail_Tenure_Interaction | Interaction       | Lifecycle × Segment  |
| *_Log1p                   | Numerical         | Reduce skew          |

## Feature Registry Example
| Feature | Source | Business Meaning |
| ------- | ------ | ---------------- |
| Retail_Flag | F3893 | Explicit flag for Retail customers who have distinct transaction velocities. |

## Feature Engineering Metrics
```text
Original Features        : 3500+
↓
Engineered Features      : 5
↓
Final Features           : 3505+
↓
Constant Features Removed: 0
↓
Duplicate Features       : 0
↓
Validation Passed        : YES
```

## Observations
- Phase 3 was strictly about Feature Registry, Feature Documentation, and Candidate Business Features rather than bulk feature creation.
- A set of interpretable features inspired by common banking characteristics (lifecycle, tenure, missingness) was created.

## Challenges
- Balancing the addition of domain features without polluting an already heavily-engineered baseline dataset.
- Applying logarithmic transformations carefully so that `-999` placeholders remained intact.

## Deferred Engineering
The following feature families were intentionally excluded:
* Graph Centrality
* Community Detection
* Graph Embeddings
* Transaction Networks
* GraphSAGE
* Target Encoding
* SMOTE

**Reason:** Reserved for later phases. Graph intelligence strictly belongs to Phase 7, while Target Encoding and SMOTE will be evaluated appropriately bounded by CV folds.

## Results
- Persisted `feature_engineered_dataset.csv`, `feature_registry.csv`, `engineered_features.json`, and metadata logs in `reports/phase_03/`.

## Next Phase
`04_Feature_Intelligence_Selection.ipynb`
