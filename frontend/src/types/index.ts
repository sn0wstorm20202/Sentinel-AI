export interface InvestigationCase {
  metadata: {
    case_id: string;
    transaction_id: string;
    generated_at: string;
    engine_version: string;
  };
  risk_assessment: {
    probability: number;
    risk_score: number;
    risk_tier: string;
  };
  intelligence: {
    fraud_hypotheses: Array<{
      name: string;
      confidence: number;
      supporting_features: string[];
    }>;
    natural_language_summary: {
      hypothesis_explanation: string;
    };
  };
  action_engine: {
    recommended_actions: Array<{
      priority: number;
      action: string;
      reason: string;
    }>;
  };
}

export interface GraphNode {
  id: string;
  type: string;
  position?: { x: number; y: number };
  data: {
    label: string;
    type: 'Transaction' | 'Customer' | 'Device' | 'IP_Address' | 'Merchant';
    risk_score?: number;
    [key: string]: unknown;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  data?: {
    type: string;
  };
}

export interface GraphNetwork {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
