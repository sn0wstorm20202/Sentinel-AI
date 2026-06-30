# Graph Learning Pipeline (Phase 7 & 8)

## 1. Graph Learning Philosophy
Why graph learning? Fraud is inherently adversarial and networked. Fraudsters rarely operate in isolation; they share devices, IP addresses, and behavioral patterns.
While tabular models (Phase 5) capture the *individual* risk of a transaction, Graph Learning captures the *contextual* risk of the surrounding topology.

By comparing Graph Intelligence against our tabular baseline, we scientifically isolate and measure the value of the network.

## 2. Architecture

```text
Graph Feature Store
        ↓
Embedding Engine (Node2Vec-Lite)
        ↓
Feature Fusion Engine
        ↓
Classical Graph ML (EmbeddingClassifier)
        ↓
GNN Engine (GCN, GraphSAGE, GAT)
        ↓
Model Evaluator
        ↓
Experiment Registry
        ↓
Global Model Registry
```

## 3. Inputs
- `graph.graphml`: The full knowledge graph topology.
- `graph_feature_store.parquet`: Precomputed topological features (centrality, risk propagation).
- `approved_features.csv`: The baseline tabular dataset.
- `graph_metadata.json`: Graph build provenance and dataset hash.

## 4. Outputs
- `fusion_dataset.parquet`: The concatenated Tabular + Graph + Embedding dataset.
- `leaderboard.csv`: Ranked experiments.
- `experiment_registry.csv`: All experiment tracking data.
- `graph_model_card.md`: Details of the winning model.
- `ablation_results.csv`: Scientific breakdown of component value.
- `graph_model_registry.json`: The registry of deployable graph models.

## 5. The Scientific Question
The purpose of Phase 8 is **not** to maximize Graph Neural Network performance. 
Instead, it is to **evaluate whether graph representations provide measurable improvement over the tabular fraud model.**
If a classical XGBoost model trained on Node2Vec embeddings outperforms a deep GraphSAGE network, that is a scientifically valid and operationally preferable outcome.
