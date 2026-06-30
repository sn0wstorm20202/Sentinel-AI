# Phase 05 — Hybrid Fraud Intelligence Modeling (v2.0)

## Objective
Establish the core algorithmic decision engine for the enterprise. We transition from tracking predictive features into architecting a comprehensive decision-support system that translates raw probabilities into actionable banking intelligence.

## Enterprise Modeling Philosophy
We explicitly deviate from traditional ML accuracy-chasing. This Phase minimizes business loss by evaluating models strictly against PR-AUC, optimizing the Probability Decision Threshold against a dynamic `business_config.json` cost matrix (False Positives vs. Fraud Loss), and prioritizing calibrated risk scores over raw margins.

## Pipeline Architecture
- **Input**: The 535 Approved Features synthesized from the Fraud Intelligence Framework.
- **Holdout Integrity**: Stratified 70/15/15 Split ensuring validation models never touch test evaluations.
- **Drift Readiness**: `training_drift_stats.json` captures exact feature means, standard deviations, and missing percentages for downstream monitoring.
- **Imbalance Optimization**: Empirical bake-off between Class Weights, SMOTE, ADASYN, and Borderline SMOTE.
- **Dynamic Model Selection**: LightGBM, XGBoost, CatBoost, Random Forest, Extra Trees, and Logistic Regression dynamically evaluated. The Champion is automatically decided via `argmax(PR-AUC)`.
- **Probability Calibration**: Isotonic Regression to map raw output directly to true real-world probability.
- **Cost-Threshold Optimization**: Dynamic search utilizing `business_config.json` (FP=$50, FN=$5,000, Manual Review=$25) to find the perfect probability cutoff.

## The Business Intelligence Layer (Investigator Copilot)
Instead of returning a binary classification, the engine maps the calibrated probability into a **Risk Tier** and generates a direct recommendation. The Copilot CSV embeds:
- Transaction_ID
- Fraud Probability & Risk Tier
- Top 5 SHAP Explanations
- Manual Review Flag & Recommendation

## Explainability & Error Analysis
- Global and Local SHAP analyses (Summary, Bar, Waterfall).
- Deep Error Analysis explicitly correlating High Confidence False Positives and False Negatives against specific underlying features.
- Auto-generation of a Markdown **Model Card** (`model_card.md`) capturing intended use, ethical considerations, and retraining strategies.

## Final Results & Business Metrics (v2.0)
- **Dynamic Champion**: XGBoost
- **Imbalance Strategy**: Baseline (Class Weights)
- **Optimal Business Threshold**: 0.03
- **Primary ML Metrics**: PR-AUC (0.922), Recall (1.00), Precision (0.375)
- **Business Impact**: Generated 32 total alerts capturing 12 true frauds (100% Recall). Due to the heavily penalized $5,000 False Negative cost, the threshold automatically lowered to eliminate fraud completely. This optimized policy saved **208 false alerts** and conserved **104 analyst hours** compared to legacy systems.
- **Governance API Readiness**: Extract generated `FraudDecisionEngine.py`, which directly consumes the `champion_model_calibrated.pkl`, `shap_explainer.pkl`, and `threshold_policy.json` for live inference.

**Status**: Ready for Explainable AI APIs & Graph Network integration.
