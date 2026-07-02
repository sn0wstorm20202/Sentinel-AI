'use client';

import { motion } from "framer-motion";
import { InvestigationCase } from "@/types";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMotionVariants } from "@/lib/motion/use-motion-variants";

interface EvidenceBoardProps {
  caseData: InvestigationCase;
}

export function EvidenceBoard({ caseData }: EvidenceBoardProps) {
  const { staggerContainerFast, fadeInItem } = useMotionVariants();

  // In a real scenario, this would come from the FIE module's evidence array.
  const features = caseData.intelligence.fraud_hypotheses.flatMap(h => h.supporting_features);
  const uniqueFeatures = Array.from(new Set(features));

  return (
    <div className="w-full h-full overflow-auto bg-card rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Feature Identified</TableHead>
            <TableHead>Impact</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Risk Weight</TableHead>
          </TableRow>
        </TableHeader>
        <motion.tbody
          variants={staggerContainerFast}
          initial="hidden"
          animate="visible"
        >
          {uniqueFeatures.map((feature, i) => (
            <motion.tr
              key={feature}
              variants={fadeInItem}
              className="border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted"
              style={{ willChange: 'opacity' }}
            >
              <TableCell className="font-medium">{feature}</TableCell>
              <TableCell>
                <Badge variant={i % 2 === 0 ? "destructive" : "secondary"}>Elevated</Badge>
              </TableCell>
              <TableCell>Transaction Pipeline</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {(0.4 - i * 0.1).toFixed(2)}
              </TableCell>
            </motion.tr>
          ))}
        </motion.tbody>
      </Table>
    </div>
  );
}
