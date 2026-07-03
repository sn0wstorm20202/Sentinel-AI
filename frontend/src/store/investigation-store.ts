import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { InvestigationTab, TimelineEvent } from '@/types';

export interface CopilotMessage {
  id: number | string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  pending?: boolean;
}

interface InvestigationState {
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  graphSearch: string;
  setGraphSearch: (query: string) => void;
  collapsedCommunities: string[];
  toggleCommunity: (communityId: string) => void;
  clearCollapsedCommunities: () => void;
  riskHeatmapEnabled: boolean;
  setRiskHeatmapEnabled: (enabled: boolean) => void;
  riskPropagationEnabled: boolean;
  setRiskPropagationEnabled: (enabled: boolean) => void;
  activeInvestigationTab: InvestigationTab;
  setActiveInvestigationTab: (tab: InvestigationTab) => void;
  queueCaseIds: string[];
  setQueueCaseIds: (ids: string[]) => void;
  focusedCaseId: string | null;
  setFocusedCaseId: (caseId: string | null) => void;
  focusNextCase: () => string | null;
  focusPreviousCase: () => string | null;
  openTabs: string[];
  openInvestigationTab: (caseId: string) => void;
  closeInvestigationTab: (caseId: string) => void;
  recentCases: string[];
  addRecentCase: (caseId: string) => void;
  pinnedInvestigations: string[];
  togglePinnedInvestigation: (caseId: string) => void;
  bookmarks: string[];
  toggleBookmark: (caseId: string) => void;
  copilotQuery: string;
  setCopilotQuery: (query: string) => void;
  messages: CopilotMessage[];
  addMessage: (msg: CopilotMessage) => void;
  replaceMessage: (id: number | string, msg: CopilotMessage) => void;
  lastCaseContext: string | null;
  setLastCaseContext: (caseId: string) => void;
  timelineEventsByCase: Record<string, TimelineEvent[]>;
  addTimelineEvent: (event: TimelineEvent) => void;
}

const moveFocus = (ids: string[], currentId: string | null, delta: number) => {
  if (ids.length === 0) return null;
  const currentIndex = currentId ? ids.indexOf(currentId) : -1;
  const nextIndex = currentIndex === -1
    ? 0
    : (currentIndex + delta + ids.length) % ids.length;
  return ids[nextIndex] ?? null;
};

const prependUnique = (items: string[], item: string, limit = 12) => [
  item,
  ...items.filter((existing) => existing !== item),
].slice(0, limit);

export const useInvestigationStore = create<InvestigationState>()(
  persist(
    (set, get) => ({
      selectedNodeId: null,
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      graphSearch: '',
      setGraphSearch: (query) => set({ graphSearch: query }),
      collapsedCommunities: [],
      toggleCommunity: (communityId) =>
        set((state) => ({
          collapsedCommunities: state.collapsedCommunities.includes(communityId)
            ? state.collapsedCommunities.filter((id) => id !== communityId)
            : [...state.collapsedCommunities, communityId],
        })),
      clearCollapsedCommunities: () => set({ collapsedCommunities: [] }),
      riskHeatmapEnabled: true,
      setRiskHeatmapEnabled: (enabled) => set({ riskHeatmapEnabled: enabled }),
      riskPropagationEnabled: false,
      setRiskPropagationEnabled: (enabled) => set({ riskPropagationEnabled: enabled }),
      activeInvestigationTab: 'graph',
      setActiveInvestigationTab: (tab) => set({ activeInvestigationTab: tab }),
      queueCaseIds: [],
      setQueueCaseIds: (ids) =>
        set((state) => ({
          queueCaseIds: ids,
          focusedCaseId: state.focusedCaseId && ids.includes(state.focusedCaseId)
            ? state.focusedCaseId
            : ids[0] ?? null,
        })),
      focusedCaseId: null,
      setFocusedCaseId: (caseId) => set({ focusedCaseId: caseId }),
      focusNextCase: () => {
        const nextId = moveFocus(get().queueCaseIds, get().focusedCaseId, 1);
        set({ focusedCaseId: nextId });
        return nextId;
      },
      focusPreviousCase: () => {
        const previousId = moveFocus(get().queueCaseIds, get().focusedCaseId, -1);
        set({ focusedCaseId: previousId });
        return previousId;
      },
      openTabs: [],
      openInvestigationTab: (caseId) =>
        set((state) => ({
          openTabs: prependUnique(state.openTabs, caseId, 8),
          recentCases: prependUnique(state.recentCases, caseId, 10),
          focusedCaseId: caseId,
        })),
      closeInvestigationTab: (caseId) =>
        set((state) => ({
          openTabs: state.openTabs.filter((id) => id !== caseId),
        })),
      recentCases: [],
      addRecentCase: (caseId) =>
        set((state) => ({
          recentCases: prependUnique(state.recentCases, caseId, 10),
        })),
      pinnedInvestigations: [],
      togglePinnedInvestigation: (caseId) =>
        set((state) => ({
          pinnedInvestigations: state.pinnedInvestigations.includes(caseId)
            ? state.pinnedInvestigations.filter((id) => id !== caseId)
            : prependUnique(state.pinnedInvestigations, caseId, 10),
        })),
      bookmarks: [],
      toggleBookmark: (caseId) =>
        set((state) => ({
          bookmarks: state.bookmarks.includes(caseId)
            ? state.bookmarks.filter((id) => id !== caseId)
            : prependUnique(state.bookmarks, caseId, 20),
        })),
      copilotQuery: '',
      setCopilotQuery: (query) => set({ copilotQuery: query }),
      messages: [
        {
          id: 1,
          role: 'assistant',
          content: 'I am your Investigation Copilot. Select a case from the queue to begin.',
        },
      ],
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg].slice(-100) })),
      replaceMessage: (id, msg) =>
        set((state) => ({
          messages: state.messages.map((message) => (message.id === id ? msg : message)),
        })),
      lastCaseContext: null,
      setLastCaseContext: (caseId) => set({ lastCaseContext: caseId }),
      timelineEventsByCase: {},
      addTimelineEvent: (event) =>
        set((state) => {
          const existing = state.timelineEventsByCase[event.caseId] ?? [];
          if (existing.some((item) => item.id === event.id)) {
            return state;
          }

          return {
            timelineEventsByCase: {
              ...state.timelineEventsByCase,
              [event.caseId]: [...existing, event].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              ),
            },
          };
        }),
    }),
    {
      name: 'sentinel-investigation-workspace',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedNodeId: state.selectedNodeId,
        graphSearch: state.graphSearch,
        collapsedCommunities: state.collapsedCommunities,
        riskHeatmapEnabled: state.riskHeatmapEnabled,
        riskPropagationEnabled: state.riskPropagationEnabled,
        activeInvestigationTab: state.activeInvestigationTab,
        focusedCaseId: state.focusedCaseId,
        openTabs: state.openTabs,
        recentCases: state.recentCases,
        pinnedInvestigations: state.pinnedInvestigations,
        bookmarks: state.bookmarks,
        messages: state.messages,
        lastCaseContext: state.lastCaseContext,
        timelineEventsByCase: state.timelineEventsByCase,
      }),
    }
  )
);
