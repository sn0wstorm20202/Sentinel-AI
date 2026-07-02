import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';

export interface MLOpsMetrics {
  champion_model: string;
  auc_roc: number;
  feature_store_status: string;
  experiments: Array<{
    id: string;
    model: string;
    status: string;
    auc: string;
    date: string;
  }>;
  drift: {
    psi: Array<unknown>;
    retraining: unknown;
  };
}

export function useMLOpsMetrics() {
  return useQuery({
    queryKey: ['mlops-metrics'],
    queryFn: async () => {
      const response = await apiClient.get<MLOpsMetrics>('/api/v1/mlops/metrics');
      return response.data;
    },
  });
}
