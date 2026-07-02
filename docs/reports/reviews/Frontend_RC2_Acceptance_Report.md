# Frontend RC-2 Acceptance Report — Sentinel AI

**Reviewer:** Principal Frontend Engineer & Staff Product Designer
**Date:** 2026-07-02
**Environment:** Next.js 16.2.9 (Turbopack), production build, Chromium headless
**Benchmark:** Palantir Foundry, Bloomberg Terminal, Datadog, Stripe Dashboard, Elastic Kibana

---

## Overall Verdict

| | |
|---|---|
| **Overall Score** | **52 / 100** |
| **Decision** | **FAIL — Conditional pass with 20 blockers** |
| **Production Readiness** | **38%** |

> [!CAUTION]
> This application is not ready for production deployment at an enterprise banking institution. While the architectural direction (master-detail, cross-panel sync, contextual copilot) is correct, the execution is incomplete across nearly every dimension. The issues below are ordered by severity.

---

## 1. Investigator Workflow

| Step | Status | Finding |
|---|---|---|
| Open dashboard | ✅ PASS | `/cases` loads with queue visible |
| Search for a case | ❌ FAIL | Filter input is a **dead element**. No `onChange` handler filters data. `Cmd+K` is a placeholder label with zero implementation. |
| Filter investigations | ❌ FAIL | No filtering logic exists. `getFilteredRowModel` is not configured on the table. |
| Open case without losing queue | ✅ PASS | Master-detail layout preserves queue on left panel via `cases/layout.tsx`. |
| Navigate evidence | ⚠️ PARTIAL | Evidence Board renders but does not actually filter by `selectedNodeId` — it reads the value and displays a badge, but the `uniqueFeatures` array is never filtered. |
| Inspect SHAP explanations | ❌ FAIL | No SHAP visualisation exists. The hypothesis panel shows a text summary and confidence scores, but no SHAP waterfall, beeswarm, or feature importance chart. |
| Interact with graph | ⚠️ PARTIAL | Nodes are selectable and sync to store. But: no right-click context menu, no edge labels rendered, no expand/collapse, no clustering, no semantic grouping. |
| Receive Copilot recommendations | ⚠️ PARTIAL | Copilot responds with hardcoded strings via `setTimeout`. No actual AI/backend integration. Responses are identical regardless of context. |
| Return to queue instantly | ✅ PASS | Queue panel is always mounted. Clicking another case row loads new detail. |

**Workflow interruptions identified: 4 hard blockers, 3 partial failures.**

---

## 2. Context Preservation

| Context | Persists? | Finding |
|---|---|---|
| Selected case | ⚠️ PARTIAL | URL-driven via `params.id`, but `router.push()` triggers a full server-side navigation on dynamic routes — React state in the detail panel resets. |
| Graph selection | ❌ FAIL | `selectedNodeId` lives in Zustand in-memory only. Navigating away and back resets it. The `initialNodes` memo recalculates with `Math.random()` positions on every case switch, producing a **different layout every time**. |
| Copilot context | ❌ FAIL | `useEffect` on `caseId` runs `setMessages([...])` which **completely wipes** the conversation when switching cases. No history persistence. |
| Panel sizes | ❌ FAIL | `react-resizable-panels` `defaultSize` values are not persisted. Refreshing the page resets all panels to 25/55/20. No `localStorage` or cookie-based persistence. |
| Filters | ❌ FAIL | Filter input is non-functional (see §1). |
| Search | ❌ FAIL | Search bar in topbar is a button with no implementation. |

**0 out of 6 context types are fully preserved.**

---

## 3. Cross-Panel Synchronization

```
Case Queue → Graph → Evidence → Timeline → Copilot → Recommendation Engine
```

| Link | Status | Finding |
|---|---|---|
| Queue → Graph | ✅ Works | Selecting a case loads graph data via `useCaseGraph`. |
| Graph → Evidence | ❌ BROKEN | `selectedNodeId` is read in `EvidenceBoard` but never used to filter the `uniqueFeatures` array. The badge renders "Filtered by: X" but the data is identical. |
| Graph → Copilot | ⚠️ PARTIAL | Copilot receives a system message on node selection, but the response content is hardcoded and identical for every node. |
| Evidence → Copilot | ❌ MISSING | No link. Clicking an evidence row does nothing. |
| Timeline | ❌ MISSING | No timeline component exists anywhere in the codebase. |
| Recommendation Engine | ⚠️ STATIC | `action_engine.recommended_actions` is rendered in the Hypothesis Panel, but it is read-only with no interaction, approval workflow, or status tracking. |

**True end-to-end synchronization: 1 out of 6 links functional.**

---

## 4. Desktop Experience

### 4.1 Information Density

| Aspect | Score | Notes |
|---|---|---|
| Cases queue density | 7/10 | Good: compact rows with `py-1.5`, monospaced IDs. Missing: risk tier column, date, transaction ID — critical fields stripped to fit narrow panel. |
| Evidence table density | 6/10 | Acceptable padding. But: `Impact` column shows "Elevated" for every row via `i % 2` modulo — fake data masquerading as real. |
| Hypothesis panel density | 4/10 | SaaS-level padding. `text-3xl` risk score, large cards with generous margins. Should be compact tabular data for an investigator OS. |
| MLOps density | 5/10 | Standard dashboard template. `p-8` page padding is excessive for a professional tool. |

### 4.2 Typography

| Aspect | Score | Notes |
|---|---|---|
| Font system | 7/10 | Inter is a strong choice. `font-mono` correctly applied to IDs and scores. |
| Heading hierarchy | 4/10 | Inconsistent: `text-3xl` in MLOps, `text-sm` in case detail header, `text-lg` in hypothesis cards. No systematic type scale. |
| Tabular numbers | 6/10 | `font-mono` used in tables, but `tabular-nums` CSS property is not explicitly set anywhere in `globals.css`. |

### 4.3 Keyboard Navigation

| Feature | Status |
|---|---|
| `j/k` row navigation | ❌ Missing |
| `Cmd+K` command palette | ❌ Missing (label exists, no implementation) |
| `Escape` to deselect | ❌ Missing |
| Tab focus management | ❌ No `tabIndex` or focus trap on panels |
| Arrow key graph navigation | ❌ Missing |

**Keyboard navigation: 0% implemented.**

### 4.4 Visual Balance & Professional Appearance

The application defaults to a monochromatic oklch neutral palette (all hue=0, chroma=0). This is safe but reads as generic. Compared to Palantir's dark blue workspace or Bloomberg's orange-on-black terminal, Sentinel AI lacks a distinctive identity. The `destructive` color is the only chromatic accent.

---

## 5. Enterprise Quality Benchmark

| Category | Palantir Foundry | Bloomberg Terminal | Datadog | Stripe Dashboard | Elastic Kibana | **Sentinel AI** |
|---|---|---|---|---|---|---|
| Information Density | 9 | 10 | 8 | 7 | 8 | **5** |
| Navigation | 9 | 8 | 9 | 9 | 8 | **4** |
| Hierarchy | 9 | 7 | 8 | 9 | 7 | **5** |
| Cognitive Load | 8 | 6 | 8 | 9 | 7 | **5** |
| Visual Balance | 8 | 6 | 9 | 10 | 7 | **6** |
| Workflow | 10 | 9 | 9 | 8 | 8 | **4** |
| Investigator Efficiency | 10 | 9 | 7 | 6 | 7 | **3** |
| Graph Experience | 10 | 5 | 6 | 3 | 7 | **3** |
| MLOps Experience | 7 | 4 | 10 | 5 | 8 | **4** |
| Copilot / AI | 8 | 3 | 7 | 6 | 5 | **2** |
| Consistency | 9 | 8 | 9 | 10 | 7 | **5** |
| Professional Appearance | 9 | 7 | 9 | 10 | 7 | **6** |

**Sentinel AI Average: 4.3 / 10**

---

## 6. Production Readiness

| Check | Status | Notes |
|---|---|---|
| Build (`next build`) | ✅ PASS | 0 errors, compiled in 12.7s |
| TypeScript (`tsc`) | ✅ PASS | 0 type errors |
| ESLint | ❌ FAIL | **4 errors, 7 warnings.** `Math.random()` purity violations (2), `setState` in effect (2), unused imports (5). See §6.1. |
| Accessibility | ❌ FAIL | No `aria-label` on queue panel table rows. No `role="navigation"` on sidebar `<nav>`. Graph nodes have no keyboard accessibility. Copilot messages have no `aria-live` region. |
| Motion / Reduced Motion | ✅ PASS | `prefers-reduced-motion` CSS blanket + `useReducedMotion()` hook in all animated components. |
| Performance | ⚠️ CONCERN | ECharts lazy-loaded correctly. But `Math.random()` in `useMemo` for node positions (line 43, network-graph.tsx) causes layout instability on every re-render. |
| API Integration | ⚠️ MOCK ONLY | All API calls return hardcoded mock data via `setTimeout`. `apiClient` (axios) is configured but never called. |
| Error Boundaries | ❌ FAIL | No React `ErrorBoundary` component exists anywhere. An unhandled exception in the graph canvas will crash the entire workspace. |
| Loading States | ✅ PASS | Skeleton components exist for case detail. ECharts has `animate-pulse` fallback. |
| Empty States | ✅ PASS | `/cases` shows "No Case Selected" with icon and description. |
| Offline Handling | ❌ FAIL | No offline detection. No service worker. No `navigator.onLine` check. Mock data masks the issue. |
| Responsive Behaviour | ❌ FAIL | Fixed `h-screen` layout with horizontal `ResizablePanelGroup`. No breakpoint handling. Completely unusable below 1024px. |

### 6.1 ESLint Results (4 errors, 7 warnings)

```
chat-panel.tsx:28  ERROR  setState synchronously within effect (cascading renders)
chat-panel.tsx:41  ERROR  setState synchronously within effect (cascading renders)
network-graph.tsx:43  ERROR  Math.random() is impure — cannot call during render
network-graph.tsx:44  ERROR  Math.random() is impure — cannot call during render
custom-node.tsx:6   WARN   'useInvestigationStore' unused import
custom-node.tsx:16  WARN   'id' defined but never used
network-graph.tsx:3  WARN   'useEffect' unused import
network-graph.tsx:6  WARN   'MiniMap' unused import
network-graph.tsx:15 WARN   'NodeChange' unused import
network-graph.tsx:49 WARN   'setNodes' assigned but never used
cases-table.tsx:71  WARN   Incompatible library (TanStack Table memoization)
```

---

## 7. Brutal Review — Top 20 Weaknesses

> [!WARNING]
> If I were rejecting this project, these would be the reasons.

| # | Severity | Issue |
|---|---|---|
| 1 | 🔴 BLOCKER | **Duplicate Copilot rendering.** `dashboard/layout.tsx` conditionally mounts `CopilotPanel` (line 64), AND `cases/layout.tsx` unconditionally mounts a second `CopilotPanel` (line 32). When `activePanel === 'copilot'` in the dashboard layout AND the user is on `/cases`, **two independent Copilot instances render simultaneously** with separate state. |
| 2 | 🔴 BLOCKER | **Filter input is decorative.** The `<Input>` in `cases-table.tsx` has no `onChange` handler that filters data. `getFilteredRowModel` is not configured on the table. |
| 3 | 🔴 BLOCKER | **Graph positions are random.** `Math.random()` inside `useMemo` (network-graph.tsx:43) violates React's purity contract and produces a different graph layout on every re-render. This is not just a visual bug — it destroys investigator spatial memory. |
| 4 | 🔴 BLOCKER | **No Error Boundaries.** A single unhandled throw in any child component will white-screen the entire application. Enterprise platforms require granular error isolation. |
| 5 | 🔴 BLOCKER | **Evidence Board filtering is fake.** `selectedNodeId` is consumed and displayed as a badge label but never used to actually filter the `uniqueFeatures` array. The feature list is always identical. |
| 6 | 🟠 CRITICAL | **No SHAP visualization.** The UX Review explicitly required SHAP explanations. The hypothesis panel shows `confidence` percentages and text summaries, but no feature attribution chart. |
| 7 | 🟠 CRITICAL | **Copilot is a hardcoded echo chamber.** All responses are identical template strings injected via `setTimeout(500)`. There is no backend call, no prompt engineering, no function calling. |
| 8 | 🟠 CRITICAL | **Panel sizes not persisted.** `react-resizable-panels` supports `autoSaveId` prop for localStorage persistence. It is not used. Every page refresh resets the workspace layout. |
| 9 | 🟠 CRITICAL | **Copilot chat history destroyed on case switch.** The `useEffect` on `caseId` replaces the entire message array. Returning to a previous case shows no history. |
| 10 | 🟠 CRITICAL | **Sidebar nav items link to non-existent routes.** `/health` and `/settings` are in the sidebar but have no corresponding `page.tsx`. Clicking them renders a 404 inside the dashboard layout. |
| 11 | 🟠 CRITICAL | **Zero keyboard shortcuts.** No `j/k`, no `Cmd+K`, no `Escape`, no arrow navigation. An investigator OS without keyboard shortcuts is a contradiction. |
| 12 | 🟡 MAJOR | **MLOps page still uses stagger animations on data.** `motion.div` with `staggerContainer` and `fadeUpItem` variants on stat cards and table rows — directly contradicts the UX Review guidance to strip data-rendering animations. |
| 13 | 🟡 MAJOR | **Hypothesis Panel still uses stagger animations.** Same issue. `staggerContainer`, `staggerContainerFast`, `fadeUpItem` on every card and action — slows perceived data availability. |
| 14 | 🟡 MAJOR | **No graph edge labels.** Edges exist (`INITIATED`, `SENT_TO`, `EXECUTED_ON`) in the mock data with `label` fields, but ReactFlow renders them as plain lines with no visible labels. |
| 15 | 🟡 MAJOR | **`custom-node.tsx` imports `useInvestigationStore` but never uses it.** Dead import on line 6. |
| 16 | 🟡 MAJOR | **`network-graph.tsx` imports `useEffect` and `NodeChange` but never uses them.** Dead imports on lines 3 and 15. |
| 17 | 🟡 MAJOR | **Evidence "Impact" column is fake.** `i % 2 === 0 ? "destructive" : "secondary"` and every row says "Elevated". This is cosmetic noise, not real data. |
| 18 | 🟡 MAJOR | **Evidence "Risk Weight" is a descending formula.** `(0.4 - i * 0.1).toFixed(2)` goes negative after 4 rows. This will display `-0.10`, `-0.20` etc. as "risk weights". |
| 19 | 🟡 MAJOR | **No MiniMap on graph.** `MiniMap` is imported in `network-graph.tsx` (line 6) but not rendered in JSX. The import is dead. |
| 20 | 🟡 MAJOR | **`willChange: 'width'` on sidebar.** Permanently promoting the sidebar to its own compositing layer via `willChange` is an anti-pattern when the animation is infrequent. Should be applied dynamically during animation only. |

---

## 8. Architecture Conflict: Dual Layout Problem

The nesting of `(dashboard)/layout.tsx` → `cases/layout.tsx` creates a structural conflict:

```
Root Layout
└── Dashboard Layout (sidebar + topbar + optional copilot panel)
    └── Cases Layout (queue + detail + copilot panel)  ← SECOND COPILOT
        └── Case Detail Page
```

The outer dashboard layout wraps ALL pages and has its own `ResizablePanelGroup` with an `AnimatePresence`-driven copilot panel toggled by the topbar "AI Copilot" button. The inner cases layout has a permanently-mounted copilot panel. **These are two completely independent React component trees with separate state.**

This means:
- On `/cases`, the user sees the inner copilot (always visible) and can ALSO open the outer copilot via the topbar button.
- Messages typed in one do not appear in the other.
- On `/mlops`, only the outer copilot is available (and only when toggled).

This is an architectural contradiction that must be resolved before production.

---

## 9. Final Assessment

| Criterion | Target | Actual | Status |
|---|---|---|---|
| Investigator can complete a full workflow without interruption | Required | 4 hard blockers in the workflow | ❌ FAIL |
| All context persists across interactions | Required | 0/6 types fully persist | ❌ FAIL |
| Cross-panel synchronization works end-to-end | Required | 1/6 links functional | ❌ FAIL |
| Enterprise-grade keyboard navigation | Required | 0% implemented | ❌ FAIL |
| Build + TypeScript + ESLint clean | Required | Build ✅, TS ✅, ESLint ⚠️ | ⚠️ PARTIAL |
| Error boundaries on all panel boundaries | Required | None exist | ❌ FAIL |
| No duplicate component mounting | Required | Copilot renders twice | ❌ FAIL |
| Graph produces stable layouts | Required | `Math.random()` positions | ❌ FAIL |

**RC-2 Status: REJECTED.**

The application has the correct architectural skeleton (master-detail, Zustand sync, custom graph nodes, contextual copilot) but the wiring is incomplete. Approximately 60% of the promised functionality is either decorative (filter input, evidence filtering, copilot responses) or structurally broken (dual copilot, random graph positions, no persistence).

---

## 10. Path to Acceptance

The 20 items above, addressed in priority order, would bring this application to approximately **75–80% production readiness**. Full production readiness (95%+) would additionally require:

- Real backend API integration (replacing mock `setTimeout` calls)
- E2E test suite (Playwright)
- CSP headers and security review
- Deployment pipeline (CI/CD)
- Observability (error tracking, analytics)
- Internationalisation framework
- Comprehensive accessibility audit (WCAG 2.1 AA)
