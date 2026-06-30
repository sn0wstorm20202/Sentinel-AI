# Phase 10 Developer Guide

This document is the absolute blueprint for building the **Sentinel AI Investigator Dashboard**.

## Overview
**The Backend is COMPLETE.**

The Frontend team is responsible only for:
- UI
- State Management
- API Calls
- Visualization
- Authentication UI

**CRITICAL RULES:**
- No ML logic in the frontend.
- No SHAP computation.
- No Graph algorithms.
- No Decision logic.

Everything comes purely from Backend APIs and strict JSON Contracts.

---

## Recommended Tech Stack
- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **State/Fetching**: React Query (TanStack Query) + Axios
- **Routing**: React Router
- **Visualization**: React Flow (Graph), Recharts (SHAP/Charts)
- **Animation**: Framer Motion
- **Forms & Validation**: React Hook Form + Zod

---

## Required Pages
- Login
- Dashboard
- Case Queue
- Case Details
- Investigator View
- Graph Explorer
- Model Monitoring
- Settings
- Profile
- 404

---

## Components
- Navbar
- Sidebar
- Risk Badge
- Metric Cards
- Timeline
- Evidence Card
- Recommendation Card
- Hypothesis Card
- Graph Viewer
- SHAP Chart
- Community Viewer
- Alert Banner
- Loading Skeleton
- Toast
- Search
- Pagination

---

## API Mapping
| UI View | API Endpoint |
| :--- | :--- |
| **Dashboard** | `GET /dashboard` |
| **Case Queue** | `GET /cases` |
| **Case Details** | `GET /cases/{id}` |
| **Explain** | `POST /cases/explain` |
| **Graph** | `GET /graph/network/{case_id}` |
| **Communities** | `GET /graph/community/{id}` |

---

## State Management
We strongly recommend **TanStack Query** for:
- Caching
- Retry logic
- Polling
- Optimistic Updates

---

## Deployment Instructions

1. Clone backend repository
2. Install python requirements (`pip install -r requirements.txt`)
3. Run FastAPI (`uvicorn src.api.InvestigatorAPI:app --reload`)
4. Verify Swagger UI at `http://localhost:8000/docs`
5. Clone frontend repository (or `cd frontend`)
6. Run `npm install`
7. Create `.env` file (see `.env.example`)
8. Run `npm run dev`
9. Connect APIs
10. Test Dashboard End-to-End
11. Build Docker Compose configuration
12. Deploy to Production

---

## Definition of Done (DoD)
The frontend is officially considered complete when:

- [ ] All backend endpoints are integrated.
- [ ] No mocked data remains.
- [ ] All graphs render using live API data.
- [ ] Investigator workflow functions end-to-end.
- [ ] Loading and error states are elegantly implemented.
- [ ] Responsive UI works flawlessly on desktop.
- [ ] Lighthouse performance score > 90.
- [ ] TypeScript build passes without errors.
- [ ] Production build succeeds.
