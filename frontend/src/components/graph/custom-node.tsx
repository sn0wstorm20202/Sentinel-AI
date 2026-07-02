'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { User, CreditCard, Laptop, Network, ShoppingCart, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  Customer: User,
  Transaction: CreditCard,
  Device: Laptop,
  IP_Address: Network,
  Merchant: ShoppingCart,
};

function CustomNode({ data, selected }: NodeProps) {
  const nodeData = data as {
    type?: string;
    label?: string;
    risk_score?: number;
    community?: string | number;
    isDimmed?: boolean;
    isNeighbor?: boolean;
    searchMatch?: boolean;
    riskHeatmapEnabled?: boolean;
    communityColor?: string;
  };
  const Icon = iconMap[nodeData.type ?? ''] || Network;
  const risk = nodeData.risk_score || 0;
  
  const isHighRisk = risk > 80;
  const heatmapBackground = nodeData.riskHeatmapEnabled
    ? risk > 90
      ? 'rgba(220, 38, 38, 0.16)'
      : risk > 70
        ? 'rgba(245, 158, 11, 0.14)'
        : risk > 40
          ? 'rgba(59, 130, 246, 0.10)'
          : undefined
    : undefined;
  
  return (
    <div 
      className={cn(
        'relative min-w-[150px] rounded-md border-2 bg-card px-3 py-2 shadow-sm transition-opacity',
        selected && 'border-primary ring-2 ring-primary/20',
        !selected && isHighRisk && 'border-destructive/50',
        !selected && !isHighRisk && 'border-border',
        nodeData.isDimmed && 'opacity-35',
        nodeData.isNeighbor && !selected && 'ring-1 ring-primary/30',
        nodeData.searchMatch && 'ring-2 ring-amber-400/60'
      )}
      style={{
        backgroundColor: heatmapBackground,
        borderLeftColor: nodeData.communityColor,
        borderLeftWidth: 5,
      }}
      aria-label={`${nodeData.type ?? 'Entity'} ${nodeData.label ?? ''}, risk ${risk.toFixed(1)}`}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-sm ${isHighRisk ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="mb-0.5 text-[10px] font-semibold uppercase leading-none tracking-wider text-muted-foreground">{nodeData.type}</span>
            <span className="max-w-[88px] truncate font-mono text-xs font-medium leading-none">{nodeData.label}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-0.5">
          {isHighRisk && (
          <div className="flex items-center justify-center text-destructive" title="High risk entity">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          )}
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {risk.toFixed(0)}
          </span>
        </div>
      </div>

      {nodeData.community !== undefined && (
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/60 pt-1">
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Community</span>
          <span className="font-mono text-[10px] text-muted-foreground">{String(nodeData.community)}</span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
}

export default memo(CustomNode);
