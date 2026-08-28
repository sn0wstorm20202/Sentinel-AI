import { useMutation, useQuery } from '@tanstack/react-query';
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

/* -------------------------------------------------------------------------- */
/* Live inference.                                                            */
/*                                                                            */
/* Every other hook in this file reads a precomputed artifact. This one is the */
/* only place the frontend asks the model to actually run: it POSTs a payload  */
/* and the orchestrator scores it, then reasons about it, in one request.      */
/*                                                                            */
/* `POST /api/v1/cases/explain` takes an envelope, not a bare feature bag —    */
/* see `TransactionRequest` in src/api/InvestigatorAPI.py. Sending the bag on  */
/* its own returns 422.                                                       */
/* -------------------------------------------------------------------------- */

export interface ExplainRequest {
  request_id: string;
  case_id: string;
  transaction_id: string;
  timestamp: string;
  features: Record<string, unknown>;
}

export interface ExplainResult {
  case: InvestigationCase;
  /**
   * Round-trip wall time in milliseconds, measured in the browser.
   *
   * This is the only timing the UI is entitled to show. The response is atomic:
   * the API reports one case, not per-stage durations, so the interface must not
   * imply it watched the six stages tick past individually.
   */
  elapsedMs: number;
}

export function useExplainTransaction() {
  return useMutation<ExplainResult, unknown, ExplainRequest>({
    mutationFn: async (body) => {
      const started = performance.now();
      const response = await apiClient.post<InvestigationCase>(
        '/api/v1/cases/explain',
        body,
        // Cold-starting a Hugging Face Space plus a 3,574-column alignment and a
        // SHAP pass runs well past the client's 15s default.
        { timeout: 120_000 },
      );
      return { case: response.data, elapsedMs: performance.now() - started };
    },
  });
}
