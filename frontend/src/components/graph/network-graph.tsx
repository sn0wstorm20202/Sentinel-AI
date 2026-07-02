'use client';

import { useCallback, useMemo, useEffect } from 'react';
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
  Connection,
  NodeChange,
  OnSelectionChangeParams
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GraphNetwork } from '@/types';
import { useTheme } from 'next-themes';
import CustomNode from './custom-node';
import { useInvestigationStore } from '@/store/investigation-store';

interface NetworkGraphProps {
  data: GraphNetwork;
}

export function NetworkGraph({ data }: NetworkGraphProps) {
  const { theme } = useTheme();
  const setSelectedNodeId = useInvestigationStore(s => s.setSelectedNodeId);
  const selectedNodeId = useInvestigationStore(s => s.selectedNodeId);
  
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // Map nodes to custom type
  const initialNodes = useMemo(() => {
    return data.nodes.map(n => ({
      ...n,
      type: 'custom',
      selected: n.id === selectedNodeId,
      // Provide an initial grid/circle layout if positions are missing
      position: n.position || { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 400 + 100 
      }
    }));
  }, [data.nodes, selectedNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(data.edges as Edge[]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onSelectionChange = useCallback(({ nodes }: OnSelectionChangeParams) => {
    if (nodes.length > 0) {
      setSelectedNodeId(nodes[0].id);
    } else {
      setSelectedNodeId(null);
    }
  }, [setSelectedNodeId]);

  return (
    <div className="w-full h-full bg-background rounded-none overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        onConnect={onConnect}
        colorMode={theme === 'dark' ? 'dark' : 'light'}
        fitView
        minZoom={0.2}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
      >
        <Controls className="!bg-card !border-border !fill-foreground" />
        <Background gap={16} size={1} color={theme === 'dark' ? '#333' : '#e5e5e5'} />
      </ReactFlow>
    </div>
  );
}
