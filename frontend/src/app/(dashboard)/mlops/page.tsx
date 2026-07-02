'use client';

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MetricsChart } from "@/components/features/mlops/metrics-chart";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BrainCircuit, Activity, Database, GitBranch } from "lucide-react";
import { useMotionVariants } from "@/lib/motion/use-motion-variants";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useMLOpsMetrics } from "@/lib/api/hooks/use-mlops";
import { Skeleton } from "@/components/ui/skeleton";


export default function MlOpsDashboard() {
  const { staggerContainer, staggerContainerFast, fadeUpItem } = useMotionVariants();
  const { data: metrics, isLoading } = useMLOpsMetrics();

  const statCards = [
    { title: "Champion Model", value: metrics?.champion_model || "Loading...", sub: "Deployed recently", badge: "Active", icon: BrainCircuit, iconColor: "" },
    { title: "Current AUC-ROC", value: metrics?.auc_roc?.toString() || "-", sub: "Latest evaluation", badge: null, icon: Activity, iconColor: "text-emerald-500", valueColor: "text-emerald-500" },
    { title: "Graph Engine Status", value: "Connected", sub: "Live data", badge: null, icon: GitBranch, iconColor: "" },
    { title: "Feature Store", value: metrics?.feature_store_status || "Checking...", sub: "Data drift monitoring", badge: null, icon: Database, iconColor: "" },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 overflow-y-auto p-8" role="status" aria-label="Loading MLOps dashboard">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-2 pb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-4 self-end" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[350px] w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary name="MLOps Dashboard">
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
                    <Badge variant="default" size="sm">{card.badge}</Badge>
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
                {metrics?.experiments?.map((exp) => (
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
    </ErrorBoundary>
  );
}
