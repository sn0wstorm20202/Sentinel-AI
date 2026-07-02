# Sentinel AI - Design System

This document outlines the formal design system and visual guidelines applied across the Sentinel AI platform to ensure strict enterprise consistency.

## 1. Typography
- **Primary Font:** Inter (Sans-serif)
- **Tabular Data:** Monospaced (`font-mono`) with `tabular-nums` enabled for all risk scores, transaction IDs, and confidence metrics.
- **Hierarchy:**
  - Headers: Semi-bold, muted tracking.
  - Body: Regular, strict line-height for dense data.
  - Metadata: 10px-12px, uppercase, tracking-wider (`text-muted-foreground`).

## 2. Color Palette
- **Theme:** Monochromatic Oklch with semantic accents.
- **Backgrounds:** `bg-background` (base), `bg-card` (panels), `bg-muted` (headers).
- **Accents:**
  - Primary: Brand / Interactive elements.
  - Destructive: High-risk indicators (`text-destructive`, `bg-destructive/10`).
  - Warning/Secondary: Elevated risk (`text-yellow-500` equivalents).

## 3. Spacing & Grid
- **Information Density:** High density required. 
- **Padding/Margin Scale:** `p-1` to `p-4` maximum in data views. Excessive whitespace (e.g., `p-8`) is explicitly prohibited in investigator workflows.
- **Layout:** Resizable panel architecture (`react-resizable-panels`) with persistent boundaries.

## 4. Components
- **Buttons:** Low profile, variant-based (default, outline, ghost).
- **Tables:** Compact rows (`py-1.5`), sticky headers, strictly aligned columns (numbers right-aligned).
- **Badges:** Consistent border radius, subtle background opacity, high-contrast text.
- **Skeletons:** Low-opacity pulsing blocks matching final component dimensions to prevent layout shift.

## 5. Interactions & Motion
- **Hover States:** Subtle background shifts (e.g., `hover:bg-muted/50`).
- **Focus States:** High-visibility focus rings compliant with WCAG.
- **Motion:** Micro-animations only. Stagger animations on data rendering are prohibited to ensure instantaneous perceived performance. Respects `prefers-reduced-motion`.

## 6. Graph Visualization
- **Nodes:** Semantic icons, deterministic positioning.
- **Edges:** Clear labels, non-overlapping routing where possible.
- **Controls:** Smooth zoom and pan, accessible minimap.
