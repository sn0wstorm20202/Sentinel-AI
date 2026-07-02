'use client';

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MetricsChart } from "@/components/features/mlops/metrics-chart";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BrainCircuit, Activity, Database, GitBranch } from "lucide-react";
import { useMotionVariants } from "@/lib/motion/use-motion-variants";

const experiments = [
  { id: "EXP-891", model: "XGBoost-V4.1",  status: "Deployed",   auc: "0.955", date: "2026-06-30" },
  { id: "EXP-890", model: "LightGBM-V2.0", status: "Evaluating", auc: "0.950", date: "2026-06-28" },
  { id: "EXP-889", model: "TabNet-V1.0",   status: "Failed",     auc: "-",     date: "2026-06-25" },
  { id: "EXP-888", model: "XGBoost-V4.0",  status: "Archived",   auc: "0.942", date: "2026-05-15" },
];

const statCards = [
  { title: "Champion Model", value: "XGBoost v4.1", sub: "Deployed 2 days ago", badge: "Active", icon: BrainCircuit, iconColor: "" },
  { title: "Current AUC-ROC", value: "0.955", sub: "+0.013 from previous champion", badge: null, icon: Activity, iconColor: "text-emerald-500", valueColor: "text-emerald-500" },
  { title: "Graph Engine Status", value: "Connected", sub: "1.2M nodes, 4.5M edges", badge: null, icon: GitBranch, iconColor: "" },
  { title: "Feature Store", value: "Healthy", sub: "No data drift detected", badge: null, icon: Database, iconColor: "" },
];

export default function MlOpsDashboard() {
  const { staggerContainer, staggerContainerFast, fadeUpItem } = useMotionVariants();

  return (
    <motion.div
      className="flex-1 space-y-6 p-8 overflow-y-auto"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="flex items-center justify-between" variants={fadeUpItem}>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">MLOps Pipeline</h2>
          <p className="text-muted-foreground mt-1">Monitor champion models, view experiments, and track data drift.</p>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={staggerContainerFast}
      >
        {statCards.map((card) => (
          <motion.div key={card.title} variants={fadeUpItem} style={{ willChange: 'opacity, transform' }}>
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-4 w-4 text-muted-foreground ${card.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${'valueColor' in card ? card.valueColor : ''}`}>{card.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {card.badge && (
                    <Badge variant="default" className="text-[10px] px-1 py-0 h-4">{card.badge}</Badge>
                  )}
                  {card.sub}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts row */}
      <motion.div className="grid gap-4 md:grid-cols-7" variants={fadeUpItem}>
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Model Performance (AUC-ROC)</CardTitle>
            <CardDescription>Historical performance of Champion vs Challenger models.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <MetricsChart />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Experiments</CardTitle>
            <CardDescription>Latest MLflow tracking runs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run ID</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>AUC</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiments.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="font-medium">{exp.id}</TableCell>
                    <TableCell>{exp.model}</TableCell>
                    <TableCell>{exp.auc}</TableCell>
                    <TableCell>
                      <Badge variant={exp.status === 'Deployed' ? 'default' : exp.status === 'Failed' ? 'destructive' : 'secondary'}>
                        {exp.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
