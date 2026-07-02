'use client';

import { motion } from "framer-motion";
import { InvestigationCase } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShieldAlert, AlertTriangle, Lightbulb } from "lucide-react";
import { useMotionVariants } from "@/lib/motion/use-motion-variants";

interface HypothesisPanelProps {
  caseData: InvestigationCase;
}

export function HypothesisPanel({ caseData }: HypothesisPanelProps) {
  const { intelligence, action_engine, risk_assessment } = caseData;
  const { staggerContainer, staggerContainerFast, fadeUpItem } = useMotionVariants();

  return (
    <motion.div
      className="flex flex-col gap-4 h-full overflow-y-auto"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Risk assessment */}
      <motion.div variants={fadeUpItem} style={{ willChange: 'opacity, transform' }}>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Risk Score</p>
                <p className="text-3xl font-bold text-destructive">{risk_assessment.risk_score}/100</p>
              </div>
              <Badge variant="destructive" className="mb-1">{risk_assessment.risk_tier}</Badge>
            </div>
            <Progress value={risk_assessment.risk_score} className="h-2 [&>div]:bg-destructive" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Intelligence summary */}
      <motion.div variants={fadeUpItem} style={{ willChange: 'opacity, transform' }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-primary" />
              Intelligence Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {intelligence.natural_language_summary.hypothesis_explanation}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Generated hypotheses — staggered */}
      <div className="space-y-3">
        <motion.h3
          variants={fadeUpItem}
          className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1"
        >
          Generated Hypotheses
        </motion.h3>
        <motion.div className="space-y-3" variants={staggerContainerFast}>
          {intelligence.fraud_hypotheses.map((hyp, i) => (
            <motion.div key={i} variants={fadeUpItem} style={{ willChange: 'opacity, transform' }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold">{hyp.name}</p>
                    <Badge variant={hyp.confidence > 0.6 ? "default" : "secondary"}>
                      {(hyp.confidence * 100).toFixed(0)}% Conf
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {hyp.supporting_features.map(feat => (
                      <Badge key={feat} variant="outline" className="text-xs text-muted-foreground bg-muted/50">
                        {feat}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Recommended actions — staggered */}
      <div className="space-y-3 mt-4">
        <motion.h3
          variants={fadeUpItem}
          className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1"
        >
          Recommended Actions
        </motion.h3>
        <motion.div className="space-y-3" variants={staggerContainerFast}>
          {action_engine.recommended_actions.map((action, i) => (
            <motion.div
              key={i}
              variants={fadeUpItem}
              className="flex gap-3 p-3 rounded-md bg-muted/30 border"
              style={{ willChange: 'opacity, transform' }}
            >
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-sm">{action.action}</p>
                <p className="text-xs text-muted-foreground mt-1">{action.reason}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
