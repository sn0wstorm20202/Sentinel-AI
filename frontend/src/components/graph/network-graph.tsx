'use client';

import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GraphNetwork } from '@/types';
import { useTheme } from 'next-themes';

interface NetworkGraphProps {
  data: GraphNetwork;
}

export function NetworkGraph({ data }: NetworkGraphProps) {
  const { theme } = useTheme();
  
  const [nodes, , onNodesChange] = useNodesState(data.nodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(data.edges as Edge[]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-full bg-background rounded-md border overflow-hidden shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        colorMode={theme === 'dark' ? 'dark' : 'light'}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
