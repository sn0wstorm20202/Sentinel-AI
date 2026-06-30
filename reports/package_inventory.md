# Sentinel AI Package Inventory

This document serves as the permanent package inventory for the Sentinel AI Backend (`src/`).

## 1. `src.api`
* **Responsibility**: Exposes HTTP/REST interfaces for the dashboard.
* **Public Classes**: `FastAPI App`
* **Dependencies**: `src.copilot`, `src.mlops`
* **Used by**: External Clients, Dashboard

## 2. `src.copilot`
* **Responsibility**: Orchestrates the complete Fraud Intelligence Pipeline for a single case.
* **Public Classes**: `SentinelOrchestrator`
* **Dependencies**: `src.engine`, `src.fie`, `src.knowledge`, `src.models`
* **Used by**: `src.api`, Notebook 06

## 3. `src.engine`
* **Responsibility**: Handles predictive modeling (loading models, predicting probabilities, SHAP explainers).
* **Public Classes**: `FraudDecisionEngine`
* **Dependencies**: `xgboost`, `shap`, `src.utils`
* **Used by**: `src.copilot`

## 4. `src.fie`
* **Responsibility**: Generates human-readable evidence, hypotheses, and recommendations (Fraud Intelligence Engine).
* **Public Classes**: `EvidenceEngine`, `HypothesisEngine`, `RecommendationEngine`, `NaturalLanguageEngine`
* **Dependencies**: `src.knowledge`, `src.models`
* **Used by**: `src.copilot`

## 5. `src.graph`
* **Responsibility**: Handles local graph construction, caching, and network topological extraction.
* **Public Classes**: `GraphBuilder`, `GraphCache`
* **Dependencies**: `networkx`, `pandas`
* **Used by**: `src.graph_learning`

## 6. `src.graph_learning`
* **Responsibility**: Manages Graph ML experiments (Node2Vec, GNNs) and the Model Registry.
* **Public Classes**: `GraphLearningOrchestrator`, `ModelRegistry`
* **Dependencies**: `src.graph`, `src.utils`, `torch`
* **Used by**: `src.mlops`, Notebook 08

## 7. `src.mlops`
* **Responsibility**: Runs drift monitoring, shadow deployments, and retraining alerts.
* **Public Classes**: `MLOpsOrchestrator`, `AlertEngine`, `DriftMonitor`
* **Dependencies**: `src.graph_learning`, `src.utils`
* **Used by**: `src.api`, Notebook 09

## 8. `src.models`
* **Responsibility**: Defines core dataclasses and JSON serialization contracts.
* **Public Classes**: `InvestigationCase`, `Evidence`, `Hypothesis`, `Recommendation`
* **Dependencies**: None (pure data)
* **Used by**: All packages

## 9. `src.knowledge`
* **Responsibility**: Maps anonymized features to business concepts and AML policies.
* **Public Classes**: `KnowledgeManager`
* **Dependencies**: JSON files in `knowledge/`
* **Used by**: `src.fie`, `src.copilot`

## 10. `src.utils`
* **Responsibility**: Shared utilities for I/O, pathing, and serialization.
* **Public Classes**: `CustomJSONEncoder`, `bootstrap()`
* **Dependencies**: `numpy`, `pandas`
* **Used by**: All packages
