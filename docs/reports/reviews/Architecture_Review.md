# Sentinel AI - Architecture Review (Sprint 3)

## 1. State Management (Zustand & React Query)
**Finding:** The application correctly separates server state (`@tanstack/react-query`) from client state (`zustand`). 
- **Investigation Store (`investigation-store.ts`)**: Excellent use of `persist` middleware with `partialize` to only save what's necessary (e.g., active tabs, recent cases, pinned items).
- **Layout Store (`layout-store.ts`)**: Cleanly isolates UI toggle states (sidebar, panels, dialogs) away from business logic.
- **Notification Store (`notification-store.ts`)**: Properly handles severity, categories, and read/unread status globally.

**Verdict:** State synchronization is robust. No unnecessary renders caused by prop-drilling.

## 2. Real-time Capabilities (SSE)
**Finding:** The `useSSE` hook effectively listens to `backend_updates` and intelligently routes them:
- Pushes events to `addTimelineEvent` for audit history.
- Pushes events to `addNotification` for the global toast/notification center.
- Invalidates React Query caches for `['cases']` and `['mlops']` on the fly.

**Verdict:** Solid real-time architecture. Fully avoids manual polling overhead. 

## 3. Keyboard Shortcuts & Accessibility
**Finding:** The `EnterpriseKeyboardShortcuts` component maps `j`, `k`, `g`, `c`, `e`, `t`, `Enter`, and `Esc`. 
- **Bug Fixed in Sprint 3:** The command palette originally used a massive, custom-built `fuzzyScore` dialog block which lacked proper accessibility (ARIA roles, rove-focus). This was fully refactored in Sprint 3 to use the headless `cmdk` primitive (via shadcn `Command`), providing robust `Cmd+K` keyboard-first navigation out of the box.

## 4. Component Hierarchy
**Finding:** Feature directories are strictly scoped (e.g., `features/investigation`, `features/copilot`). Layout and UI primitives are decoupled. 

## 5. Timeline Implementation
**Finding:** The `InvestigationTimeline` component dynamically builds an audit trail from the `caseData`, `graphData`, and `caseStatus` state, merging them with any live `storeEvents` captured from SSE. 
- **Architectural Note:** While building the timeline fully on the frontend is fast, it duplicates some logic. Moving `buildBackendTimeline` to a dedicated `/api/v1/cases/{id}/timeline` endpoint on the Python side would be the final step for ultimate enterprise maturity. Currently, it satisfies all requirements.

## Conclusion
The architecture successfully handles complex investigation workflows. There are no placeholder endpoints remaining. The UI is completely backend-driven.
