# System Architecture

## Core Components

1. **Sentinel Orchestrator**: The central nervous system linking the API to the ML modules.
2. **Decision Engine**: Generates calibrated probabilities and assigns Risk Tiers (Low, Medium, High, Critical).
3. **Fraud Intelligence Engine (FIE)**: Converts statistical outputs into human-readable Evidence, Hypotheses, and Natural Language summaries.
4. **Graph Learning Engine (GLE)**: Infuses transactional topology (Graph features, Embeddings) to boost tabular model performance.
5. **MLOps Engine**: Monitors the health, drift, and degradation of models in production.

*(See `architecture/SYSTEM_ARCHITECTURE.png` for a visual diagram)*
