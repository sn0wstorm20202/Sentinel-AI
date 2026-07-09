# BACKEND STABILIZATION REPORT — Sentinel AI

> **Engagement**: Complete backend stabilization for live demonstration
> **Date**: 2026-07-09
> **Scope**: `src/`, `models/`, `configs/`, `knowledge/`, `reports/` (backend only — frontend untouched)
> **Constraint honored**: Architecture preserved. No new features. Correctness, honesty, and demo stability only.
> **Method**: Every finding below was verified by *executing* the code (real model load, real inference, real HTTP server, TestClient sweeps) — not by reading alone.

---

## 0. TL;DR

The backend is **demo-ready**. The live AI inference path (`POST /api/v1/cases/explain`) is **genuinely real** — a trained calibrated XGBoost model + real SHAP + the full Fraud Intelligence Engine — and it now degrades gracefully instead of crashing on bad input. Three real defects were found and fixed: (1) any malformed inference payload returned a raw **500 stack dump**, (2) **62 data files were unresolved Git-LFS pointers** (two of them broke live endpoints), and (3) the MLOps dashboard and a model registry served **fabricated metrics** that contradicted the project's own recorded results. All three are resolved. Fabricated values were replaced with **real, on-disk metrics** or corrected to reflect reality.

---

## 1. What Was Verified

### 1.1 Runtime endpoint audit (executed, not inferred)

| Endpoint | Method | Classification | Backing | Status |
|---|---|---|---|---|
| `/health`, `/live`, `/ready` | GET | ✅ Live | Orchestrator liveness | 200 |
| `/api/v1/cases/explain` | **POST** | ✅ **Fully Live** | Calibrated XGBoost → SHAP → FIE (Evidence→Hypothesis→Recommendation→NLG) | 200 / 400 / 422 |
| `/api/v1/cases` | GET | ❌ Static | `reports/phase_06/case_examples.json` | 200 |
| `/api/v1/cases/{id}` | GET | ❌ Static | `case_examples.json` | 200 / 404 |
| `/api/v1/cases/{id}/explain` | GET | ❌ Static | `case_examples.json` (precomputed) | 200 / 404 |
| `/api/v1/graph/statistics` | GET | ❌ Static | `reports/phase_07/network_statistics.json` | 200 |
| `/api/v1/graph/metadata` | GET | ❌ Static | `graph_metadata.json` | 200 |
| `/api/v1/graph/communities`, `/community/{id}` | GET | ❌ Static | `community_registry.csv` | 200 / 404 |
| `/api/v1/graph/entity/{id}`, `/neighbors` | GET | ❌ Static | `entity_registry.csv`, `centrality_scores.csv` | 200 / 404 |
| `/api/v1/graph/network/{case_id}` | GET | ❌ Static (live traversal) | `visualization/nodes.json` + `edges.json`; **real 2-hop subgraph extraction at request time** | 200 / 404 |
| `/api/v1/mlops/metrics` | GET | ❌ Static | `reports/phase_05` + `phase_09` (real artifacts) | 200 |
| `/api/v1/stream` | GET (SSE) | 🟡 Stub | Connection ping + 15s heartbeat only | 200 |

**Split-brain confirmed and intentional-for-demo**: `POST /explain` runs the real model live; the `GET` case endpoints serve precomputed examples. Both are honest — the static cases are *real prior outputs* of the same engine, not fabrications. The graph/MLOps endpoints serve artifacts that were genuinely computed offline by real algorithms.

### 1.2 Live AI inference — verified by execution (Step 2)

- **Model artifact is real**, not a mock. `champion_model_calibrated.pkl` is a `sklearn.calibration.CalibratedClassifierCV` wrapping `XGBClassifier`, trained on **535 named features**, 3 calibration folds. Scoring 300 real transactions produced **22 distinct probabilities** (min 0.0000, max 0.5729) — proving it is not a constant-output stub. *(Note: `generate_dummy_models.py` existed and would overwrite this with a constant-0.9 mock — it was never wired into Docker/CI, and has been deleted to remove the footgun.)*
- **Full pipeline executes end-to-end**: a high-risk transaction returns a complete `InvestigationCase` — 5 SHAP evidence facts, a recommendation, a natural-language summary, correct risk tier (`High`).
- **Preprocessing chain**: the model was trained on already-cleaned/engineered features, so inference correctly takes the 535-feature vector directly. There is **no missing scaler/encoder step** — `scaler.pkl`/`label_encoders.pkl` are training-time leftovers the champion pipeline does not require. Verified the model carries and enforces its own `feature_names_in_`.
- **Threshold**: engine reads `configs/threshold_policy.json` = **0.0397** (matches `model_metadata.json`). Risk tiers computed correctly.
- **Real champion metrics** (from `reports/phase_05/business_metrics.json`, test set): **PR-AUC 0.918**, ROC-AUC 0.9989, Recall 1.0, Precision 0.5, Brier 0.0024.

### 1.3 Artifacts (Step 3)

**Zero missing runtime artifacts.** Every file the serving code loads exists and is valid: champion model, SHAP explainer, threshold policy, 3 knowledge-base files, case examples, all Phase 7 graph artifacts, Phase 9 drift files. Confirmed by loading each through the actual code paths.

### 1.4 Graph pipeline (Step 6)

All intact: `nodes.json` (16,027), `edges.json` (36,258), `community_registry.csv` (36 communities), `centrality_scores.csv` (16,027 rows), `entity_registry.csv` (6,945). Subgraph extraction, community lookup, and centrality all execute. Graph engine classes import and instantiate. GraphML/GEXF exports are **not** referenced at runtime (no broken references). The graph remains **synthetic** (deterministic SHA-256 entity hashing) — this is disclosed, not hidden (`builder_version: "DeterministicSyntheticBuilder v1.0"`).

### 1.5 MLOps (Step 7)

The drift engines (PSI, prediction, concept, embedding), AlertEngine, RetrainingEngine (advisory-only), and ShadowDeploymentEngine contain **real, correct statistical logic**, but are **offline/notebook-only** — no API endpoint invokes them live. The API serves their **precomputed outputs**. The drift inputs are a **reference-vs-perturbed-copy demonstration split**, now labeled as such in the API response.

---

## 2. What Was Fixed

| # | Issue | Severity (for a live demo) | Fix | File(s) |
|---|---|---|---|---|
| 1 | `POST /explain` returned a raw **500 + 535-item stack dump** on any empty/partial/wrong/extra/string/None payload | 🔴 Critical (crash in front of judges) | Added `align_features()`: reindexes payload to the model's exact 535-feature schema, ignores unknown keys, NaN-fills gaps (XGBoost-native), coerces non-numerics; raises `ValueError` for irrelevant payloads → API maps to clean **400** | `FraudDecisionEngine.py`, `SentinelOrchestrator.py`, `InvestigatorAPI.py` |
| 2 | **62 data files were unresolved Git-LFS pointers**; `/graph/communities` and `/mlops` PSI returned LFS pointer text | 🔴 Critical (garbage shown to judges) | `git lfs pull` — all 62 resolved to real content; 0 pointers remain | (data restore) |
| 3 | MLOps API served **fabricated** `auc_roc: 0.955`, `"XGBoost v4.1"`, and fake experiments `EXP-891…888` (incl. a "TabNet" never trained) | 🔴 Critical (dishonest, on the ML page) | Rewrote to serve **real** metrics from `business_metrics.json` (PR-AUC 0.918, ROC-AUC 0.9989, Recall 1.0) and the **real Phase 5 bake-off** from `baseline_comparison.csv` (XGBoost/LightGBM/ExtraTrees/CatBoost/RF/LogReg with true PR-AUC) | `MLOpsAPI.py` |
| 4 | `models/registry/graph_model_registry.json` claimed `pr_auc 0.95, f1 0.92, hash "1234abcd", status Champion` — contradicting the real all-zero Phase 8 leaderboard | 🟠 High (embarrassing if opened) | Rewrote to true values: `pr_auc 0.0`, real hash `50a56c8269ff1e91`, `status: Experimental`, `NOT_EVALUATED`, with an honest note that the tabular XGBoost is the real champion | `graph_model_registry.json` |
| 5 | Test-junk committed to `reports/`: `temp_registry/` (`MockSAGE`, `0.95`) and `temp_alerts/` | 🟠 High (embarrassing if browsed) | Deleted both directories | — |
| 6 | `generate_dummy_models.py` + `mock_model.py`: would silently replace the real model with a constant-0.9 mock | 🟠 High (silent-fake footgun) | Deleted both (not referenced by Docker/CI) | — |
| 7 | `EvidenceEngine` comment labeled the served `confidence` field "Simulated confidence metric" | 🟡 Medium (mislabeled, quotable) | Relabeled comment to describe it accurately as a normalized relative SHAP contribution weight (value unchanged; field name kept for frontend contract) | `EvidenceEngine.py` |
| 8 | Duplicate JSON utility (`src/utils/json_utils.py`, unused) | 🟡 Medium (dead code) | Deleted; kept the one that's actually used (`src/common/json_utils.py`) | — |
| 9 | 7 empty 2-byte stub modules creating an "illusion of modularity" | 🟡 Medium (misleading) | Deleted (none imported): `preprocessing.py`, `feature_engineering.py`, `feature_selection.py`, `graph_features.py`, `modeling.py`, `helpers.py`, `visualization/explainability.py` | — |
| 10 | Deprecated `datetime.utcnow()` (Python 3.12 warnings) | 🟢 Low (log noise) | Replaced with `datetime.now(timezone.utc)` | `FraudDecisionEngine.py`, `case.py` |

**Error handling now verified across the matrix**: 200 (valid), 400 (malformed features), 404 (missing case/entity/community/network), 422 (missing required request fields), 500 (only genuine internal faults, now with a clean message + server-side log, no stack leak).

---

## 3. Remaining Limitations (honest disclosure)

These are **known and acceptable for a prototype demo**. None crash the backend.

1. **SSE is a heartbeat stub** (`/api/v1/stream`). It emits a connection ping and 15s heartbeats but no real domain events. Left as-is to honor the no-feature-creep constraint. The frontend handles it gracefully (no crash).
2. **Authentication is a no-op** (`verify_token` never rejects; CORS `["*"]`). Fine for a demo, not for production. Not fabricated — clearly a placeholder.
3. **Graph is synthetic** — entities are deterministic SHA-256 hashes, not real customer/device relationships. Disclosed in metadata. A judge asking "is this real relational data?" should be told: no, it's a deterministic synthetic topology.
4. **Graph learning (Phase 8) genuinely failed** — the ablation produced all-zero metrics (GNN training fell back). Now honestly recorded in the registry as `Experimental / NOT_EVALUATED`. The production model is the tabular XGBoost, which works.
5. **MLOps drift is a demonstration split** (reference vs perturbed copy), not live production traffic. Now labeled as such in the API response `note` fields.
6. **Static vs live split** — most GET endpoints serve precomputed (real) outputs rather than recomputing live. Correct and stable for a demo; the one live ML path is `POST /explain`.
7. **Stale artifact**: `reports/phase_05/optimal_threshold.json` says `0.1` while the engine correctly uses `threshold_policy.json` (`0.0397`). The stale file is a report artifact only referenced by an offline validation-script comment — not the live engine. Left in place; noted here.
8. **Small fraud sample** (81 fraud / 9,082 tx) — a data-science caveat, not a backend defect.
9. **Git-LFS dependency for deploy**: the 62 data files are LFS-backed. They are resolved locally now, but any fresh deployment (Docker build context, HF Space) **must run `git lfs pull`** or those endpoints will serve pointer text again. **Action item for deployment.**

---

## 4. Demo Readiness

**The backend will not crash during a live demo.** Verified against a real `uvicorn` server:

- ✅ Boots cleanly (gunicorn/uvicorn), loads model + explainer + KB at startup.
- ✅ Every endpoint returns correct status codes; malformed input → 400, not 500.
- ✅ Live inference latency ~85–90 ms; graph network ~50–70 ms; static reads <5 ms.
- ✅ NumPy/pandas types serialize safely (`sanitize_for_json` at the case boundary; `np.str_`/`np.float32`/`np.int64` all verified JSON-safe).
- ✅ No fabricated values remain in any served path (grep-verified clean: no `1234abcd`, `EXP-89*`, `XGBoost v4.1`, `0.955`, `MockSAGE`).

**Recommended demo flow**: open the case queue (real precomputed cases) → open a High/Critical case (real SHAP evidence + hypotheses + NLG) → show the network graph → show the MLOps page (now real PR-AUC 0.918 + real bake-off) → optionally `curl` `POST /explain` with a real 535-feature vector to show *live* scoring.

**Pre-demo checklist**: (1) `git lfs pull` on the deploy target; (2) do **not** run any `generate_*`/`patch_*` scripts; (3) confirm `models/champion_model_calibrated.pkl` is the 1.3 MB real file.

---

## 5. Scores (honest, no inflation)

Scale: 1 = non-existent, 5 = functional prototype, 7 = production-approaching, 10 = production-grade.

| Dimension | Score | Justification |
|---|---|---|
| **Backend Score** | **7.0 / 10** | Core inference path is real, robust, and now crash-hardened. Clean layered architecture, correct error handling, honest metrics. Held back by: no DB (flat files), no auth, static GET endpoints, stub SSE. Solid, defensible backend for a prototype. |
| **Enterprise Readiness** | **3.5 / 10** | Unchanged by design — stabilization was not hardening for production. Still missing auth/RBAC, database, audit logging, real-time ingestion, live MLOps scheduling. Has the *shape* of an enterprise system, prototype maturity. |
| **Hackathon Readiness** | **8.5 / 10** | Boots reliably, demos end-to-end, no live crashes, and — critically — **honest**: real model, real metrics, fabrications removed, limitations disclosed. The one genuinely strong differentiator (real explainable FIE pipeline) is front-and-center and works. |

---

## 6. Files Changed

**Modified** (7): `src/engine/FraudDecisionEngine.py`, `src/copilot/SentinelOrchestrator.py`, `src/api/InvestigatorAPI.py`, `src/api/MLOpsAPI.py`, `src/fie/EvidenceEngine.py`, `src/models/case.py`, `models/registry/graph_model_registry.json`

**Deleted** (13): `generate_dummy_models.py`, `src/engine/mock_model.py`, `src/utils/json_utils.py`, `src/data/preprocessing.py`, `src/features/feature_engineering.py`, `src/features/feature_selection.py`, `src/graph/graph_features.py`, `src/models/modeling.py`, `src/utils/helpers.py`, `src/visualization/explainability.py`, `reports/temp_registry/` (dir), `reports/temp_alerts/` (dir)

**Data restored**: 62 Git-LFS files resolved via `git lfs pull`.

**Architecture: unchanged.** Every layer (API → Orchestrator → Engines → Knowledge) is intact; only correctness, robustness, honesty, and dead-code removal were applied.
