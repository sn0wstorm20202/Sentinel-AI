'use client';

/**
 * The global keyboard shortcuts.
 *
 * Three of these were dead. `E` focused `[data-sentinel-evidence]`, a selector
 * that existed in this file and nowhere else in the app. `G` matched a real
 * element but one with no `tabIndex`, so `.focus()` was a silent no-op. All three
 * then set `activeInvestigationTab`, a store field nothing had read since the
 * dossier moved to the six-stage decision trail. And `/` aimed at a comma list of
 * selectors expecting the page's own filter to win, which `querySelector` cannot
 * do — it returns the first match in *document order*, and the topbar sits above
 * the page.
 *
 * The Settings dialog tells the reader every one of these bindings exists, so
 * every one of them has to actually do what that dialog says.
 */

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCases } from '@/lib/api/hooks/use-cases';
import { useInvestigationStore } from '@/store/investigation-store';
import { useLayoutStore } from '@/store/layout-store';
import { focusElement, focusWhenReady } from '@/lib/focus';

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable;
}

export function EnterpriseKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: cases = [] } = useCases();
  const setCommandPaletteOpen = useLayoutStore((state) => state.setCommandPaletteOpen);
  const setShortcutReferenceOpen = useLayoutStore((state) => state.setShortcutReferenceOpen);
  const setActivePanel = useLayoutStore((state) => state.setActivePanel);
  const setNotificationCenterOpen = useLayoutStore((state) => state.setNotificationCenterOpen);
  const activePanel = useLayoutStore((state) => state.activePanel);
  const toggleSidebar = useLayoutStore((state) => state.toggleSidebar);
  const focusNextCase = useInvestigationStore((state) => state.focusNextCase);
  const focusPreviousCase = useInvestigationStore((state) => state.focusPreviousCase);
  const focusedCaseId = useInvestigationStore((state) => state.focusedCaseId);
  const setQueueCaseIds = useInvestigationStore((state) => state.setQueueCaseIds);
  const setActiveTrailStage = useInvestigationStore((state) => state.setActiveTrailStage);

  useEffect(() => {
    setQueueCaseIds(cases.map((item) => item.id));
  }, [cases, setQueueCaseIds]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const editable = isEditableTarget(event.target);
      const key = event.key.toLowerCase();
      const caseIdFromPath = pathname.match(/\/cases\/([^/]+)/)?.[1];
      const selectedCaseId = caseIdFromPath ?? focusedCaseId ?? cases[0]?.id;

      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      /*
       * Ctrl-B for the rail, matching every editor people already have open.
       * The Settings page tells the reader this binding exists, so it has to.
       */
      if ((event.ctrlKey || event.metaKey) && key === 'b') {
        event.preventDefault();
        toggleSidebar();
        return;
      }

      if (event.key === 'Escape') {
        setCommandPaletteOpen(false);
        setShortcutReferenceOpen(false);
        setNotificationCenterOpen(false);
        if (activePanel) setActivePanel(null);
        return;
      }

      if (editable) return;

      if (event.key === '?') {
        event.preventDefault();
        setShortcutReferenceOpen(true);
        return;
      }

      if (event.key === '/') {
        event.preventDefault();
        /*
         * Prefer a filter the current page owns; fall back to the palette, which
         * searches everything. The two selectors never coexist — the queue has a
         * filter, a case has a graph search — so a comma list is safe here in a
         * way it was not when one of the candidates lived in the topbar.
         */
        const local = document.querySelector<HTMLElement>(
          '[data-sentinel-search="cases"], [data-sentinel-search="graph"]',
        );
        if (local) focusElement(local);
        else setCommandPaletteOpen(true);
        return;
      }

      if (key === 'j') {
        event.preventDefault();
        const nextId = focusNextCase();
        if (nextId) router.push(`/cases/${nextId}`);
        return;
      }

      if (key === 'k') {
        event.preventDefault();
        const previousId = focusPreviousCase();
        if (previousId) router.push(`/cases/${previousId}`);
        return;
      }

      if (event.key === 'Enter') {
        if (focusedCaseId) {
          event.preventDefault();
          router.push(`/cases/${focusedCaseId}`);
        }
        return;
      }

      if (key === 'g') {
        event.preventDefault();
        if (selectedCaseId) router.push(`/cases/${selectedCaseId}`);
        focusWhenReady('[data-sentinel-graph-workspace]');
        return;
      }

      if (key === 'c') {
        event.preventDefault();
        setActivePanel('copilot');
        focusWhenReady('[data-sentinel-copilot-input]');
        return;
      }

      if (key === 'e') {
        event.preventDefault();
        if (!selectedCaseId) return;
        router.push(`/cases/${selectedCaseId}`);
        // Stage 04 of the trail *is* the evidence — SHAP attribution. The stage
        // is stamped with the case id so it cannot apply to a different case.
        setActiveTrailStage('attribute', selectedCaseId);
        focusWhenReady('#trail-tab-attribute');
        return;
      }

      if (key === 't') {
        event.preventDefault();
        if (selectedCaseId) router.push(`/cases/${selectedCaseId}`);
        focusWhenReady('[data-sentinel-timeline]');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activePanel,
    cases,
    focusNextCase,
    focusPreviousCase,
    focusedCaseId,
    pathname,
    router,
    setActiveTrailStage,
    setActivePanel,
    setCommandPaletteOpen,
    setNotificationCenterOpen,
    setShortcutReferenceOpen,
    toggleSidebar,
  ]);

  return null;
}
