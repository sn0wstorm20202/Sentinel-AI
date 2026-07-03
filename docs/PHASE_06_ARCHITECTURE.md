# Sentinel AI: Backend Architecture & Integration Guide

Welcome to the **Sentinel AI Backend**. This document provides a complete onboarding overview for engineers integrating with or maintaining the Fraud Intelligence Engine (FIE).

## 1. System Overview & The Sentinel Mission
Sentinel AI is an Enterprise Fraud Intelligence Platform. Unlike traditional R&D machine learning environments, our backend does not simply execute `.predict()` and return a boolean. Sentinel AI serves as an **AI Fraud Investigator Copilot**, ingesting transactions, classifying probabilistic fraud patterns (typologies), and issuing policy-driven recommendations to human analysts.

## 2. Core Folder Structure
The backend is completely modular and follows the Single Responsibility Principle:
```text
src/
├── api/
│   └── InvestigatorAPI.py       # FastAPI routing endpoints
├── copilot/
│   └── SentinelOrchestrator.py  # The primary FIE coordinator
├── engine/
│   └── FraudDecisionEngine.py   # Base ML Inference (XGBoost + Calibration)
├── fie/
│   ├── EvidenceEngine.py        # Converts SHAP math to statistical facts
│   ├── HypothesisEngine.py      # Infers fraud typologies from Evidence
│   ├── RecommendationEngine.py  # Maps hypotheses to AML Policies
│   └── NaturalLanguageEngine.py # Generates defensible English summaries
├── knowledge/
│   └── KnowledgeManager.py      # Abstraction layer for static JSON policies
└── models/
    ├── evidence.py              # Data model for statistical facts
    ├── hypothesis.py            # Data model for probabilistic patterns
    ├── recommendation.py        # Data model for policy actions
    └── case.py                  # The master InvestigationCase object
```

## 3. The Architecture Diagram
```text
[ React Dashboard ]
        │
        ▼ (POST /api/v1/cases/explain)
[ Investigator API ]
        │
        ▼
[ Sentinel Orchestrator ] 
        │
        ├── 1. [ Fraud Decision Engine ] --> (Probability, Tier, SHAP)
        │
        ├── 2. [ Evidence Engine ]       --> (Structured Statistical Facts)
        │
        ├── 3. [ Knowledge Manager ]     <-- (Loads Policies & Metadata)
        │
        ├── 4. [ Hypothesis Engine ]     --> (Probabilistic Typologies)
        │
        ├── 5. [ Recommendation Engine ] --> (Ranked Actions)
        │
        └── 6. [ Natural Language Gen ]  --> (Defensible Explanations)
        │
        ▼
[ JSON Payload (InvestigationCase) ]
        │
        ▼
[ React Dashboard ]
```

## 4. The Request Lifecycle (Sequence Flow)
1. **Trigger**: An analyst requests a case explanation via `InvestigatorAPI`.
2. **Inference**: The `SentinelOrchestrator` passes the raw transaction vector to the `FraudDecisionEngine`.
3. **Risk Tiering**: If the probability score indicates an "Approve" risk tier, the Orchestrator safely short-circuits to save compute, immediately returning a clean `InvestigationCase`.
4. **Deep Explainability**: If flagged, SHAP tensors are generated and passed to the `EvidenceEngine`.
5. **Knowledge Integration**: The `HypothesisEngine` maps the evidence against institutional features via the `KnowledgeManager`, emitting potential fraud hypotheses.
6. **Policy Enforcement**: The `RecommendationEngine` evaluates the hypotheses and risk tier against institutional AML policies.
7. **Finalization**: The components are bundled into the `InvestigationCase` dataclass, serialized via `.to_dict()`, and returned to the client as strict JSON.

## 5. Engine Responsibilities
- **FraudDecisionEngine**: Pure mathematical inference. Knows nothing about policies.
- **EvidenceEngine**: Pure statistical translation. Never uses English or business logic.
- **KnowledgeManager**: Pure abstraction layer. Never infers. Just loads `fraud_typologies.json` and `aml_policies.json`.
- **HypothesisEngine**: Probabilistic matching. Never claims absolute certainty (outputs lists of possible hypotheses).
- **RecommendationEngine**: Institutional rule enforcement. Outputs ranked, actionable commands for the analyst.
- **NaturalLanguageEngine**: Safely templates hypothesis explanations to guarantee legal and operational defensibility.

*To get started, spin up the API locally using: `uvicorn src.api.InvestigatorAPI:app --reload`*
