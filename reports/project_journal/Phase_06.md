# Phase 06 — Sentinel Investigator (The Fraud Intelligence Engine)

## Objective
To build the interaction layer between the Sentinel AI platform and the human investigators. This phase strictly separates product design from code implementation. We architected the **Fraud Intelligence Engine (FIE)**, a modular microservice subsystem designed to ingest raw ML outputs and emit scientifically defensible, evidence-based recommendations through a FastAPI layer.

## The FIE Pipeline (Fully Implemented)
1. **Fraud Decision Engine (`src/engine/`)**: Mathematical XGBoost inference.
2. **Evidence Engine (`src/fie/`)**: Pure statistical extraction from SHAP tensors.
3. **Knowledge Manager (`src/knowledge/`)**: JSON abstraction layer mapping features to typologies and AML policies.
4. **Hypothesis Engine (`src/fie/`)**: Probabilistic matching of Evidence to known Fraud Typologies.
5. **Recommendation Engine (`src/fie/`)**: Actionable institutional rule enforcement.
6. **Natural Language Engine (`src/fie/`)**: Generation of defensible explanatory text.
7. **Sentinel Orchestrator (`src/copilot/`)**: Central coordinator utilizing Pydantic/Dataclass-driven data models.
8. **Investigator API (`src/api/`)**: FastAPI routing layer enforcing strict JSON response contracts.

## Key Outcomes
- **Microservice Decoupling**: The pipeline strictly follows the Single Responsibility Principle, allowing modules to be swapped, tested, and maintained independently.
- **Contract Enforcement**: Output payloads strictly conform to documented JSON contracts, guaranteeing reliability for frontend engineers.
- **Enterprise Standards**: Comprehensive inclusion of Type Hints, Docstrings, and structured Dataclasses (`evidence`, `hypothesis`, `recommendation`, `case`).

## Documentation Deliverables
- `docs/INVESTIGATION_WORKFLOW.md`
- `docs/SENTINEL_ARCHITECTURE.md`
- `docs/JSON_CONTRACTS.md`
- `docs/PHASE_06_ARCHITECTURE.md` (The complete Developer Onboarding Guide)

**Status**: Phase 6 Backend API and FIE Architecture is officially **COMPLETE**. The platform is primed for Phase 7 (Graph Intelligence) and eventual Phase 10 deployment integrations.
