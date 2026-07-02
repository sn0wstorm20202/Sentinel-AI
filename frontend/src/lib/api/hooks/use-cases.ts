import { useQuery } from '@tanstack/react-query';
import { InvestigationCase, GraphNetwork } from '@/types';

// Mock data generator for graph (since the Python backend might not return it consistently right now)
const generateMockGraph = (): GraphNetwork => {
  return {
    nodes: [
      { id: 'txn-1', type: 'custom', position: { x: 250, y: 150 }, data: { label: 'TXN-884910', type: 'Transaction' } },
      { id: 'cust-1', type: 'custom', position: { x: 100, y: 50 }, data: { label: 'Customer A', type: 'Customer' } },
      { id: 'dev-1', type: 'custom', position: { x: 400, y: 50 }, data: { label: 'Device-X2', type: 'Device', risk_score: 95 } },
      { id: 'merch-1', type: 'custom', position: { x: 250, y: 300 }, data: { label: 'Suspicious Merchant', type: 'Merchant' } }
    ],
    edges: [
      { id: 'e1', source: 'cust-1', target: 'txn-1', label: 'INITIATED' },
      { id: 'e2', source: 'txn-1', target: 'merch-1', label: 'SENT_TO' },
      { id: 'e3', source: 'txn-1', target: 'dev-1', label: 'EXECUTED_ON' },
    ]
  };
};

export function useCaseExplain(caseId: string) {
  return useQuery({
    queryKey: ['cases', caseId, 'explain'],
    queryFn: async () => {
      // Use the mock payload from JSON_CONTRACTS for local dev without a running backend
      // Real implementation would be:
      // const response = await apiClient.post<InvestigationCase>(`/api/v1/cases/explain`, { case_id: caseId });
      // return response.data;
      
      return new Promise<InvestigationCase>((resolve) => {
        setTimeout(() => {
          resolve({
            metadata: {
              case_id: caseId,
              transaction_id: "TXN_884910",
              generated_at: new Date().toISOString(),
              engine_version: "4.0"
            },
            risk_assessment: {
              probability: 0.9824,
              risk_score: 98.2,
              risk_tier: "Critical"
            },
            intelligence: {
              fraud_hypotheses: [
                {
                  name: "Dormant Account Abuse",
                  confidence: 0.73,
                  supporting_features: ["Transaction Velocity", "Geographical Risk"]
                },
                {
                  name: "Account Takeover (ATO)",
                  confidence: 0.42,
                  supporting_features: ["Geographical Risk"]
                }
              ],
              natural_language_summary: {
                hypothesis_explanation: "Possible fraud pattern: Dormant account abuse. This hypothesis was generated because several highly influential model features (Transaction Velocity, Geographical Risk) deviated significantly from the historical customer profile, combined with a Critical risk score."
              }
            },
            action_engine: {
              recommended_actions: [
                {
                  priority: 1,
                  action: "Temporary Hold",
                  reason: "Critical risk score and strong supporting evidence for account abuse."
                },
                {
                  priority: 2,
                  action: "Enhanced KYC Verification",
                  reason: "Standard protocol for suspected Account Takeover."
                },
                {
                  priority: 3,
                  action: "Escalate to Tier-2 Investigator",
                  reason: "Required for cases with risk scores exceeding 95%."
                }
              ]
            }
          });
        }, 500);
      });
    },
    enabled: !!caseId,
  });
}

export function useCaseGraph(caseId: string) {
  return useQuery({
    queryKey: ['graph', caseId],
    queryFn: async () => {
      // Mocking graph data to ensure frontend works standalone based on contract
      return new Promise<GraphNetwork>((resolve) => {
        setTimeout(() => resolve(generateMockGraph()), 600);
      });
    },
    enabled: !!caseId,
  });
}
