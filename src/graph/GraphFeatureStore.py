"""
Sentinel AI — Graph Feature Store

Assembles graph-derived features (centrality, community, risk, topology)
into a single DataFrame suitable for Phase 8 GNN training.
Exports as Parquet with an accompanying feature manifest.
"""

import json
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import networkx as nx
import pandas as pd


class GraphFeatureStore:
    """Builds and persists the graph feature store for downstream ML."""

    FEATURE_DESCRIPTIONS = {
        "node_id": "Unique node identifier",
        "node_type": "Entity type (Transaction, Customer, Device, etc.)",
        "degree": "Number of direct connections",
        "pagerank": "PageRank centrality score",
        "betweenness": "Betweenness centrality score",
        "closeness": "Closeness centrality score",
        "eigenvector": "Eigenvector centrality score",
        "community_id": "Detected community identifier",
        "community_size": "Number of nodes in the community",
        "community_risk": "Average risk of the community",
        "entity_risk": "Propagated entity risk score",
        "neighbor_fraud_ratio": "Fraction of 1-hop neighbours that are fraud Transactions",
        "graph_distance_to_fraud": "Shortest path to nearest fraud Transaction (max 10)",
    }

    def build(
        self,
        graph: nx.DiGraph,
        centrality_scores: Dict[str, Dict[str, float]],
        community_map: Dict[str, int],
        community_risks: Dict[int, float],
        entity_risks: Dict[str, float],
    ) -> pd.DataFrame:
        """Assembles the full feature DataFrame.

        Args:
            graph: The directed knowledge graph.
            centrality_scores: {node_id: {degree, pagerank, ...}}.
            community_map: {node_id: community_id}.
            community_risks: {community_id: avg_risk}.
            entity_risks: {node_id: risk_score}.

        Returns:
            A pandas DataFrame with one row per node.
        """
        G_undirected = graph.to_undirected()

        # Pre-compute community sizes
        community_sizes: Dict[int, int] = {}
        for cid in community_map.values():
            community_sizes[cid] = community_sizes.get(cid, 0) + 1

        # Pre-compute fraud node set for BFS
        fraud_nodes = {
            n
            for n, attrs in graph.nodes(data=True)
            if attrs.get("type") == "Transaction" and attrs.get("fraud", 0) == 1
        }

        records: List[Dict] = []
        for node in graph.nodes():
            attrs = graph.nodes[node]
            cent = centrality_scores.get(node, {})
            cid = community_map.get(node, -1)

            nfr = self._neighbor_fraud_ratio(graph, G_undirected, node)
            dist = self._distance_to_fraud(G_undirected, node, fraud_nodes)

            records.append(
                {
                    "node_id": node,
                    "node_type": attrs.get("type", "Unknown"),
                    "degree": cent.get("degree", 0.0),
                    "pagerank": cent.get("pagerank", 0.0),
                    "betweenness": cent.get("betweenness", 0.0),
                    "closeness": cent.get("closeness", 0.0),
                    "eigenvector": cent.get("eigenvector", 0.0),
                    "community_id": cid,
                    "community_size": community_sizes.get(cid, 0),
                    "community_risk": community_risks.get(cid, 0.0),
                    "entity_risk": round(entity_risks.get(node, 0.0), 4),
                    "neighbor_fraud_ratio": round(nfr, 4),
                    "graph_distance_to_fraud": dist,
                }
            )

        return pd.DataFrame(records)

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def save(self, df: pd.DataFrame, output_dir: str) -> None:
        """Saves the feature store as Parquet and writes the manifest."""
        path = Path(output_dir)
        path.mkdir(parents=True, exist_ok=True)

        df.to_parquet(path / "graph_feature_store.parquet", index=False)
        self._write_manifest(df, path)

    def _write_manifest(self, df: pd.DataFrame, path: Path) -> None:
        """Writes a JSON manifest describing the feature store."""
        features = []
        for col in df.columns:
            features.append(
                {
                    "name": col,
                    "dtype": str(df[col].dtype),
                    "description": self.FEATURE_DESCRIPTIONS.get(col, ""),
                }
            )

        manifest = {
            "feature_store_version": "1.0",
            "build_timestamp": datetime.now(timezone.utc).strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            ),
            "total_rows": len(df),
            "total_features": len(df.columns),
            "features": features,
        }
        with open(path / "graph_feature_manifest.json", "w") as f:
            json.dump(manifest, f, indent=2)

    # ------------------------------------------------------------------
    # Feature computation helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _neighbor_fraud_ratio(
        graph: nx.DiGraph, G_undirected: nx.Graph, node: str
    ) -> float:
        """Fraction of 1-hop neighbours that are fraud Transaction nodes."""
        neighbours = list(G_undirected.neighbors(node))
        if not neighbours:
            return 0.0
        fraud_count = sum(
            1
            for n in neighbours
            if graph.nodes[n].get("type") == "Transaction"
            and graph.nodes[n].get("fraud", 0) == 1
        )
        return fraud_count / len(neighbours)

    @staticmethod
    def _distance_to_fraud(
        G_undirected: nx.Graph, node: str, fraud_nodes: set, max_dist: int = 10
    ) -> int:
        """BFS shortest path to nearest fraud Transaction node (capped)."""
        if node in fraud_nodes:
            return 0

        visited = {node}
        queue = deque([(node, 0)])

        while queue:
            current, dist = queue.popleft()
            if dist >= max_dist:
                return max_dist
            for neighbour in G_undirected.neighbors(current):
                if neighbour not in visited:
                    if neighbour in fraud_nodes:
                        return dist + 1
                    visited.add(neighbour)
                    queue.append((neighbour, dist + 1))

        return max_dist
