# Frontend Integration Guide (Phase 10)

This document serves as the primary contract for frontend engineers building the React Dashboard.

## Architecture Paradigm
The dashboard is a visualization layer. **All business logic, risk scoring, and intelligence generation occurs on the backend.** 
The frontend simply renders what the Sentinel Orchestrator provides.

## Data Flow
```text
React Dashboard
      │
      ▼
REST API (FastAPI)
      │
      ▼
Sentinel Orchestrator
      │
      ▼
Decision Engine + Fraud Intelligence Engine + Graph Engine
```

## Key Views & Corresponding APIs

### 1. Alert Triage / Case Queue
- **View**: A table of flagged transactions sorted by Risk Score.
- **Integration**: The frontend handles routing and state. The backend provides the risk tier for coloring (Critical = Red, High = Orange).

### 2. Investigator Copilot View
- **View**: The deep-dive page for a single case.
- **Integration**: Hits `POST /api/v1/cases/explain`.
- **Renders**:
  - The NLG summary at the top as an "Executive Briefing".
  - A ranked list of Evidence (SHAP facts).
  - Fraud Hypotheses with Confidence bars.
  - Actionable Recommendations.

### 3. Network / Graph View
- **View**: An interactive graph showing connected entities.
- **Integration**: Hits `GET /api/v1/graph/network/{case_id}`.
- **Renders**: Use React Flow or Cytoscape.js. The API returns exactly `{"nodes": [...], "edges": [...]}` in the required format. Nodes contain risk metadata for coloring.

## Error Handling
The API returns standard HTTP status codes:
- `200 OK`: Successful response.
- `400 Bad Request`: Malformed JSON or missing required fields.
- `404 Not Found`: Entity or Case ID not found in the graph.
- `500 Internal Server Error`: Pipeline failure (check backend logs).
- `503 Service Unavailable`: Artifacts missing (e.g., Graph not built yet).


---

## Navigation

[🏠 Home](../README.md) | [⬅️ Previous](07_API_REFERENCE.md) | [Next ➡️](09_DEPLOYMENT.md)
