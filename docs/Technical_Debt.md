# Technical Debt Report - Sentinel AI

**Date:** 2026-07-02
**Phase:** Sprint 4

## Overview
Following the Sprint 4 polish phase, the application has been optimized, but minor structural technical debt elements are logged here for future prioritization.

## Known Technical Debt

### 1. Test Coverage
- **Status:** Low.
- **Detail:** While linting and compilation are flawless, unit test coverage (Jest/Vitest) and End-to-End coverage (Playwright/Cypress) are currently absent.
- **Action:** Sprint 5 should introduce Playwright to automate critical user journeys (e.g., case selection -> graph expansion -> copilot query).

### 2. Offline / Resilience Architecture
- **Status:** Absent.
- **Detail:** There is no Service Worker or local fallback behavior if the backend SSE stream drops or the network fails mid-investigation.
- **Action:** Implement global network listeners and indexedDB caching for the investigation store.

### 3. Internationalization (i18n)
- **Status:** Absent.
- **Detail:** All strings (labels, tooltips, placeholders) are hardcoded in English within the components.
- **Action:** Extract strings into localization dictionaries (e.g., `next-intl` or `react-i18next`).

## Conclusion
There is no blocking technical debt for an initial production release. The existing debt revolves around long-term maintainability, automated testing, and global scale resilience.
