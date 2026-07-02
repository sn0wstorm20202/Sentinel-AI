'use client';

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CasesTable } from "@/components/features/investigation/cases-table";
import { useMotionVariants } from "@/lib/motion/use-motion-variants";

const STAT_CARDS = [
  { title: "Active Cases",       value: "14", delta: "+2 from yesterday" },
  { title: "Critical Risk",      value: "3",  delta: "+1 from yesterday" },
  { title: "Avg Resolution Time",value: "4.2h",delta: "-0.3h this week"  },
  { title: "Model Confidence",   value: "96%", delta: "XGBoost v4.1"      },
];

export default function CasesDashboard() {
  const { staggerContainer, staggerContainerFast, fadeUpItem } = useMotionVariants();

  return (
    <motion.div
      className="flex-1 space-y-4 p-8 pt-6 h-full overflow-y-auto"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        variants={fadeUpItem}
      >
        <h2 className="text-3xl font-bold tracking-tight">Investigations</h2>
      </motion.div>

      {/* Stat cards — staggered grid */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={staggerContainerFast}
      >
        {STAT_CARDS.map((card) => (
          <motion.div key={card.title} variants={fadeUpItem} style={{ willChange: 'opacity, transform' }}>
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.delta}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div className="mt-8" variants={fadeUpItem}>
        <CasesTable />
      </motion.div>
    </motion.div>
  );
}
