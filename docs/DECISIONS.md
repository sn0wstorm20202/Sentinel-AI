# Architectural Decisions Log

This document records the major architectural decisions made during the development of Sentinel AI.

---

### Decision 001: Why XGBoost as the Champion Model?
**Context**: Phase 5 Model Selection.
**Decision**: XGBoost was chosen over LightGBM, Random Forest, and TabNet.
**Reasoning**: It provided the best balance of PR-AUC, calibration consistency (Isotonic Calibration), and SHAP explainability. In financial fraud, interpretability and reliable probability estimation are more critical than marginal accuracy gains.

---

### Decision 002: Why separate Graph Intelligence from Graph Neural Networks?
**Context**: Phase 7 vs Phase 8 design.
**Decision**: We explicitly built a deterministic Graph Intelligence Layer (Phase 7) separate from the Graph Learning Engine (Phase 8).
**Reasoning**: Banks require deterministic risk tracing. A pure GNN is a black box. By pre-computing deterministic graph features (Centrality, PageRank, Community Risk) first, we guarantee explainability and baseline uplift before introducing deep learning.

---

### Decision 003: Why deterministic graph generation with SHA-256?
**Context**: Phase 7 GraphBuilder.
**Decision**: Used SHA-256 hashing to map anonymized dataset IDs to synthetic entities instead of random assignment.
**Reasoning**: Reproducibility. An investigator must be able to rerun the pipeline on the same dataset and get the exact same network topology for auditing purposes.

---

### Decision 004: Why Node2Vec-Lite instead of canonical Node2Vec?
**Context**: Phase 8 Embedding Engine.
**Decision**: Implemented Node2Vec using pure NetworkX walks and TruncatedSVD rather than Skip-Gram with Negative Sampling.
**Reasoning**: Removes the dependency on Gensim/PyTorch Geometric, ensuring the pipeline can run on any enterprise server. It guarantees 100% deterministic embeddings for strict compliance reproducibility while still capturing structural topology.

---

### Decision 005: Why no automatic retraining in MLOps?
**Context**: Phase 9 Retraining Engine.
**Decision**: The system generates alerts and recommendations but requires Human Approval to retrain.
**Reasoning**: In banking, automatically updating a model in production introduces catastrophic regulatory and compliance risks. A Shadow Deployment and manual Champion promotion is the only safe approach.

---

### Decision 006: Why SHAP instead of LIME?
**Context**: Phase 6 Evidence Engine.
**Decision**: SHAP was chosen over LIME for tabular explainability.
**Reasoning**: SHAP provides consistent, mathematically grounded global and local explanations based on cooperative game theory, whereas LIME can be unstable and locally linear, making it legally riskier for explaining financial denials.
