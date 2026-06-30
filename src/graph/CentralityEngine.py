"""
Sentinel AI — Centrality Engine

Computes standard network-science centrality metrics and graph quality
indicators on the knowledge graph.
"""

from typing import Any, Dict, List

import networkx as nx


class CentralityEngine:
    """Computes node-level centrality scores and graph-level quality metrics."""

    def compute_all(self, graph: nx.DiGraph) -> Dict[str, Dict[str, float]]:
        """Computes five centrality measures for every node.

        Returns:
            {node_id: {degree, betweenness, pagerank, closeness, eigenvector}}
        """
        G = graph.to_undirected()

        degree = nx.degree_centrality(G)
        betweenness = nx.betweenness_centrality(G, k=min(500, len(G)))
        pagerank = nx.pagerank(graph, alpha=0.85, max_iter=200)
        closeness = nx.closeness_centrality(G)

        try:
            eigenvector = nx.eigenvector_centrality(G, max_iter=500, tol=1e-06)
        except nx.PowerIterationFailedConvergence:
            eigenvector = {n: 0.0 for n in G.nodes()}

        scores: Dict[str, Dict[str, float]] = {}
        for node in graph.nodes():
            scores[node] = {
                "degree": round(degree.get(node, 0.0), 6),
                "betweenness": round(betweenness.get(node, 0.0), 6),
                "pagerank": round(pagerank.get(node, 0.0), 6),
                "closeness": round(closeness.get(node, 0.0), 6),
                "eigenvector": round(eigenvector.get(node, 0.0), 6),
            }
        return scores

    def compute_graph_quality_metrics(self, graph: nx.DiGraph) -> Dict[str, Any]:
        """Computes graph-level quality / topology metrics.

        Returns:
            Dict with assortativity, clustering_coefficient, transitivity,
            triangle_count, avg_neighbor_degree.
        """
        G = graph.to_undirected()

        try:
            assortativity = round(nx.degree_assortativity_coefficient(G), 6)
        except (ValueError, ZeroDivisionError):
            assortativity = None

        avg_clustering = round(nx.average_clustering(G), 6)
        transitivity = round(nx.transitivity(G), 6)
        triangles = sum(nx.triangles(G).values()) // 3

        avg_neighbor_deg_dict = nx.average_neighbor_degree(G)
        avg_neighbor_deg = round(
            sum(avg_neighbor_deg_dict.values()) / max(len(avg_neighbor_deg_dict), 1), 4
        )

        return {
            "assortativity": assortativity,
            "average_clustering_coefficient": avg_clustering,
            "transitivity": transitivity,
            "triangle_count": triangles,
            "average_neighbor_degree": avg_neighbor_deg,
        }

    def to_records(self, scores: Dict[str, Dict[str, float]]) -> List[Dict]:
        """Converts the centrality dict to a flat list of dicts for CSV export."""
        records = []
        for node_id, metrics in scores.items():
            records.append({"node_id": node_id, **metrics})
        return records
