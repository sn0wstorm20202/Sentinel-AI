| Risk | Impact | Mitigation |
|---|---|---|
| Leakage | High | Removed F3912 across all phases immediately. |
| Imbalance | High | Deferred class balancing (PR-AUC, Class Weights) to modeling phase. |
| Missing Values | Medium | Generated explicit Missing Indicators instead of naive imputation. |
| Graph Scale | Future | Reserved complex PageRank/Community mapping for Phase 7 (Neo4j). |
