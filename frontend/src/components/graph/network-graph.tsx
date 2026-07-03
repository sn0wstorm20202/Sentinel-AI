'use client';

import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  OnSelectionChangeParams
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GraphNetwork, GraphNode } from '@/types';
import { useTheme } from 'next-themes';
import CustomNode from './custom-node';
import { useInvestigationStore } from '@/store/investigation-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Flame,
  LocateFixed,
  Network as NetworkIcon,
  Radar,
  Search,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkGraphProps {
  data: GraphNetwork;
}

const COMMUNITY_COLORS = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#9333ea',
  '#d97706',
  '#0891b2',
  '#be185d',
  '#4f46e5',
];

function getCommunityId(node: GraphNode) {
  return String(node.data.community ?? 'Unassigned');
}

function getCommunityColor(communityId: string) {
  let hash = 0;
  for (const character of communityId) {
    hash = (hash * 31 + character.charCodeAt(0)) % COMMUNITY_COLORS.length;
  }
  return COMMUNITY_COLORS[Math.abs(hash)];
}

function fallbackPosition(index: number, communityId: string) {
  const communitySeed = Array.from(communityId).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const ring = Math.floor(index / 8) + 1;
  const angle = ((index + communitySeed) % 16) * (Math.PI / 8);
  return {
    x: 320 + Math.cos(angle) * 180 * ring,
    y: 260 + Math.sin(angle) * 130 * ring,
  };
}

function NetworkGraphInner({ data }: NetworkGraphProps) {
  const { theme } = useTheme();
  const { fitView, getNode, setCenter } = useReactFlow();
  const setSelectedNodeId = useInvestigationStore(s => s.setSelectedNodeId);
  const selectedNodeId = useInvestigationStore(s => s.selectedNodeId);
  const graphSearch = useInvestigationStore(s => s.graphSearch);
  const setGraphSearch = useInvestigationStore(s => s.setGraphSearch);
  const collapsedCommunities = useInvestigationStore(s => s.collapsedCommunities);
  const toggleCommunity = useInvestigationStore(s => s.toggleCommunity);
  const clearCollapsedCommunities = useInvestigationStore(s => s.clearCollapsedCommunities);
  const riskHeatmapEnabled = useInvestigationStore(s => s.riskHeatmapEnabled);
  const setRiskHeatmapEnabled = useInvestigationStore(s => s.setRiskHeatmapEnabled);
  const riskPropagationEnabled = useInvestigationStore(s => s.riskPropagationEnabled);
  const setRiskPropagationEnabled = useInvestigationStore(s => s.setRiskPropagationEnabled);
  
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  const selectedNeighborIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const ids = new Set<string>();
    data.edges.forEach((edge) => {
      if (edge.source === selectedNodeId) ids.add(edge.target);
      if (edge.target === selectedNodeId) ids.add(edge.source);
    });
    return ids;
  }, [data.edges, selectedNodeId]);

  const searchMatches = useMemo(() => {
    const query = graphSearch.trim().toLowerCase();
    if (!query) return new Set<string>();
    return new Set(
      data.nodes
        .filter((node) =>
          `${node.id} ${node.data.label} ${node.data.type} ${node.data.community ?? ''}`
            .toLowerCase()
            .includes(query)
        )
        .map((node) => node.id)
    );
  }, [data.nodes, graphSearch]);

  const visibleNodeIds = useMemo(() => {
    return new Set(
      data.nodes
        .filter((node) => !collapsedCommunities.includes(getCommunityId(node)))
        .map((node) => node.id)
    );
  }, [collapsedCommunities, data.nodes]);

  const computedNodes = useMemo<Node[]>(() => {
    return data.nodes.map((node, index) => {
      const communityId = getCommunityId(node);
      const risk = node.data.risk_score ?? 0;
      const isSelected = node.id === selectedNodeId;
      const isNeighbor = selectedNeighborIds.has(node.id);
      const hasSelection = Boolean(selectedNodeId);

      return {
        ...node,
        type: 'custom',
        selected: isSelected,
        hidden: !visibleNodeIds.has(node.id),
        position: node.position || fallbackPosition(index, communityId),
        data: {
          ...node.data,
          risk_score: risk,
          community: node.data.community ?? 'Unassigned',
          isNeighbor,
          isDimmed: hasSelection && !isSelected && !isNeighbor,
          searchMatch: searchMatches.has(node.id),
          riskHeatmapEnabled,
          communityColor: getCommunityColor(communityId),
        },
      };
    });
  }, [
    data.nodes,
    riskHeatmapEnabled,
    searchMatches,
    selectedNeighborIds,
    selectedNodeId,
    visibleNodeIds,
  ]);

  const highRiskNodeIds = useMemo(
    () => new Set(data.nodes.filter((node) => (node.data.risk_score ?? 0) >= 80).map((node) => node.id)),
    [data.nodes]
  );

  const computedEdges = useMemo<Edge[]>(() => {
    return data.edges.map((edge) => {
      const connectedToSelection = selectedNodeId
        ? edge.source === selectedNodeId || edge.target === selectedNodeId
        : false;
      const hidden = !visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target);
      const propagationEdge = riskPropagationEnabled && (
        highRiskNodeIds.has(edge.source) || highRiskNodeIds.has(edge.target)
      );

      return {
      ...edge,
      hidden,
      animated: propagationEdge,
      labelStyle: { fill: theme === 'dark' ? '#fff' : '#000', fontWeight: 500, fontSize: 10 },
      labelBgStyle: { fill: theme === 'dark' ? '#020817' : '#ffffff', fillOpacity: 0.8 },
      style: {
        strokeWidth: connectedToSelection ? 2.5 : 1,
        stroke: propagationEdge
          ? '#dc2626'
          : connectedToSelection
            ? '#2563eb'
            : theme === 'dark'
              ? '#64748b'
              : '#94a3b8',
        opacity: selectedNodeId && !connectedToSelection ? 0.25 : 0.85,
      },
    };
    });
  }, [
    data.edges,
    highRiskNodeIds,
    riskPropagationEnabled,
    selectedNodeId,
    theme,
    visibleNodeIds,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges);

  useEffect(() => {
    setNodes((previousNodes) =>
      computedNodes.map((node) => {
        const previous = previousNodes.find((item) => item.id === node.id);
        return previous ? { ...node, position: previous.position } : node;
      })
    );
  }, [computedNodes, setNodes]);

  useEffect(() => {
    setEdges(computedEdges);
  }, [computedEdges, setEdges]);

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

  useEffect(() => {
    const firstMatch = Array.from(searchMatches)[0];
    if (!firstMatch) return;
    setSelectedNodeId(firstMatch);
    const node = getNode(firstMatch);
    if (node) {
      setCenter(node.position.x, node.position.y, { zoom: 1.35, duration: 350 });
    }
  }, [getNode, searchMatches, setCenter, setSelectedNodeId]);

  const selectedNode = useMemo(
    () => data.nodes.find((node) => node.id === selectedNodeId),
    [data.nodes, selectedNodeId]
  );

  const selectedDegree = useMemo(() => {
    if (!selectedNodeId) return 0;
    return data.edges.filter((edge) => edge.source === selectedNodeId || edge.target === selectedNodeId).length;
  }, [data.edges, selectedNodeId]);

  const communities = useMemo(() => {
    const grouped = new Map<string, { count: number; maxRisk: number; color: string }>();
    data.nodes.forEach((node) => {
      const communityId = getCommunityId(node);
      const current = grouped.get(communityId) ?? {
        count: 0,
        maxRisk: 0,
        color: getCommunityColor(communityId),
      };
      grouped.set(communityId, {
        ...current,
        count: current.count + 1,
        maxRisk: Math.max(current.maxRisk, node.data.risk_score ?? 0),
      });
    });
    return Array.from(grouped.entries())
      .map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => b.maxRisk - a.maxRisk);
  }, [data.nodes]);

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-none bg-background"
      data-sentinel-graph-workspace
      tabIndex={-1}
      aria-label="Graph investigation workspace"
    >
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
        zoomOnScroll
        panOnScroll
        selectionOnDrag
        proOptions={{ hideAttribution: true }}
      >
        <Panel position="top-left" className="m-3 w-[min(360px,calc(100vw-3rem))] rounded-md border bg-card/95 p-2 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={graphSearch}
              onChange={(event) => setGraphSearch(event.target.value)}
              placeholder="Search graph entities..."
              className="h-7 bg-background text-xs"
              data-sentinel-search="graph"
              aria-label="Search graph entities"
            />
            {graphSearch && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setGraphSearch('')}
                aria-label="Clear graph search"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <Button
              variant={riskHeatmapEnabled ? 'default' : 'outline'}
              size="xs"
              onClick={() => setRiskHeatmapEnabled(!riskHeatmapEnabled)}
            >
              <Flame className="h-3 w-3" />
              Heatmap
            </Button>
            <Button
              variant={riskPropagationEnabled ? 'default' : 'outline'}
              size="xs"
              onClick={() => setRiskPropagationEnabled(!riskPropagationEnabled)}
            >
              <Radar className="h-3 w-3" />
              Propagation
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => fitView({ duration: 300, padding: 0.2 })}
            >
              <LocateFixed className="h-3 w-3" />
              Fit
            </Button>
          </div>
        </Panel>

        <Panel position="top-right" className="m-3 max-h-[44vh] w-64 overflow-hidden rounded-md border bg-card/95 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Communities
            </div>
            {collapsedCommunities.length > 0 && (
              <Button variant="ghost" size="xs" onClick={clearCollapsedCommunities}>
                Expand all
              </Button>
            )}
          </div>
          <div className="max-h-[36vh] overflow-y-auto p-2">
            {communities.slice(0, 12).map((community) => {
              const collapsed = collapsedCommunities.includes(community.id);
              return (
                <button
                  key={community.id}
                  type="button"
                  onClick={() => toggleCommunity(community.id)}
                  className={cn(
                    'mb-1 flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left text-xs hover:bg-muted/60',
                    collapsed && 'opacity-60'
                  )}
                  aria-pressed={collapsed}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: community.color }}
                    />
                    <span className="truncate font-mono">C{community.id}</span>
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span>{community.count}</span>
                    <Badge variant={community.maxRisk >= 80 ? 'destructive' : 'outline'} size="sm">
                      {community.maxRisk.toFixed(0)}
                    </Badge>
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        {selectedNode && (
          <Panel position="bottom-right" className="m-3 w-72 rounded-md border bg-card/95 p-3 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-2 border-b pb-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entity Inspector</div>
                <div className="mt-1 truncate font-mono text-sm">{selectedNode.id}</div>
              </div>
              <Button variant="ghost" size="icon-xs" onClick={() => setSelectedNodeId(null)} aria-label="Clear selected node">
                <X className="h-3 w-3" />
              </Button>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded bg-muted/40 p-2">
                <dt className="text-[10px] uppercase text-muted-foreground">Type</dt>
                <dd>{selectedNode.data.type}</dd>
              </div>
              <div className="rounded bg-muted/40 p-2">
                <dt className="text-[10px] uppercase text-muted-foreground">Risk</dt>
                <dd className="font-mono tabular-nums">{(selectedNode.data.risk_score ?? 0).toFixed(1)}</dd>
              </div>
              <div className="rounded bg-muted/40 p-2">
                <dt className="text-[10px] uppercase text-muted-foreground">Community</dt>
                <dd className="font-mono">{String(selectedNode.data.community ?? 'Unassigned')}</dd>
              </div>
              <div className="rounded bg-muted/40 p-2">
                <dt className="text-[10px] uppercase text-muted-foreground">Neighbours</dt>
                <dd className="font-mono tabular-nums">{selectedDegree}</dd>
              </div>
              <div className="col-span-2 rounded bg-muted/40 p-2">
                <dt className="text-[10px] uppercase text-muted-foreground">Label</dt>
                <dd className="truncate">{selectedNode.data.label}</dd>
              </div>
            </dl>
          </Panel>
        )}

        <Panel position="bottom-left" className="m-3 rounded-md border bg-card/95 p-2 shadow-sm backdrop-blur">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <NetworkIcon className="h-3 w-3" />
            Legend
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> High risk</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Elevated</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Selected path</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-500" /> Relationship</span>
          </div>
        </Panel>

        <MiniMap
          pannable
          zoomable
          className="!bg-card !border !border-border"
          nodeColor={(node) => String(node.data.communityColor ?? '#64748b')}
          nodeStrokeWidth={2}
        />
        <Controls className="!bg-card !border-border !fill-foreground" />
        <Background gap={16} size={1} color={theme === 'dark' ? '#333' : '#e5e5e5'} />
      </ReactFlow>
    </div>
  );
}

export function NetworkGraph({ data }: NetworkGraphProps) {
  return (
    <ReactFlowProvider>
      <NetworkGraphInner data={data} />
    </ReactFlowProvider>
  );
}
