# Sentinel AI: Enterprise Architecture Mapping

This document outlines the macro-architectural boundaries and data flow between the various microservices that comprise Sentinel AI, focusing specifically on how the Sentinel Investigator (Phase 6) integrates into the wider ecosystem.

## Component Block Diagram

```text
[ React Frontend Dashboard ]  <-- (REST / JSON)
            |
            v
[ Sentinel Investigator API ] (FastAPI Orchestrator)
            |
            v
[ Fraud Intelligence Engine (FIE) ]
    |
    |-- 1. [ Decision Engine ] (XGBoost Isotonic Inference)
    |
    |-- 2. [ Explainability Engine ] (SHAP TreeExplainer)
    |
    |-- 3. [ Evidence Engine ] (Converts SHAP & Features to Statistical Facts)
    |
    |-- 4. [ Knowledge Manager ] (Loads typologies, metadata, AML rules)
    |
    |-- 5. [ Hypothesis Generator ] (Infers Probabilistic Fraud Patterns)
    |
    |-- 6. [ Recommendation Engine ] (Generates ranked investigator actions)
    |
    +-- 7. [ Natural Language Generator ] (Translates evidence into defensible text)
            |
            v
[ Phase 7 Graph Intelligence Engine ] (Network Risk Propagation)
            |
            v
[ Phase 8 Enterprise Risk Engine ] (Consolidated Scoring)
            |
            v
[ PostgreSQL Audit Database ] (Case History & Compliance Logging)
```

## Module Responsibilities (The Fraud Intelligence Engine - FIE)

### 1. Decision Engine & Explainability (`src/engine/`)
- Outputs the mathematical `probability` and raw `SHAP` tensors.

### 2. Evidence Engine
- **Input**: SHAP Tensors, Raw Features, Drift Statistics.
- **Output**: Pure statistical facts (e.g., Feature `F1863` has 0.41 importance, deviated 4.2 std dev from historical mean). No English, no assumptions.

### 3. Knowledge Manager (`src/knowledge/KnowledgeManager.py`)
- Loads institutional business logic from the `knowledge/` directory:
  - `fraud_typologies.json`
  - `feature_metadata.json` (The critical bridge mapping anonymized `F1863` to abstract banking concepts).
  - `aml_policies.json`
  - `escalation_rules.json`

### 4. Hypothesis Generator
- Consumes the Evidence and matches it against the `fraud_typologies.json` via the Knowledge Manager.
- Outputs a ranked list of `fraud_hypotheses` (e.g., Synthetic Identity: 83% confidence). It never claims absolute certainty.

### 5. Recommendation Engine
- Consumes the Hypotheses and the Risk Score.
- Maps them against `aml_policies.json`.
- Outputs an array of `recommended_actions` prioritized by relevance to assist the human investigator.

### 6. Natural Language Generator (NLG)
- Safely templates the evidence, hypotheses, and recommendations into defensible, scientifically accurate English summaries.
