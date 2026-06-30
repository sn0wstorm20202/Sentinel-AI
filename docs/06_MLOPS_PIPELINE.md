# MLOps & Drift Monitoring (Phase 9)

## 1. Overview
MLOps in Sentinel AI shifts the focus from model building to operational reliability. The core objective is:
> Can Sentinel AI detect degradation early enough to maintain reliable fraud detection without unnecessary retraining?

## 2. Monitoring Engine
Tracks live production metrics:
- Latency (ms)
- Memory (MB)
- API Health
- Prediction Volume & Rate

## 3. Drift Engine
Separated into specialized components:
- **Feature Drift**: Calculates PSI specifically on the Top 50 approved features to detect covariate shift efficiently.
- **Prediction Drift**: Monitors sudden spikes in Fraud percentage or shifts in the Average Probability.
- **Concept Drift**: Measures PR-AUC, Recall, Precision, and F1 degradation when ground truth labels mature.
- **Embedding Drift**: Calculates Cosine Shift and Variance Shift between the geometric centroids of the graph embeddings.

## 4. Alert Engine
Maps statistical drift to business action via severity tiers:
- **INFO**: Minor shifts, logged for auditing.
- **WARNING**: Gradual drift (e.g., PSI > 0.1).
- **HIGH**: Significant performance degradation.
- **CRITICAL**: Extreme shift requiring immediate intervention (e.g., PSI > 0.2, PR-AUC drop > 10%).

## 5. Retraining Engine
**Sentinel AI never automatically retrains.**
Instead, the Retraining Engine reads the Alert Log and generates a recommendation (`IMMEDIATE_RETRAINING`, `SCHEDULE_RETRAINING`, `NONE`) that always requires **Human Approval**.

## 6. Shadow Deployment
Promoting a model is highly controlled:
```text
Current Champion
        ↓
Serving Production Traffic
        ↓
New Challenger Model
        ↓
Runs Silently (Shadow Mode)
        ↓
Compare Performance vs Champion
        ↓
Promote if Superior
```

## 7. Artifacts
- `drift_report.json`
- `psi_report.csv`
- `prediction_drift.csv`
- `concept_drift.csv`
- `alert_log.csv`
- `shadow_comparison.csv`
- `retraining_recommendation.json`


---

## Navigation

[🏠 Home](../README.md) | [⬅️ Previous](05_GRAPH_PIPELINE.md) | [Next ➡️](07_API_REFERENCE.md)
