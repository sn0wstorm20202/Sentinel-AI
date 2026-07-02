'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { User, CreditCard, Laptop, Network, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useInvestigationStore } from '@/store/investigation-store';

const iconMap: Record<string, React.ElementType> = {
  Customer: User,
  Transaction: CreditCard,
  Device: Laptop,
  IP_Address: Network,
  Merchant: ShoppingCart,
};

function CustomNode({ id, data, selected }: NodeProps) {
  const Icon = iconMap[data.type as string] || Network;
  const risk = (data.risk_score as number) || 0;
  
  const isHighRisk = risk > 80;
  
  return (
    <div 
      className={`relative px-3 py-2 shadow-sm rounded-md border-2 bg-card min-w-[140px] ${
        selected ? 'border-primary ring-2 ring-primary/20' : 
        isHighRisk ? 'border-destructive/50' : 'border-border'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-sm ${isHighRisk ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider leading-none mb-0.5">{data.type as string}</span>
            <span className="text-xs font-mono font-medium leading-none truncate max-w-[80px]">{data.label as string}</span>
          </div>
        </div>
        
        {isHighRisk && (
          <div className="flex items-center justify-center text-destructive">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
}

export default memo(CustomNode);
