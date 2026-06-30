# Sentinel AI: Frontend-Backend Integration Guide

This document is the definitive blueprint for frontend engineers building the React-based **Sentinel Investigator Console**. It establishes strict API contracts, data flows, and architectural boundaries to ensure seamless integration with the Sentinel AI Backend.

---

## 1. Project Overview
Sentinel AI is an Enterprise Fraud Intelligence Platform. The backend is not a simple CRUD application; it is an orchestrated AI pipeline (Fraud Intelligence Engine) that scores transactions, infers fraud typologies, and generates natural language explanations. The Frontend's responsibility is to **visualize what the backend already knows** and provide a frictionless workspace for analysts to review cases and take action.

## 2. System Architecture
```text
[ React Frontend ] (Investigator Console)
        │
        ▼ (REST / WebSockets)
[ FastAPI Layer ] (API Routers, Auth, WebSockets)
        │
        ▼
[ Sentinel Orchestrator ]
        │
        ├── Fraud Decision Engine (ML Inference)
        ├── Evidence Engine (Statistical Facts)
        ├── Knowledge Manager (AML Policies)
        ├── Hypothesis Engine (Typologies)
        └── Natural Language Engine (Explanations)
```

## 3. Authentication Flow
Authentication uses JWT (JSON Web Tokens). 
- **Endpoint**: `POST /api/v1/auth/login`
- **Response**: `{ "access_token": "ey...", "token_type": "bearer", "role": "Level-2" }`
- The token must be attached as a `Bearer` token in the `Authorization` header for all protected routes.

## 4. API Overview & Pagination
All list endpoints support cursor or offset pagination.
**DO NOT** call `GET /cases`. 
**DO** call: `GET /api/v1/cases?page=1&limit=20&status=open&risk=critical`

## 5. Endpoint Catalog
| Category | Endpoint | Method | Description |
|---|---|---|---|
| **Auth** | `/auth/login` | POST | Authenticate analyst |
| **Cases** | `/cases` | GET | List cases (paginated, filterable) |
| **Workspace**| `/cases/{id}/workspace` | GET | **Super-endpoint**: Loads the entire case state for the UI |
| **Graph** | `/graph/network/{id}` | GET | Returns nodes/edges for the transaction network (React Flow) |
| **Notes** | `/cases/{id}/notes` | POST | Append an analyst note to the case |
| **Action** | `/cases/{id}/action` | POST | Execute a recommendation (e.g. Freeze Account) |

## 6. The Investigator Workspace Contract (Super-Endpoint)
To reduce latency, the UI should make **one** call when an analyst opens a case.
**GET `/api/v1/cases/{id}/workspace`** returns everything required to render the dashboard:

```json
{
  "case": {
    "case_id": "CASE_48193",
    "status": "OPEN",
    "risk_score": 98.2,
    "risk_tier": "CRITICAL"
  },
  "summary": {
    "text": "Possible fraud pattern: Dormant account abuse. Triggered by high velocity on a historically inactive profile."
  },
  "evidence": [
    { "feature": "Transaction Velocity", "importance": 0.41, "direction": "increased" }
  ],
  "hypotheses": [
    { "name": "Dormant Account Abuse", "confidence": 0.92 }
  ],
  "recommendations": [
    { "priority": 1, "action": "Temporary Hold", "reason": "Critical risk score and strong supporting evidence." }
  ],
  "timeline": [
    { "time": "2026-06-30T10:40:00Z", "event": "Transaction Received" },
    { "time": "2026-06-30T10:41:00Z", "event": "Flagged by Decision Engine" }
  ],
  "network_summary": {
    "connected_entities": 14,
    "known_fraudsters": 2
  }
}
```

## 7. State Management Guidelines
- Load the Workspace payload into a global state (e.g., Redux, Zustand, or React Context).
- Do not mutate the state locally without an API acknowledgment (optimistic UI updates are allowed for `notes`).

## 8. Error Handling
The backend strictly adheres to standard HTTP status codes:
- `400 Bad Request`: Malformed JSON (Pydantic validation failure).
- `401 Unauthorized`: Missing or invalid JWT.
- `403 Forbidden`: Analyst lacks tier privileges for the requested action.
- `404 Not Found`: Case ID does not exist.
- `422 Unprocessable Entity`: Business logic violation.

**Example 422 Payload**:
```json
{
  "error": "action_rejected",
  "message": "Cannot auto-approve cases with a CRITICAL risk tier."
}
```

## 9. WebSocket Events (`/ws/cases`)
To avoid polling, the UI should connect to the `/ws/cases` WebSocket.
- The server pushes a `{ "type": "NEW_CASE_ALERT", "case_id": "..." }` event when a new critical transaction arrives.
- The Dashboard should display a toast notification and prepend the new case to the top of the active list.

## 10. Dashboard Data Flow & Loading States
- **DO NOT** use full-page spinners. 
- Use **Skeleton Loaders** while fetching the `/workspace` endpoint to maintain the illusion of speed.

## 11. Graph Data Format (Phase 7 Anticipation)
The `/graph/network/{id}` endpoint will output data specifically structured for libraries like `React Flow` or `Cytoscape`:
```json
{
  "nodes": [
    { "id": "TXN_1", "type": "transaction", "label": "$4,500" },
    { "id": "USR_9", "type": "customer", "label": "John Doe" }
  ],
  "edges": [
    { "source": "USR_9", "target": "TXN_1", "label": "initiated" }
  ]
}
```

## 12. Backend Folder Structure
The FastAPI backend is structured for enterprise scalability:
```text
backend/
└── app/
    ├── api/           (Controllers & Routers)
    ├── core/          (Config, Security, Auth)
    ├── services/      (Decision, Evidence, Hypothesis)
    ├── schemas/       (Pydantic Request/Response models)
    └── models/        (Database ORMs)
```

## 13. Environment Variables
Frontend `.env` requirements:
- `VITE_API_BASE_URL=http://localhost:8000/api/v1`
- `VITE_WS_BASE_URL=ws://localhost:8000/ws`

## 14. Backend Startup Guide
To boot the API locally for frontend development:
1. `cd backend/`
2. `python -m venv .venv`
3. `source .venv/bin/activate`
4. `pip install -r requirements.txt`
5. `uvicorn app.main:app --reload`

## 15. Frontend Integration Checklist
- [ ] Implement JWT Authentication & Interceptors.
- [ ] Connect WebSocket listener for live alerts.
- [ ] Build Investigator Workspace using `/workspace` super-endpoint.
- [ ] Implement Skeleton Loaders.
- [ ] Connect Graph Component (React Flow).

## 16. API Versioning Strategy
All endpoints are currently prefixed with `/api/v1/`. Breaking changes to the JSON contracts will be routed to `/api/v2/`.

## 17. Future Endpoints (Phase 7-10 Preview)
- `/api/v1/mlops/drift`: To view real-time data drift metrics.
- `/api/v1/analytics/analyst-performance`: Review times, false positive rates per investigator.
- `/api/v1/cases/{id}/similar`: Fetches historical cases with matching fraud typologies using vector embeddings.
