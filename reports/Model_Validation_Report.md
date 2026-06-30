# Stage 8 — ML Validation Report

| Validation Target | Status | Notes |
| :--- | :--- | :--- |
| **Champion Hash** | ✅ PASS | SHA-256 matches manifest |
| **PR-AUC Reproduced** | ✅ PASS | 0.9183 matches perfectly |
| **Recall Reproduced** | ✅ PASS | 1.0000 matches perfectly |
| **Precision Reproduced** | ✅ PASS | 0.5000 matches perfectly |
| **Threshold Unchanged** | ✅ PASS | Threshold is 0.039696969696969696 |
| **Calibration Metrics** | ✅ PASS | Reproduced. Brier: 0.0024, ECE: 0.0029, MCE: 0.5303 |
| **Inference Time Profile** | ✅ PASS | Batch Size: 100 | Mean: 36.46ms | Median: 36.12ms | P95: 37.97ms | P99: 40.81ms |
| **SHAP Reproducibility** | ✅ PASS | SHAP values deterministically reproduced |
| **Business Cost** | ✅ PASS | Cost 15250.0 perfectly reproducible via threshold |

**Overall Verdict:** ✅ PASS (0 failures)
