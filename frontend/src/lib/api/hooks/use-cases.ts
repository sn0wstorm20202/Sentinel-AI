import { useQuery } from '@tanstack/react-query';
import { InvestigationCase, GraphNetwork, CaseSummary } from '@/types';

import { apiClient } from '../client';

export function useCases() {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const response = await apiClient.get<CaseSummary[]>('/api/v1/cases');
      return response.data;
    },
  });
}

export function useCaseExplain(caseId: string) {
  return useQuery({
    queryKey: ['cases', caseId, 'explain'],
    queryFn: async () => {
      const response = await apiClient.get<InvestigationCase>(`/api/v1/cases/${caseId}/explain`);
      return response.data;
    },
    enabled: !!caseId,
  });
}

export function useCaseGraph(caseId: string) {
  return useQuery({
    queryKey: ['graph', caseId],
    queryFn: async () => {
      const response = await apiClient.get<GraphNetwork>(`/api/v1/graph/network/${caseId}`);
      return response.data;
    },
    enabled: !!caseId,
  });
}
