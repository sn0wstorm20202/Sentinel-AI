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

  // In a real scenario, this would come from the FIE module's evidence array and map to graph nodes.
  const features = caseData.intelligence.fraud_hypotheses.flatMap(h => h.supporting_features);
  const uniqueFeatures = Array.from(new Set(features));

  return (
    <div className="w-full h-full overflow-auto bg-card rounded-none">
      <div className="p-3 border-b bg-muted/10 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence Log</h3>
        {selectedNodeId && (
          <Badge variant="outline" className="text-[10px] font-mono py-0 h-5">
            Filtered by: {selectedNodeId}
          </Badge>
        )}
      </div>
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
          {uniqueFeatures.map((feature, i) => (
            <TableRow
              key={feature}
              className="border-b transition-none hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              <TableCell className="font-medium px-3 py-2 font-mono text-[11px]">{feature}</TableCell>
              <TableCell className="px-3 py-2">
                <Badge variant={i % 2 === 0 ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0 h-4 rounded-sm">
                  Elevated
                </Badge>
              </TableCell>
              <TableCell className="px-3 py-2 text-muted-foreground">Transaction Pipeline</TableCell>
              <TableCell className="text-right px-3 py-2 text-muted-foreground font-mono">
                {(0.4 - i * 0.1).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
