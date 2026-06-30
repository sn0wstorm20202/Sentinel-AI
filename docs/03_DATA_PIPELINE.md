# Data Pipeline (Phase 2 & 3)

The data pipeline consumes raw transaction CSVs and transforms them into an AI-ready Feature Store.

## Data Cleaning (Phase 2)
- Zero-variance features are dropped.
- Missing values are imputed (median for numerics, mode for categoricals).
- Data types are strictly cast for memory efficiency.

## Feature Engineering (Phase 3)
- Velocity features (transactions per time window).
- Statistical aggregations (mean, max, std dev).
- Top 600 features selected based on initial LightGBM feature importance rankings.
