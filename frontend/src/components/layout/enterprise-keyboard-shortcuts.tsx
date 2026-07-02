'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCases } from '@/lib/api/hooks/use-cases';
import { useInvestigationStore } from '@/store/investigation-store';
import { useLayoutStore } from '@/store/layout-store';

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable;
}

function focusFirst(selector: string) {
  window.setTimeout(() => document.querySelector<HTMLElement>(selector)?.focus(), 40);
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
  const focusNextCase = useInvestigationStore((state) => state.focusNextCase);
  const focusPreviousCase = useInvestigationStore((state) => state.focusPreviousCase);
  const focusedCaseId = useInvestigationStore((state) => state.focusedCaseId);
  const setQueueCaseIds = useInvestigationStore((state) => state.setQueueCaseIds);
  const setActiveInvestigationTab = useInvestigationStore((state) => state.setActiveInvestigationTab);

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
        focusFirst('[data-sentinel-search="cases"], [data-sentinel-search="primary"]');
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
        setActiveInvestigationTab('graph');
        focusFirst('[data-sentinel-graph-workspace]');
        return;
      }

      if (key === 'c') {
        event.preventDefault();
        setActivePanel('copilot');
        focusFirst('[data-sentinel-copilot-input]');
        return;
      }

      if (key === 'e') {
        event.preventDefault();
        if (selectedCaseId) router.push(`/cases/${selectedCaseId}`);
        setActiveInvestigationTab('evidence');
        focusFirst('[data-sentinel-evidence]');
        return;
      }

      if (key === 't') {
        event.preventDefault();
        if (selectedCaseId) router.push(`/cases/${selectedCaseId}`);
        setActiveInvestigationTab('timeline');
        focusFirst('[data-sentinel-timeline]');
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
    setActiveInvestigationTab,
    setActivePanel,
    setCommandPaletteOpen,
    setNotificationCenterOpen,
    setShortcutReferenceOpen,
  ]);

  return null;
}
