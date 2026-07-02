# Accessibility Report (WCAG 2.1) - Sentinel AI

**Audit Date:** 2026-07-02
**Phase:** Sprint 4

## Overview
A full accessibility review was conducted across the Sentinel AI application to ensure compliance with WCAG 2.1 AA standards, focusing on keyboard navigation, screen reader support, and visual contrast.

## 1. Keyboard Navigation
- **Focus Order:** Verified logical tab order across the Cases Queue, Graph Workspace, Evidence Board, and Copilot Panel.
- **Shortcuts:** Global shortcuts (`Cmd+K` command palette, `J/K` navigation) do not trap focus and provide alternative standard navigation methods.
- **Focus Visibility:** All interactive elements (buttons, inputs, table rows) utilize clear, high-contrast focus rings (`focus-visible:ring`).

## 2. ARIA & Screen Readers
- **Roles:** Semantic HTML and explicit ARIA roles (`role="navigation"`, `role="grid"`, `role="region"`) are correctly applied.
- **Labels:** Icons and graph elements feature `aria-label` or visually hidden fallback text (`<span className="sr-only">`).
- **Live Regions:** The Copilot panel correctly utilizes `aria-live` for streaming text and dynamic state changes (e.g., "Querying Sentinel backend...").

## 3. Visual & Cognitive Accessibility
- **Contrast:** Text-to-background contrast ratios exceed the 4.5:1 requirement for standard text and 3:1 for large text across both light and dark modes.
- **Reduced Motion:** The application respects the OS-level `prefers-reduced-motion` setting. Data entry and table rendering avoid unnecessary staggering animations.

## Conclusion
The application passes all critical accessibility benchmarks and provides a robust experience for investigators relying on assistive technologies or keyboard-only workflows.
