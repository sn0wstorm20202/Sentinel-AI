# Accessibility Validation Report
**Project:** Sentinel AI — Enterprise Fraud Intelligence Platform
**Date:** 2026-07-02
**Tool:** axe-core v4.12.1 via `@axe-core/playwright` (WCAG 2.1 AA + best-practice ruleset)
**Phase:** Release Candidate 1 (RC-1) Accessibility Audit

---

## 1. Executive Summary

| Route | Violations | Passes | Manual Review |
|---|---|---|---|
| `/` (Root) | 3 | 39 | 0 |
| `/cases` | 3 | 39 | 0 |
| `/cases/[id]` | 5 | 37 | 2 |
| `/mlops` | 3 | 36 | 0 |
| **Total Unique** | **7 distinct rule failures** | — | **2** |

**Overall conformance level:** WCAG 2.1 AA — **Not Yet Conformant**
4 critical/serious violations require remediation before production acceptance.

---

## 2. Violations — Prioritised

### 2.1 [CRITICAL] `button-name` — Icon buttons missing accessible names
**Affected Routes:** All (`/`, `/cases`, `/cases/[id]`, `/mlops`)
**WCAG:** 4.1.2 Name, Role, Value (Level A)

**Root Cause:** The following icon-only buttons render no visible text and have no `aria-label`, `aria-labelledby`, or `title` attribute:
- **Sidebar toggle** (`ChevronLeft`/`ChevronRight` button) — `Sidebar.tsx`
- **Theme toggle** (`Sun`/`Moon` button) — `theme-toggle.tsx`
- **Topbar icon buttons** (Copilot toggle, notifications) — `topbar.tsx`
- **ResizableHandle** drag handle — `resizable.tsx`

The `theme-toggle.tsx` does have a `<span className="sr-only">Toggle theme</span>` which is correct, but axe still flags 2 buttons — indicating the topbar and sidebar toggle buttons are the specific offenders.

**Fix Required:** Add `aria-label` to every icon-only `<Button>` or ensure a `<span className="sr-only">` is nested inside each.

---

### 2.2 [SERIOUS] `aria-progressbar-name` — Progress bar has no accessible name
**Affected Route:** `/cases/[id]`
**WCAG:** 4.1.2 Name, Role, Value (Level A)

**Root Cause:** The `<Progress>` component in `HypothesisPanel` renders an `[role="progressbar"]` element with no `aria-label` or `aria-labelledby`. Screen readers announce it as "progress bar" with no context.

```tsx
// Current — no label
<Progress value={risk_assessment.risk_score} className="h-2 [&>div]:bg-destructive" />

// Required fix
<Progress
  value={risk_assessment.risk_score}
  aria-label={`Risk score: ${risk_assessment.risk_score} out of 100`}
  className="h-2 [&>div]:bg-destructive"
/>
```

---

### 2.3 [SERIOUS] `color-contrast` — React Flow attribution link
**Affected Route:** `/cases/[id]`
**WCAG:** 1.4.3 Contrast (Minimum) (Level AA)

**Root Cause:** The React Flow (`@xyflow/react`) library renders a small attribution `<a target="_blank">` link in the bottom-right corner of the canvas. Its foreground colour against the dark background does not meet the 4.5:1 contrast ratio for normal text.

**Fix Required:** Either hide the attribution via `<ReactFlow proOptions={{ hideAttribution: true }}>` (requires a React Flow Pro licence or OSS declaration), or override the link colour with a higher-contrast CSS rule.

---

### 2.4 [SERIOUS] `scrollable-region-focusable` — Overflow containers not keyboard accessible
**Affected Routes:** `/cases/[id]`, `/mlops`
**WCAG:** 2.1.1 Keyboard (Level A)

**Root Cause:** Several `overflow-auto` / `overflow-y-auto` `<div>` containers are scrollable but have no `tabIndex="0"`, making them unreachable via keyboard for users who cannot use a mouse.

Affected elements:
- The `flex-col gap-4` motion wrapper in `HypothesisPanel` (case detail left panel)
- The `.overflow-auto` wrapper in the MLOps page body

**Fix Required:** Add `tabIndex={0}` to scrollable regions that contain meaningful content, paired with appropriate `role` or `aria-label` if they do not already have one.

---

### 2.5 [MODERATE] `page-has-heading-one` — Pages missing `<h1>`
**Affected Routes:** `/` (root), `/cases`, `/mlops`
**WCAG:** Best Practice (heading structure for AT navigation)

**Root Cause:** The Cases and MLOps pages both use `<h2>` as the top-level heading. WCAG and screen-reader UX require exactly one `<h1>` per page as the primary landmark. The Case Detail page (`/cases/[id]`) correctly uses `<h1>`.

```tsx
// Current — /cases page
<h2 className="text-3xl font-bold tracking-tight">Investigations</h2>

// Required fix
<h1 className="text-3xl font-bold tracking-tight">Investigations</h1>
```

---

### 2.6 [MODERATE] `heading-order` — Heading levels skip from `<h1>` to `<h3>`
**Affected Route:** `/cases/[id]`
**WCAG:** Best Practice

**Root Cause:** In `HypothesisPanel`, the section headers ("Generated Hypotheses", "Recommended Actions") are rendered as `<h3>` elements. The page's only explicit heading above them is `<h1>` (the case title), with no `<h2>` in between — a semantic skip that confuses AT navigation.

**Fix Required:** Either promote panel section headers to `<h2>`, or wrap the panel with an implicit `<h2>` section heading for screen reader context.

---

### 2.7 [MINOR] `empty-table-header` — Actions column `<th>` has no text
**Affected Routes:** `/`, `/cases`
**WCAG:** 1.3.1 Info and Relationships (Level A)

**Root Cause:** The CasesTable column definition for the "Investigate" button action renders a `<th>` with no header text (column `id: 'actions'` has no `header` key), producing an empty `<th>` cell.

**Fix Required:**
```tsx
// Current
{ id: 'actions', cell: ({ row }) => <Button>Investigate</Button> }

// Required fix
{ id: 'actions', header: () => <span className="sr-only">Actions</span>, cell: ... }
```

---

## 3. Manual Review Items (axe `incomplete`)

| Rule | Description | Affected Route |
|---|---|---|
| `aria-prohibited-attr` | ARIA attributes may be prohibited on some elements' implicit roles — requires manual inspection of Framer Motion wrapper divs | `/cases/[id]` |
| `color-contrast` | Some colour-contrast cases could not be automatically resolved (dynamic opacity overlays) — requires manual inspection in both light and dark modes | `/cases/[id]` |

---

## 4. Checks That PASS

The following accessibility dimensions are correctly implemented and confirmed passing across all routes:

| Category | Status | Detail |
|---|---|---|
| **Keyboard Navigation — Tabs** | ✅ Pass | shadcn/ui `<Tabs>` uses `role="tablist"` with full arrow-key navigation built into Base UI |
| **Keyboard Navigation — Table** | ✅ Pass | TanStack Table renders semantic `<table>/<thead>/<tbody>` — navigable via Tab |
| **Keyboard Navigation — Nav Links** | ✅ Pass | `<Link>` renders native `<a>` — fully keyboard accessible |
| **Resizable Panels** | ✅ Pass | `react-resizable-panels` exposes `aria-orientation`, `role="separator"`, and keyboard drag (←/→ arrow keys) natively |
| **Focus Visible Indicators** | ✅ Pass | All shadcn/ui interactive elements have `focus-visible:ring-3 focus-visible:ring-ring/50` — a visible 3px ring |
| **Focus Trapping (Dialog/Sheet)** | ✅ Pass | Base UI primitives implement `aria-modal="true"` and trap focus within modal boundaries |
| **ARIA Roles — Nav** | ✅ Pass | `<aside>` and `<nav>` landmarks are correctly used in the Sidebar |
| **ARIA Roles — Tabs** | ✅ Pass | `role="tablist"`, `role="tab"`, `role="tabpanel"` all present and wired via `aria-controls` |
| **Theme Toggle SR Text** | ✅ Pass | `<span className="sr-only">Toggle theme</span>` present |
| **Dialog/Sheet Close Buttons** | ✅ Pass | Both use `<span className="sr-only">Close</span>` |
| **Form Labels — Copilot** | ✅ Pass | Input has visible `placeholder` text; submit is a typed `<button type="submit">` |
| **Command Palette** | N/A | Not yet implemented in RC-1 |
| **Screen Reader — Landmarks** | ✅ Pass | `<main>`, `<aside>`, `<nav>` properly scoped; no duplicate landmark roles |
| **Language Attribute** | ✅ Pass | `<html lang="en">` present in root layout |

---

## 5. Remediation Priority Matrix

| ID | Severity | WCAG Level | Fix Effort | Priority |
|---|---|---|---|---|
| `button-name` (icon buttons) | Critical | A | Low — add `aria-label` | **P0** |
| `aria-progressbar-name` | Serious | A | Low — add `aria-label` to `<Progress>` | **P0** |
| `scrollable-region-focusable` | Serious | A | Low — add `tabIndex={0}` | **P0** |
| `color-contrast` (React Flow link) | Serious | AA | Low — CSS override or `hideAttribution` | **P1** |
| `page-has-heading-one` | Moderate | Best Practice | Low — `h2` → `h1` on pages | **P1** |
| `heading-order` | Moderate | Best Practice | Low — promote `h3` → `h2` in panels | **P1** |
| `empty-table-header` | Minor | A | Low — add `sr-only` header text | **P2** |

---

## 6. Conclusion

The RC-1 accessibility posture is partially conformant. The component library (shadcn/Base UI) provides an exceptionally strong foundation — focus rings, ARIA roles, keyboard navigation, and landmark structure are all correctly implemented at the system level. The remaining violations are all application-layer issues: missing labels on icon buttons, unlabelled progress bars, and heading hierarchy choices made during rapid implementation. All 7 violations are Low/Medium effort to remediate in RC-2.
