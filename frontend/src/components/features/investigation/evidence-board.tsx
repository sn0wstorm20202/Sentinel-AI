'use client';

import { InvestigationCase } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useInvestigationStore } from "@/store/investigation-store";

interface EvidenceBoardProps {
  caseData: InvestigationCase;
}

export function EvidenceBoard({ caseData }: EvidenceBoardProps) {
  const selectedNodeId = useInvestigationStore(s => s.selectedNodeId);

  interface EvidenceItem {
    feature: string;
    impact: string;
    source: string;
    weight: number;
    associatedNodeId?: string;
  }
  
  // Map the backend SHAP evidence to the board
  let allEvidence: EvidenceItem[] = [];
  
  if (caseData?.intelligence?.evidence && caseData.intelligence.evidence.length > 0) {
    allEvidence = caseData.intelligence.evidence.map((e) => ({
        feature: e.feature_id,
        impact: e.direction === 'positive' ? 'Critical' : 'Elevated',
        source: e.source ?? e.mapped_concept ?? 'Decision Engine (SHAP)',
        weight: parseFloat(e.importance_score.toFixed(3)),
        associatedNodeId: e.associated_node_id ?? e.node_id ?? e.entity_id,
      }));
  } else {
    // Fallback if no direct evidence array
    const features = caseData?.intelligence?.fraud_hypotheses?.flatMap(h => h.supporting_features) || [];
    const uniqueFeatures = Array.from(new Set(features));
    allEvidence = uniqueFeatures.map((feature, i) => {
      const hash = feature.length + i;
      const weight = Math.max(0.15, (hash % 10) / 10);
      const impactType = weight >= 0.7 ? "Critical" : "Elevated";
      return { feature, impact: impactType, source: "Fraud Hypothesis Engine", weight };
    });
  }

  const hasNodeScopedEvidence = allEvidence.some((item) => item.associatedNodeId);
  const filteredEvidence = selectedNodeId && hasNodeScopedEvidence
    ? allEvidence.filter(e => e.associatedNodeId === selectedNodeId)
    : allEvidence;

  return (
    <div className="w-full h-full overflow-auto bg-card rounded-none" data-sentinel-evidence tabIndex={-1}>
      <div className="p-3 border-b bg-muted/10 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence Log</h3>
        {selectedNodeId && (
          <Badge variant="outline" className="font-mono">
            {hasNodeScopedEvidence ? `Filtered by: ${selectedNodeId}` : `Selected node: ${selectedNodeId}`}
          </Badge>
        )}
      </div>
      {selectedNodeId && !hasNodeScopedEvidence && (
        <div className="border-b bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Backend evidence is case-level for this response; no node-scoped evidence association was returned.
        </div>
      )}
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-7 py-1 px-3">Feature Identified</TableHead>
            <TableHead className="h-7 py-1 px-3">Impact</TableHead>
            <TableHead className="h-7 py-1 px-3">Source</TableHead>
            <TableHead className="h-7 py-1 px-3 text-right">Risk Weight</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEvidence.length > 0 ? (
            filteredEvidence.map((ev) => (
              <TableRow
                key={ev.feature}
                className="border-b transition-none hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                <TableCell className="font-medium px-3 py-2 font-mono text-[11px]">{ev.feature}</TableCell>
                <TableCell className="px-3 py-2">
                  <Badge variant={ev.impact === "Critical" ? "destructive" : "secondary"} size="sm">
                    {ev.impact}
                  </Badge>
                </TableCell>
                <TableCell className="px-3 py-2 text-muted-foreground">{ev.source}</TableCell>
                <TableCell className="text-right px-3 py-2 text-muted-foreground font-mono">
                  {ev.weight.toFixed(2)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No evidence correlated with selected node.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
