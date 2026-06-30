# Sentinel AI: Graph Intelligence API Contracts

This document defines the REST endpoint contracts for the Graph Intelligence Layer (Phase 7). These endpoints are consumed by the React-based Investigator Console to render network visualisations, community analysis, and entity risk profiles.

---

## Endpoint Catalog

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/graph/statistics` | GET | Returns global graph topology and quality metrics |
| `/api/v1/graph/communities` | GET | Lists all communities with risk tiers (paginated) |
| `/api/v1/graph/community/{id}` | GET | Deep-dive into a specific community |
| `/api/v1/graph/entity/{id}` | GET | Full profile of a single entity |
| `/api/v1/graph/entity/{id}/neighbors` | GET | 1-hop neighbourhood of an entity |
| `/api/v1/graph/entity/{id}/risk` | GET | Propagated risk score and contributing factors |
| `/api/v1/graph/network/{case_id}` | GET | Subgraph surrounding a specific transaction case |
| `/api/v1/graph/path` | GET | Shortest path between two entities |
| `/api/v1/graph/subgraph` | POST | Extract an arbitrary subgraph by entity list |

---

## Response Contracts

### GET `/api/v1/graph/statistics`
```json
{
  "total_nodes": 15302,
  "total_edges": 24115,
  "density": 0.000103,
  "connected_components": 42,
  "average_degree": 3.15,
  "assortativity": -0.028,
  "average_clustering_coefficient": 0.0,
  "transitivity": 0.0,
  "triangle_count": 0
}
```

### GET `/api/v1/graph/communities?page=1&limit=20&risk=critical`
```json
{
  "communities": [
    {
      "community_id": 17,
      "size": 32,
      "fraud_percentage": 0.45,
      "density": 0.0312,
      "central_node": "DEV_00142",
      "risk_tier": "High",
      "explanation": "Community 17 contains 32 entities with a 45.0% fraud concentration..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 142 }
}
```

### GET `/api/v1/graph/entity/{id}`
```json
{
  "entity_id": "DEV_00142",
  "entity_type": "Device",
  "degree": 14,
  "community_id": 17,
  "risk_score": 0.88,
  "risk_tier": "Critical",
  "centrality": {
    "pagerank": 0.0071,
    "betweenness": 0.0613,
    "closeness": 0.3087,
    "eigenvector": 0.134
  }
}
```

### GET `/api/v1/graph/network/{case_id}`
Returns nodes/edges formatted for React Flow or Cytoscape.js:
```json
{
  "nodes": [
    { "id": "TXN_000042", "type": "Transaction", "label": "TXN_000042", "risk": 0.98, "community": 17 },
    { "id": "CUS_00025", "type": "Customer", "label": "CUS_00025", "risk": 0.72, "community": 17 },
    { "id": "DEV_00142", "type": "Device", "label": "DEV_00142", "risk": 0.88, "community": 17 }
  ],
  "edges": [
    { "source": "CUS_00025", "target": "TXN_000042", "relationship": "INITIATED" },
    { "source": "TXN_000042", "target": "DEV_00142", "relationship": "EXECUTED_ON" }
  ]
}
```

### GET `/api/v1/graph/path?from=CUS_00025&to=CUS_00089`
```json
{
  "path": ["CUS_00025", "TXN_000042", "DEV_00142", "TXN_000099", "CUS_00089"],
  "length": 4,
  "shared_entities": ["DEV_00142"]
}
```
