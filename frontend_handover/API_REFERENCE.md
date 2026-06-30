# API Reference (Phase 6 & 7)

This document outlines the core backend endpoints provided by the FastAPI application.

## Investigator API (`src/api/InvestigatorAPI.py`)

### `POST /api/v1/cases/explain`
Generates a complete intelligence package for a transaction.
- **Request Body**: `TransactionRequest`
  ```json
  {
    "request_id": "req_123",
    "case_id": "case_456",
    "transaction_id": "txn_789",
    "timestamp": "2026-07-01T00:00:00Z",
    "features": { ... }
  }
  ```
- **Response**: `InvestigationCase` object containing risk tier, structured evidence, hypothesis inferences, recommendations, and NLG summary.

---

## Graph Intelligence API (`src/api/GraphAPI.py`)

### `GET /api/v1/graph/statistics`
Returns global graph topology metrics (nodes, edges, density).

### `GET /api/v1/graph/metadata`
Returns build provenance, dataset hash, and execution time.

### `GET /api/v1/graph/communities`
Lists all communities, paginated and filterable by risk tier.
- **Query Params**: `page` (int), `limit` (int), `risk` (string).

### `GET /api/v1/graph/community/{community_id}`
Deep-dive into a specific community's composition and risk profile.

### `GET /api/v1/graph/entity/{entity_id}`
Returns a full profile of a single entity, including centrality scores.

### `GET /api/v1/graph/entity/{entity_id}/neighbors`
Returns the 1-hop neighborhood of a specific entity.

### `GET /api/v1/graph/network/{case_id}`
Returns the 2-hop subgraph (nodes and edges) surrounding a transaction case, formatted for rendering in React Flow or Cytoscape.js.


---

## Navigation

[🏠 Home](../README.md) | [⬅️ Previous](06_MLOPS_PIPELINE.md) | [Next ➡️](08_FRONTEND_INTEGRATION.md)
