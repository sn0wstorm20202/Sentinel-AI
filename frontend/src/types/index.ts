export interface CaseSummary {
  id: string;
  txId: string;
  date: string;
  risk: string;
  score: number;
  status: string;
}

export type InvestigationTab = 'graph' | 'evidence' | 'timeline';

export type TimelineEventType =
  | 'case_created'
  | 'model_scored'
  | 'graph_generated'
  | 'evidence_generated'
  | 'copilot_completed'
  | 'analyst_opened'
  | 'recommendation_generated'
  | 'case_escalated'
  | 'case_closed';

export interface TimelineEvent {
  id: string;
  caseId: string;
  type: TimelineEventType;
  title: string;
  timestamp: string;
  actor: {
    name: string;
    type: 'system' | 'model' | 'analyst' | 'copilot' | 'policy';
  };
  details: string;
  metadata?: Record<string, string | number | boolean | null>;
}

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
    evidence?: Array<{
      feature_id: string;
      importance_score: number;
      direction: string;
      rank: number;
      confidence: number;
      source?: string;
      mapped_concept?: string;
      node_id?: string;
      entity_id?: string;
      associated_node_id?: string;
    }>;
    fraud_hypotheses: Array<{
      name: string;
      confidence: number;
      supporting_features: string[];
    }>;
    natural_language_summary: string | {
      hypothesis_explanation: string;
    };
  };
  action_engine: {
    recommendations?: Array<{
      priority: number;
      action: string;
      reason: string;
    }>;
    recommended_actions?: Array<{
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
    community?: string | number;
    pagerank?: string | number;
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
