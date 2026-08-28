# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Sentinel AI is a fraud-detection **backend intelligence platform** (Python/FastAPI) plus a Next.js **Investigator Dashboard**. The backend does not act as a black box: it scores a transaction with a calibrated XGBoost model, then runs a chain of reasoning engines (SHAP → structured evidence → hypotheses → recommendations → natural-language summary) and returns a fully-reasoned `InvestigationCase` JSON. The frontend consumes those JSON contracts.

The project was built in 10 phases (data audit → cleaning → feature engineering → fraud framework → hybrid modeling → FIE → graph intelligence → graph learning → MLOps/drift → deployment). Phase artifacts live under `reports/phase_NN/` and are read at request time by the API layer — several endpoints serve precomputed artifacts rather than live compute.

## Commands

Backend (run from repo root; `PYTHONPATH` must include root so `src.` imports resolve):

```bash
# Setup
python -m venv .venv && source .venv/Scripts/activate   # Windows Git Bash
pip install -r requirements.txt

# Run the API (dev)
uvicorn src.api.InvestigatorAPI:app --reload            # -> http://localhost:8000/docs

# Run the API (prod, as in Docker)
gunicorn src.api.InvestigatorAPI:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:7860

# Unit tests (pytest; no config file, discovery is default)
python -m pytest tests/
python -m pytest tests/test_json_utils.py::test_name   # single test

# Master validation suite — runs the validate_*.py stages end-to-end
python scripts/run_rc2_validation.py                    # expects "9/9 stages passed"

# If model artifacts are missing/corrupt, regenerate real ones from data
python -m scripts.bootstrap_models
```

Frontend (from `frontend/`, uses **pnpm**):

```bash
pnpm install
pnpm dev            # next dev
pnpm build
pnpm lint           # eslint
```

Full stack via Docker: `docker compose up` — backend on `7860`, frontend on `3000`, nginx reverse proxy on `8080`. The frontend calls the backend through nginx (`NEXT_PUBLIC_API_URL=http://localhost:8080`).

## Architecture

### Request flow (the core path)
`POST /api/v1/cases/explain` → `InvestigatorAPI` → `SentinelOrchestrator.process_transaction()`. The orchestrator **computes nothing itself** — it coordinates:

1. `FraudDecisionEngine.align_features()` — reshapes the raw payload to the champion model's exact **535-feature** schema (`model.feature_names_in_`). Unknown keys dropped, missing filled with `NaN` (XGBoost handles natively), non-numeric coerced to `NaN`. A payload with *none* of the expected features raises `ValueError` → API returns **400**. This alignment is the single source of truth so scoring and SHAP never diverge.
2. Score with `model.predict_proba`, assign risk tier via `threshold_policy.json` (`optimal_threshold`).
3. **Short-circuit:** if tier is `Approve` or `Elevated`, return the bare case (skips expensive SHAP). Only `High`/`Critical` get the full reasoning chain below.
4. FIE chain (`src/fie/`): `EvidenceEngine` (SHAP values → structured facts) → `HypothesisEngine` (facts → fraud typologies) → `RecommendationEngine` (typologies + tier → institutional actions) → `NaturalLanguageEngine` (→ summary). The last three take a `KnowledgeManager` loaded from `knowledge/*.json` (AML policies, fraud typologies, feature metadata).

### Key directories
- `src/api/` — FastAPI routers. `InvestigatorAPI.py` is the app entrypoint (mounts Graph/Cases/MLOps/SSE routers, JSON structured logging middleware, `/health` `/live` `/ready`). `CasesAPI`, `GraphAPI`, `MLOpsAPI` mostly **serve precomputed JSON/CSV from `reports/phase_NN/`**; `SSEAPI` is a heartbeat event stream.
- `src/engine/FraudDecisionEngine.py` — model + SHAP loading and inference.
- `src/copilot/SentinelOrchestrator.py` — the coordinator described above.
- `src/fie/`, `src/models/` — reasoning engines and the `InvestigationCase`/evidence/hypothesis/recommendation dataclasses (`.to_dict()` defines the JSON contract).
- `src/graph/`, `src/graph_learning/` — Phase 7–8: deterministic SHA-256 graph construction from tabular data, centrality/community/risk-propagation, and the graph-learning ablation study (Node2Vec/DeepWalk embeddings, GNN implementations with a non-torch fallback in `gnn/GCNFallback.py`).
- `src/mlops/` — Phase 9: drift engines (data/prediction/concept/embedding via PSI), alerting, shadow deployment, retraining.
- `models/` — `champion_model_calibrated.pkl` (CalibratedClassifierCV around XGBClassifier) and `shap_explainer.pkl` (TreeExplainer). Loaded at API startup.
- `configs/` — `threshold_policy.json`, `business_config.json` (FP/FN/review costs driving threshold selection).
- `frontend/src/` — Next.js App Router (`app/(dashboard)`), Zustand stores (`store/`), React Query + axios API layer (`lib/api/`), generated types in `types/generated`.

### Things to know
- **Everything runs from repo root.** API code uses relative paths like `reports/phase_06/case_examples.json` and `Path("models")`, so the process CWD must be the repo root.
- **Honesty constraint:** the codebase deliberately returns real artifact values or clearly-labelled placeholders — do not fabricate metrics. See comments in `MLOpsAPI.py` and `BACKEND_STABILIZATION_REPORT.md`.
- **Auth is a placeholder.** `verify_token` in `InvestigatorAPI.py` never rejects, and CORS is `*`. Both are intentionally open for the demo — flag before treating as production-secure.
- **Frontend Next.js version is newer than training data.** Per `frontend/AGENTS.md`, consult `frontend/node_modules/next/dist/docs/` before writing frontend code; APIs/conventions may differ.
- There is a nested `Sentinel-AI/` directory with its own `.git` — it is not a submodule; avoid touching it.
- Two backend entrypoints exist on `FraudDecisionEngine`: the orchestrator uses `predict_proba` + SHAP directly, while `predict()` is a self-contained legacy path returning a flat business dict. The orchestrator path is authoritative.
