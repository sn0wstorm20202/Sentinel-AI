'use client';

import { useMemo } from 'react';
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  GitBranch,
  ListChecks,
  PlayCircle,
  ShieldAlert,
  UserRoundCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCases } from '@/lib/api/hooks/use-cases';
import { InvestigationCase, GraphNetwork, TimelineEvent, TimelineEventType } from '@/types';
import { useInvestigationStore } from '@/store/investigation-store';
import { cn } from '@/lib/utils';

interface InvestigationTimelineProps {
  caseData: InvestigationCase;
  graphData: GraphNetwork;
}

const iconMap: Record<TimelineEventType, React.ElementType> = {
  case_created: PlayCircle,
  model_scored: ShieldAlert,
  graph_generated: GitBranch,
  evidence_generated: FileCheck2,
  copilot_completed: Bot,
  analyst_opened: UserRoundCheck,
  recommendation_generated: ListChecks,
  case_escalated: ShieldAlert,
  case_closed: CheckCircle2,
};

function addSeconds(timestamp: string, seconds: number) {
  const date = new Date(timestamp);
  date.setSeconds(date.getSeconds() + seconds);
  return date.toISOString();
}

function buildBackendTimeline(
  caseData: InvestigationCase,
  graphData: GraphNetwork,
  caseStatus?: string
): TimelineEvent[] {
  const caseId = caseData.metadata.case_id;
  const generatedAt = caseData.metadata.generated_at;
  const evidenceCount = caseData.intelligence.evidence?.length ?? 0;
  const recommendationCount = (
    caseData.action_engine.recommendations ??
    caseData.action_engine.recommended_actions ??
    []
  ).length;

  const events: TimelineEvent[] = [
    {
      id: `${caseId}-case-created`,
      caseId,
      type: 'case_created',
      title: 'Case Created',
      timestamp: generatedAt,
      actor: { name: 'Sentinel Case API', type: 'system' },
      details: `Investigation case ${caseId} was generated for transaction ${caseData.metadata.transaction_id}.`,
      metadata: {
        transaction_id: caseData.metadata.transaction_id,
        engine_version: caseData.metadata.engine_version,
      },
    },
    {
      id: `${caseId}-model-scored`,
      caseId,
      type: 'model_scored',
      title: 'Model Scored',
      timestamp: addSeconds(generatedAt, 1),
      actor: { name: 'Fraud Decision Engine', type: 'model' },
      details: `Risk score ${caseData.risk_assessment.risk_score}/100 with ${caseData.risk_assessment.risk_tier} tier and ${(caseData.risk_assessment.probability * 100).toFixed(1)}% probability.`,
      metadata: {
        risk_score: caseData.risk_assessment.risk_score,
        risk_tier: caseData.risk_assessment.risk_tier,
      },
    },
  ];

  if (graphData.nodes.length > 0) {
    events.push({
      id: `${caseId}-graph-generated`,
      caseId,
      type: 'graph_generated',
      title: 'Graph Generated',
      timestamp: addSeconds(generatedAt, 2),
      actor: { name: 'Graph Intelligence API', type: 'system' },
      details: `Rendered ${graphData.nodes.length} entities and ${graphData.edges.length} relationships from the case subgraph endpoint.`,
      metadata: {
        nodes: graphData.nodes.length,
        edges: graphData.edges.length,
      },
    });
  }

  const hypothesesList = caseData.intelligence.fraud_hypotheses || (caseData.intelligence as any).hypotheses || [];
  if (evidenceCount > 0 || hypothesesList.length > 0) {
    events.push({
      id: `${caseData.metadata.case_id}-evidence`,
      caseId: caseData.metadata.case_id,
      type: 'evidence_generated',
      title: 'Automated Intelligence Generation',
      timestamp: new Date(new Date(caseData.metadata.generated_at).getTime() + 1000).toISOString(),
      actor: { name: 'Decision Engine', type: 'system' },
      details: `${evidenceCount} evidence signals and ${hypothesesList.length} fraud hypotheses are available for analyst review.`,
      metadata: {
        evidence: evidenceCount,
        hypotheses: hypothesesList.length,
      },
    });
  }

  if (recommendationCount > 0) {
    events.push({
      id: `${caseId}-recommendation-generated`,
      caseId,
      type: 'recommendation_generated',
      title: 'Recommendation Generated',
      timestamp: addSeconds(generatedAt, 4),
      actor: { name: 'Action Engine', type: 'policy' },
      details: `${recommendationCount} backend recommendation${recommendationCount === 1 ? '' : 's'} are available.`,
      metadata: {
        recommendations: recommendationCount,
      },
    });
  }

  if (['Critical', 'High'].includes(caseData.risk_assessment.risk_tier)) {
    events.push({
      id: `${caseId}-case-escalated`,
      caseId,
      type: 'case_escalated',
      title: 'Case Escalated',
      timestamp: addSeconds(generatedAt, 5),
      actor: { name: 'Risk Policy', type: 'policy' },
      details: `Case entered analyst queue because its risk tier is ${caseData.risk_assessment.risk_tier}.`,
      metadata: {
        risk_tier: caseData.risk_assessment.risk_tier,
      },
    });
  }

  if (caseStatus?.toLowerCase() === 'closed') {
    events.push({
      id: `${caseId}-case-closed`,
      caseId,
      type: 'case_closed',
      title: 'Case Closed',
      timestamp: addSeconds(generatedAt, 6),
      actor: { name: 'Case API', type: 'system' },
      details: 'The backend case queue currently reports this investigation as closed.',
      metadata: {
        status: caseStatus,
      },
    });
  }

  return events;
}

export function InvestigationTimeline({ caseData, graphData }: InvestigationTimelineProps) {
  const storeEvents = useInvestigationStore(
    (state) => state.timelineEventsByCase[caseData.metadata.case_id] ?? []
  );
  const { data: cases = [] } = useCases();
  const caseStatus = cases.find((item) => item.id === caseData.metadata.case_id)?.status;

  const events = useMemo(() => {
    const backendEvents = buildBackendTimeline(caseData, graphData, caseStatus);
    const merged = new Map<string, TimelineEvent>();
    [...backendEvents, ...storeEvents].forEach((event) => merged.set(event.id, event));
    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [caseData, caseStatus, graphData, storeEvents]);

  return (
    <div
      className="h-full overflow-auto bg-card"
      tabIndex={-1}
      data-sentinel-timeline
      aria-label="Investigation timeline"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Investigation Timeline
          </h2>
        </div>
        <Badge variant="outline" size="sm" className="font-mono">
          {events.length} events
        </Badge>
      </div>

      <div className="p-3">
        <div className="relative space-y-2 before:absolute before:bottom-0 before:left-[17px] before:top-0 before:w-px before:bg-border">
          {events.map((event) => {
            const Icon = iconMap[event.type];
            return (
              <details
                key={event.id}
                className="group relative rounded-md border bg-background/70 p-2 pl-10 open:bg-muted/20"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span
                    className={cn(
                      'absolute left-2 top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border bg-card',
                      event.actor.type === 'analyst' && 'text-primary',
                      event.actor.type === 'model' && 'text-amber-600',
                      event.actor.type === 'copilot' && 'text-emerald-600',
                      event.actor.type === 'policy' && 'text-destructive'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{event.title}</span>
                      <Badge variant="outline" size="sm">
                        {event.actor.type}
                      </Badge>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {event.actor.name} · {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </span>
                  <ChevronDown className="mt-0.5 h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-3 border-t pt-2 text-xs text-muted-foreground">
                  <p>{event.details}</p>
                  {event.metadata && (
                    <dl className="mt-2 grid grid-cols-2 gap-1 font-mono text-[10px]">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <div key={key} className="rounded bg-muted/40 px-2 py-1">
                          <dt className="uppercase text-muted-foreground">{key}</dt>
                          <dd className="truncate text-foreground">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}
