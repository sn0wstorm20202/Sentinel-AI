# Stage 8 — ML Validation Report

| Validation Target | Status | Notes |
| :--- | :--- | :--- |
| **Champion Hash** | ✅ PASS | SHA-256 matches manifest |
| **PR-AUC Reproduced** | ✅ PASS | 0.9183 matches perfectly |
| **Recall Reproduced** | ✅ PASS | 1.0000 matches perfectly |
| **Precision Reproduced** | ✅ PASS | 0.5000 matches perfectly |
| **Threshold Unchanged** | ✅ PASS | Threshold is 0.039696969696969696 |
| **Calibration Metrics** | ✅ PASS | Reproduced. Brier: 0.0024, ECE: 0.0029, MCE: 0.5303. The elevated MCE originates from sparsely populated probability bins caused by the highly imbalanced fraud distribution. The overall calibration remains strong, as reflected by the low Brier Score and Expected Calibration Error. |
| **Inference Time Profile** | ✅ PASS | Batch Size: 100 | Mean: 39.01ms | Median: 38.10ms | P95: 42.60ms | P99: 44.67ms | OS: Windows 11 | CPU: Intel64 Family 6 Model 186 Stepping 2, GenuineIntel | Python: 3.12.10 | XGBoost: 3.3.0 |
| **SHAP Reproducibility** | ✅ PASS | SHAP values deterministically reproduced |
| **Business Cost** | ✅ PASS | Cost 15250.0 perfectly reproducible via threshold |

**Overall Verdict:** ✅ PASS (0 failures)
