# Graph Learning Model Card

**Winning Model**: Full Fusion (XGBoost + Node2Vec-Lite + Graph Topology)
**Dataset Hash**: 50a56c8269ff1e91

## Leaderboard

| Experiment ID              | Timestamp            | Model Type   |   Graph Version | Dataset Hash     |   Features |   PR-AUC |   F1-Score |   Recall |   Precision |   Expected Calibration Error |   Training Time (s) |   Inference Time (ms) |   Memory (MB) |
|:---------------------------|:---------------------|:-------------|----------------:|:-----------------|-----------:|---------:|-----------:|---------:|------------:|-----------------------------:|--------------------:|----------------------:|--------------:|
| 1_Baseline_Tabular         | 2026-06-30T21:16:33Z | xgboost      |               1 | 50a56c8269ff1e91 |        535 |        0 |          0 |        0 |           0 |                       0.0012 |               3.255 |                   0.3 |          4.08 |
| 2_Baseline_Plus_Graph      | 2026-06-30T21:16:37Z | xgboost      |               1 | 50a56c8269ff1e91 |        546 |        0 |          0 |        0 |           0 |                       0.0012 |               3.098 |                   0.2 |          4.17 |
| 3_Baseline_Plus_Embeddings | 2026-06-30T21:16:41Z | xgboost      |               1 | 50a56c8269ff1e91 |        599 |        0 |          0 |        0 |           0 |                       0.0012 |               3.562 |                   0.3 |          4.33 |
| 4_Full_Fusion              | 2026-06-30T21:16:45Z | xgboost      |               1 | 50a56c8269ff1e91 |        610 |        0 |          0 |        0 |           0 |                       0.0012 |               3.579 |                   0.5 |          4.41 |