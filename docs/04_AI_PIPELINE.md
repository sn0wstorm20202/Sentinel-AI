# AI Pipeline (Phase 4, 5, 6)

## 1. Champion Model
XGBoost calibrated via Isotonic Regression.

## 2. Evidence Generation (SHAP)
SHAP values are extracted for every prediction. The top features pushing the score toward Fraud are categorized as "Evidence". Features pushing toward Legitimate are categorized as "Counter-Evidence".

## 3. Fraud Intelligence Engine (FIE)
Translates the SHAP Evidence into clear text:
- **Hypothesis**: E.g., "Velocity Fraud: Rapid succession of transactions detected."
- **NLG Summary**: Generates a 2-3 sentence executive briefing.
