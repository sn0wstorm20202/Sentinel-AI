'use client';

import { FileSearch } from "lucide-react";

export default function CasesDashboardEmptyState() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
      <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
        <FileSearch className="h-8 w-8 text-muted-foreground/70" />
      </div>
      <div>
        <h3 className="text-lg font-medium text-foreground">No Case Selected</h3>
        <p className="text-sm mt-1 max-w-sm mx-auto">
          Select a case from the queue on the left to view its graph, evidence, and begin your investigation.
        </p>
      </div>
    </div>
  );
}
