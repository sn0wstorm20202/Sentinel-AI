import { create } from 'zustand';

interface InvestigationState {
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  copilotQuery: string;
  setCopilotQuery: (query: string) => void;
}

export const useInvestigationStore = create<InvestigationState>((set) => ({
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  copilotQuery: '',
  setCopilotQuery: (query) => set({ copilotQuery: query }),
}));
