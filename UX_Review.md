# UX & Engineering Review: Sentinel AI 

**Reviewer Role:** Staff Product Designer & Principal Frontend Engineer
**Benchmark Context:** Palantir Foundry, Bloomberg Terminal, Datadog, Stripe Dashboard, Linear, Vercel
**Date:** 2026-07-02

---

## 1. Executive Summary
This application currently feels like a basic Next.js + shadcn/ui boilerplate rather than a high-performance Enterprise Fraud Intelligence Platform. It leans heavily on "out-of-the-box" aesthetics, severely sacrificing the high information density, keyboard-first workflow, and complex pane management expected from professional tooling (e.g., Bloomberg, Foundry). If an investigator is going to spend 8 hours a day in this tool, the current design will artificially cap their productivity.

## 2. Information Density & Visual Balance
* **Critique:** The information density is unacceptably low for a data-heavy application. 
* **Details:** 
  * You are using standard SaaS padding and typography scales (similar to a consumer app). Fraud investigators need to scan hundreds of rows, not 5.
  * The `CasesTable` has massive whitespace. It should look closer to Linear's list views or Bloomberg's data grids—compact, tightly spaced, utilizing monospaced fonts for IDs (`TXN_884910`) and scores.
  * Badges (`<Badge>`) inside tables draw too much attention to themselves and break vertical scanning rhythm.
* **Verdict:** Fails the benchmark. Needs a "compact mode" by default, strict tabular tabular-nums, and drastically reduced cell padding.

## 3. Workflow & Investigator Efficiency
* **Critique:** The navigation paradigm disrupts the investigation loop.
* **Details:** 
  * Clicking a case row currently triggers a hard route change (`router.push('/cases/CASE_123')`). This forces a context switch and destroys the investigator's position in the list.
  * **Datadog / Linear Benchmark:** Clicking a row should open a sliding side-panel (or split view) so the user never loses context of the main queue.
  * Missing advanced filtering, multi-select, bulk actions, and keyboard shortcuts. There is no evidence of `j/k` navigation or command palette (`Cmd+K`) integration.
* **Verdict:** The workflow is built for casual browsing, not intense, high-speed triage.

## 4. Graph Experience (ReactFlow)
* **Critique:** The graph implementation is a toy. 
* **Details:**
  * It uses default `ReactFlow` nodes and edges. There are no custom node types to represent entities (Users, Cards, IP Addresses) with embedded metadata.
  * A true investigation graph (like Palantir Foundry) requires semantic clustering, expand/collapse edge physics, timeline playback, and deep interactivity.
  * The current graph is a static, non-interactive visual widget. 
* **Verdict:** Completely inadequate for "Graph Intelligence". Needs a complete rewrite with custom ReactFlow nodes, force-directed layouts (via cytoscape or d3), and right-click context menus.

## 5. MLOps Experience (ECharts)
* **Critique:** Barebones and disconnected.
* **Details:**
  * The `MetricsChartInner` provides a standard two-line chart. It lacks Datadog-level features like synchronized crosshairs, brush-to-zoom, anomaly highlighting, or log-scale toggles.
  * Missing contextual tooltips that link model drift to specific data subsets. 
* **Verdict:** Acceptable as a dashboard widget, but fails as a deep MLOps debugging tool.

## 6. Copilot Experience
* **Critique:** A bolted-on gimmick rather than an integrated assistant.
* **Details:**
  * The Copilot (`chat-panel.tsx`) sits in isolation. A proper implementation (like Github Copilot Workspace or Foundry's AI) would be bi-directionally aware. If the user asks "Why is this risk high?", the Copilot should highlight the exact nodes in the `NetworkGraph` and filter the `EvidenceBoard`. 
  * Visually, it uses generic chat bubbles. It needs to return structured UI components (tables, mini-graphs) inside the chat stream, not just strings of text.
* **Verdict:** Feels like a generic ChatGPT wrapper rather than a contextual, graph-aware assistant.

## 7. Navigation & Hierarchy
* **Critique:** Overly simplistic.
* **Details:**
  * The `Sidebar` uses a basic toggle state but relies on animating the wrapper. 
  * Lacks a clear hierarchy of workspaces. Where are the investigator teams? Where are the saved queries? The hierarchy assumes a single-tenant, single-user mental model.
* **Verdict:** Needs a more complex, structured navigation system (e.g., Stripe's multi-tier navigation or Linear's team/project scoping).

## 8. Cognitive Load & Consistency
* **Critique:** Cognitive load is ironically high because the data isn't structured for expert scanning.
* **Details:** 
  * "use no memo" pragma left in the code (`cases-table.tsx`).
  * Framer motion animations are present but applied generically (e.g., staggered rows). In data-heavy apps, staggered animations slow down experts. Data should appear instantly. Animations should be reserved for state transitions (e.g., opening a panel), not data rendering.
  * A mix of arbitrary hardcoded UI sizes and basic generic Tailwind classes without a strict, unified design token system beyond the basics.
* **Verdict:** Strip out list-rendering animations. Optimize for 0ms visual latency.

## Final Summary
To compete with the likes of Palantir Foundry or Bloomberg, this application must mature from a "good-looking SaaS template" into a "dense, keyboard-driven professional workspace." 

**Immediate Action Items:**
1. Implement a master-detail split pane layout for cases.
2. Strip padding across all tables; enforce tabular-nums.
3. Build semantic, custom nodes for the Network Graph.
4. Integrate the Copilot deeply into the application state so it can manipulate the UI.
5. Add global keyboard shortcuts.
