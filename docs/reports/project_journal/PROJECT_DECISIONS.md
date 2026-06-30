# Project Decisions Log

**Decision 001**
- **Action**: Removed `F3912`.
- **Reason**: Confirmed target leakage.
- **Evidence**: 99.94% agreement with the target variable `F3924`.
- **Approved**: YES

**Decision 002**
- **Action**: Retained Numerical Outliers.
- **Reason**: Fraud itself is an outlier behavior.
- **Evidence**: High absolute skewness strongly correlates with positive target class representation.
- **Approved**: YES

**Decision 003**
- **Action**: Imputed missing numerics with `-999`.
- **Reason**: Preserves the structural missingness signal for XGBoost/LightGBM split algorithms.
- **Evidence**: Tree models successfully isolate out-of-distribution sentinel markers.
- **Approved**: YES (Note: Future GNNs require NaN conversion).
