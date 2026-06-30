# Phase 07 — Graph Intelligence Layer

## Objective
Shift the analytical paradigm from isolated transaction scoring to relationship-based network analytics. This phase constructs the foundational Graph Intelligence layer, building a knowledge graph, detecting communities, computing centrality, propagating risk iteratively, and exporting a Graph Feature Store for Phase 8 GNN consumption.

## Dataset Reality Check
The Bank of India dataset is strictly anonymized (features `F1...F4000`) and lacks explicit entity identifiers. To maintain scientific integrity, we build a **Deterministic Synthetic Topology Layer** using SHA-256 hashing. The same input always produces the same graph. No randomness is used.

## Architecture
All implementation lives in reusable modules under `src/graph/`. The notebook is a thin orchestrator.

| Module | Responsibility |
|---|---|
| `GraphBuilder.py` | Deterministic entity-relationship construction |
| `CommunityDetector.py` | Louvain/Greedy Modularity community identification |
| `CentralityEngine.py` | PageRank, Betweenness, Degree, and graph quality metrics |
| `RiskPropagationEngine.py` | Iterative risk propagation with convergence detection |
| `GraphExporter.py` | Multi-format export (GEXF, GraphML, JSON, CSV) |
| `GraphFeatureStore.py` | Parquet feature store with manifest for Phase 8 |

## Deliverables
- [x] `src/graph/` — 6 independent, type-hinted, docstring-documented modules
- [x] `notebooks/07_Graph_Intelligence.ipynb` — Orchestrator notebook
- [x] `docs/GRAPH_SCHEMA.md` — Node/edge type definitions
- [x] `docs/GRAPH_API.md` — REST endpoint contracts for frontend
- [x] `reports/phase_07/` — All generated artifacts (metadata, registries, feature store)

## Key Insight
Sentinel AI no longer asks: *"Is this transaction fraudulent?"*

It now asks: *"Which entities, communities, and relationships around this transaction increase or decrease its risk?"*

**Status: Phase 7 COMPLETE.**
