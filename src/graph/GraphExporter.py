"""
Sentinel AI — Graph Exporter

Exports the knowledge graph and its computed attributes to multiple formats:
GEXF (Gephi), GraphML, and frontend-ready JSON/CSV for React Flow / Cytoscape.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional

import networkx as nx
import pandas as pd


class GraphExporter:
    """Exports a NetworkX graph to GEXF, GraphML, JSON, and CSV."""

    def export_all(
        self,
        graph: nx.DiGraph,
        output_dir: str,
        centrality_scores: Optional[Dict[str, Dict[str, float]]] = None,
        community_map: Optional[Dict[str, int]] = None,
        risk_scores: Optional[Dict[str, float]] = None,
    ) -> None:
        """Runs every export in sequence.

        Args:
            graph: The knowledge graph.
            output_dir: Directory to write all export files into.
            centrality_scores: Optional node-level centrality dict.
            community_map: Optional node -> community_id mapping.
            risk_scores: Optional node -> risk float mapping.
        """
        path = Path(output_dir)
        path.mkdir(parents=True, exist_ok=True)

        # Enrich node attributes before serialising
        enriched = graph.copy()
        for node in enriched.nodes():
            if centrality_scores and node in centrality_scores:
                enriched.nodes[node]["pagerank"] = centrality_scores[node].get(
                    "pagerank", 0
                )
            if community_map and node in community_map:
                enriched.nodes[node]["community"] = community_map[node]
            if risk_scores and node in risk_scores:
                enriched.nodes[node]["risk"] = round(risk_scores[node], 4)

        self._export_gexf(enriched, path)
        self._export_graphml(enriched, path)
        self._export_nodes_json(enriched, path)
        self._export_edges_json(enriched, path)
        self._export_csv(enriched, path)

    # ------------------------------------------------------------------
    # Format-specific exporters
    # ------------------------------------------------------------------

    @staticmethod
    def _export_gexf(graph: nx.DiGraph, path: Path) -> None:
        nx.write_gexf(graph, str(path / "graph.gexf"))

    @staticmethod
    def _export_graphml(graph: nx.DiGraph, path: Path) -> None:
        nx.write_graphml(graph, str(path / "graph.graphml"))

    @staticmethod
    def _export_nodes_json(graph: nx.DiGraph, path: Path) -> None:
        nodes = []
        for node, attrs in graph.nodes(data=True):
            nodes.append(
                {
                    "id": node,
                    "type": attrs.get("type", "Unknown"),
                    "label": node,
                    "risk": attrs.get("risk", 0.0),
                    "community": attrs.get("community", -1),
                    "pagerank": attrs.get("pagerank", 0.0),
                    "fraud": attrs.get("fraud", None),
                }
            )
        with open(path / "nodes.json", "w") as f:
            json.dump(nodes, f, indent=2)

    @staticmethod
    def _export_edges_json(graph: nx.DiGraph, path: Path) -> None:
        edges = []
        for src, tgt, attrs in graph.edges(data=True):
            edges.append(
                {
                    "source": src,
                    "target": tgt,
                    "relationship": attrs.get("relationship", "UNKNOWN"),
                }
            )
        with open(path / "edges.json", "w") as f:
            json.dump(edges, f, indent=2)

    @staticmethod
    def _export_csv(graph: nx.DiGraph, path: Path) -> None:
        node_records = []
        for node, attrs in graph.nodes(data=True):
            node_records.append({"node_id": node, **attrs})
        pd.DataFrame(node_records).to_csv(path / "nodes.csv", index=False)

        edge_records = []
        for src, tgt, attrs in graph.edges(data=True):
            edge_records.append({"source": src, "target": tgt, **attrs})
        pd.DataFrame(edge_records).to_csv(path / "edges.csv", index=False)
