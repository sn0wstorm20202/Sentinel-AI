'use client';

import { useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bot,
  BrainCircuit,
  Clock3,
  FileSearch,
  Gauge,
  Network,
  Search,
  Settings,
  ShieldAlert,
  UserRoundSearch,
  Pin,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useCases } from '@/lib/api/hooks/use-cases';
import { useInvestigationStore } from '@/store/investigation-store';
import { useLayoutStore } from '@/store/layout-store';

interface Command {
  id: string;
  label: string;
  keywords: string;
  group: string;
  icon: React.ElementType;
  execute: () => void;
}

function focusSelector(selector: string) {
  window.setTimeout(() => {
    const target = document.querySelector<HTMLElement>(selector);
    target?.focus();
  }, 60);
}

// Custom fuzzy search for cmdk
export function fuzzyFilter(value: string, search: string) {
  const needle = search.trim().toLowerCase();
  if (!needle) return 1;

  const haystack = value.toLowerCase();
  let score = 0;
  let queryIndex = 0;

  for (const character of haystack) {
    if (character === needle[queryIndex]) {
      score += 2;
      queryIndex += 1;
    } else if (needle.includes(character)) {
      score += 0.2;
    }
  }

  return queryIndex === needle.length ? score / haystack.length : 0;
}

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();

  const open = useLayoutStore((state) => state.commandPaletteOpen);
  const setOpen = useLayoutStore((state) => state.setCommandPaletteOpen);
  const setActivePanel = useLayoutStore((state) => state.setActivePanel);
  const focusedCaseId = useInvestigationStore((state) => state.focusedCaseId);
  const recentCases = useInvestigationStore((state) => state.recentCases);
  const setActiveInvestigationTab = useInvestigationStore((state) => state.setActiveInvestigationTab);
  const setGraphSearch = useInvestigationStore((state) => state.setGraphSearch);
  const { data: cases = [] } = useCases();

  const activeCaseId = pathname.match(/\/cases\/([^/]+)/)?.[1] ?? focusedCaseId ?? cases[0]?.id;

  const closeAndRun = useCallback((callback: () => void) => {
    setOpen(false);
    callback();
  }, [setOpen]);

  const commands = useMemo<Command[]>(() => {
    const base: Command[] = [
      {
        id: 'search-cases',
        label: 'Search Cases',
        keywords: 'queue investigation case id transaction fraud',
        group: 'Search',
        icon: FileSearch,
        execute: () => closeAndRun(() => {
          router.push('/cases');
          focusSelector('[data-sentinel-search="cases"]');
        }),
      },
      {
        id: 'search-entities',
        label: 'Search Entities',
        keywords: 'entity node graph customer device merchant ip transaction',
        group: 'Search',
        icon: UserRoundSearch,
        execute: () => closeAndRun(() => {
          if (activeCaseId) router.push(`/cases/${activeCaseId}`);
          setActiveInvestigationTab('graph');
          setGraphSearch('');
          focusSelector('[data-sentinel-search="graph"]');
        }),
      },
      {
        id: 'search-devices',
        label: 'Search Devices',
        keywords: 'device laptop graph node identity',
        group: 'Search',
        icon: Search,
        execute: () => closeAndRun(() => {
          if (activeCaseId) router.push(`/cases/${activeCaseId}`);
          setActiveInvestigationTab('graph');
          setGraphSearch('device');
          focusSelector('[data-sentinel-search="graph"]');
        }),
      },
      {
        id: 'search-customers',
        label: 'Search Customers',
        keywords: 'customer account entity profile graph',
        group: 'Search',
        icon: UserRoundSearch,
        execute: () => closeAndRun(() => {
          if (activeCaseId) router.push(`/cases/${activeCaseId}`);
          setActiveInvestigationTab('graph');
          setGraphSearch('customer');
          focusSelector('[data-sentinel-search="graph"]');
        }),
      },
      {
        id: 'open-queue',
        label: 'Open Queue',
        keywords: 'cases investigations queue alerts',
        group: 'Navigate',
        icon: ShieldAlert,
        execute: () => closeAndRun(() => router.push('/cases')),
      },
      {
        id: 'open-graph',
        label: 'Open Graph',
        keywords: 'network workspace community entities nodes',
        group: 'Navigate',
        icon: Network,
        execute: () => closeAndRun(() => {
          if (activeCaseId) router.push(`/cases/${activeCaseId}`);
          setActiveInvestigationTab('graph');
        }),
      },
      {
        id: 'open-copilot',
        label: 'Open Copilot',
        keywords: 'assistant ai explain evidence recommendation',
        group: 'Navigate',
        icon: Bot,
        execute: () => closeAndRun(() => setActivePanel('copilot')),
      },
      {
        id: 'open-mlops',
        label: 'Open MLOps',
        keywords: 'model drift metrics pipeline monitoring',
        group: 'Navigate',
        icon: BrainCircuit,
        execute: () => closeAndRun(() => router.push('/mlops')),
      },
      {
        id: 'open-settings',
        label: 'Open Settings',
        keywords: 'configuration preferences account',
        group: 'Navigate',
        icon: Settings,
        execute: () => closeAndRun(() => router.push('/settings')),
      },
      {
        id: 'open-timeline',
        label: 'Open Timeline',
        keywords: 'events audit trail investigation timeline history',
        group: 'Navigate',
        icon: Clock3,
        execute: () => closeAndRun(() => {
          if (activeCaseId) router.push(`/cases/${activeCaseId}`);
          setActiveInvestigationTab('timeline');
        }),
      },
    ];

    const recent = recentCases
      .map((caseId) => cases.find((item) => item.id === caseId))
      .filter(Boolean)
      .map((item) => ({
        id: `recent-${item!.id}`,
        label: `Open ${item!.id}`,
        keywords: `${item!.id} ${item!.txId} ${item!.risk} ${item!.status}`,
        group: 'Recent Cases',
        icon: Gauge,
        execute: () => closeAndRun(() => router.push(`/cases/${item!.id}`)),
      }));

    const pinned: Command[] = [
      {
        id: 'pinned-high-risk',
        label: 'High Risk Dashboard',
        keywords: 'critical pinned high risk',
        group: 'Pinned',
        icon: Pin,
        execute: () => closeAndRun(() => router.push('/cases?risk=high')),
      },
      {
        id: 'pinned-mlops-alert',
        label: 'Model Drift Alerts',
        keywords: 'drift alerts pinned mlops',
        group: 'Pinned',
        icon: Pin,
        execute: () => closeAndRun(() => router.push('/mlops?view=alerts')),
      }
    ];

    return [...pinned, ...base, ...recent];
  }, [
    activeCaseId,
    cases,
    recentCases,
    router,
    setActiveInvestigationTab,
    setActivePanel,
    setGraphSearch,
    closeAndRun,
  ]);

  // Group the commands for display
  const searchCommands = commands.filter(c => c.group === 'Search');
  const navCommands = commands.filter(c => c.group === 'Navigate');
  const recentCommands = commands.filter(c => c.group === 'Recent Cases');
  const pinnedCommands = commands.filter(c => c.group === 'Pinned');

  return (
    <CommandDialog open={open} onOpenChange={setOpen} filter={fuzzyFilter}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {pinnedCommands.length > 0 && (
          <CommandGroup heading="Pinned">
            {pinnedCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <CommandItem key={cmd.id} value={`${cmd.label} ${cmd.keywords}`} onSelect={cmd.execute}>
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{cmd.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {recentCommands.length > 0 && (
          <CommandGroup heading="Recent Cases">
            {recentCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <CommandItem key={cmd.id} value={`${cmd.label} ${cmd.keywords}`} onSelect={cmd.execute}>
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{cmd.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandGroup heading="Search">
          {searchCommands.map((cmd) => {
            const Icon = cmd.icon;
            return (
              <CommandItem key={cmd.id} value={`${cmd.label} ${cmd.keywords}`} onSelect={cmd.execute}>
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{cmd.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Navigate">
          {navCommands.map((cmd) => {
            const Icon = cmd.icon;
            return (
              <CommandItem key={cmd.id} value={`${cmd.label} ${cmd.keywords}`} onSelect={cmd.execute}>
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{cmd.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

      </CommandList>
    </CommandDialog>
  );
}
