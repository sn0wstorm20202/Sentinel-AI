# Phase 04 — Enterprise Fraud Intelligence Framework

## Objective
Establish a multi-stage Framework that validates candidate variables through statistical relevance, model contribution, explainability, stability, and banking-domain reasoning before promoting them into the production fraud engine.

## Fraud Intelligence Philosophy
Traditional feature selection removes features based on a single statistical cut-off. Enterprise AML systems cannot depend on a single measure because fraud is inherently multi-dimensional. A feature may exhibit strong statistical relevance but poor stability.

Therefore, this framework evaluates every candidate feature across three orthogonal dimensions before it is admitted into the production intelligence layer.

## Pipeline Flow
```text
3573 Features
      │
      ▼
Remove Constant Features
      │
      ▼
Variance Analysis
      │
      ▼
Mutual Information
      │
      ▼
Permutation Importance
      │
      ▼
XGBoost Gain
      │
      ▼
SHAP
      │
      ▼
Stability Analysis
      │
      ▼
Production Intelligence
      │
      ▼
Fraud Intelligence Index & Consensus
      │
      ▼
Tier Assignment
      │
      ▼
Approved Features
```

## The Tri-Partite Fraud Intelligence Index (FII) & Consensus
We calculate three distinct sub-scores plus a Consensus score:
- **Statistical Intelligence**: Mutual Information, Permutation Importance
- **Model Intelligence**: XGBoost Gain, SHAP Importance
- **Production Intelligence**: Feature Stability (CV CoV), Missing Robustness, Correlation Penalty, Domain Confidence
- **Consensus Score**: Counts how many of the 4 key metrics (MI, XGB, SHAP, Perm) place the feature in their respective Top 20%.

**Formula**:
$$ FII = 0.25(Statistical) + 0.25(Model) + 0.25(Production) + 0.25(Consensus) $$

## Feature Confidence Score
Confidence reflects agreement among ALL evaluators. If Statistical, Model, Production, and Consensus thresholds are all robust, Confidence approaches 100%. If metrics violently disagree, Confidence craters.

## Governance & Tiering
Features are ranked contextually across the dataset via Percentiles:
- **Top 1%**: Tier A (Mission Critical) - Irrefutable multi-dimensional support. Core detection component.
- **Top 5%**: Tier B (Core) - High predictive stability. Critical ensemble variable.
- **Top 15%**: Tier C (Strong) - High statistical support, moderate model contribution, stable enough for ensemble learning.
- **Top 35%**: Tier D (Useful) - Marginal intelligence, requires human oversight.
- **Remaining**: Tier E (Experimental) - Fails to meet minimum multivariate thresholds.

## Feature Governance Registry
Generated a highly rich, version-controlled `fraud_intelligence_registry.csv` mapping:
`Feature | Missing_Pct | Variance | Business_Category | MI_Score | Permutation_Score | XGB_Gain | SHAP_Importance | Stability_Score | Correlation_Penalty | Consensus_Score | Confidence_Pct | FII | Tier | Decision | Reason | Version | Timestamp`

**Decisions**:
- Tiers A, B, C ➞ **Approved**
- Tier D ➞ **Review**
- Tier E ➞ **Rejected**

## Results
- Features classified as Tier A, Tier B, and Tier C under the Fraud Intelligence Framework were promoted to the production modeling dataset.
- Generated `evaluation_metadata.json` manifest capturing input/output shapes, validation logic, dataset hash, versioning, and tier distributions for strict audit tracking.

**Status**: Ready for Production Modelling.
