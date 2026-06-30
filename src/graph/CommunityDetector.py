"""
Sentinel AI — Community Detection Engine

Identifies communities within the knowledge graph using standard
network-science algorithms (Louvain or Greedy Modularity).
Generates a Community Registry with fraud density, risk tiers,
and human-readable explanations for each detected cluster.
"""

from typing import Dict, List, Optional, Tuple

import networkx as nx


class CommunityDetector:
    """Detects and characterises communities in the Sentinel knowledge graph."""

    RISK_TIERS = [
        (0.75, "Critical"),
        (0.50, "High"),
        (0.25, "Elevated"),
        (0.00, "Low"),
    ]

    def detect(self, graph: nx.DiGraph, method: str = "greedy") -> Dict[str, int]:
        """Runs community detection on the undirected projection of *graph*.

        Args:
            graph: The directed knowledge graph.
            method: 'louvain' or 'greedy' (default).

        Returns:
            Mapping of node_id -> community_id (int).
        """
        G_undirected = graph.to_undirected()

        if method == "louvain":
            try:
                import community as community_louvain  # python-louvain

                partition = community_louvain.best_partition(G_undirected)
                return partition
            except ImportError:
                pass  # fall through to greedy

        # Greedy Modularity (built into NetworkX)
        communities = nx.community.greedy_modularity_communities(G_undirected)
        partition: Dict[str, int] = {}
        for cid, members in enumerate(communities):
            for node in members:
                partition[node] = cid
        return partition

    # ------------------------------------------------------------------
    # Community Registry
    # ------------------------------------------------------------------

    def build_registry(
        self,
        graph: nx.DiGraph,
        community_map: Dict[str, int],
    ) -> List[Dict]:
        """Builds a rich registry describing every community.

        Returns a list of dicts, one per community, containing:
        community_id, size, fraud_count, fraud_percentage, density,
        average_risk, central_node, risk_tier, explanation.
        """
        # Group nodes by community
        communities: Dict[int, List[str]] = {}
        for node, cid in community_map.items():
            communities.setdefault(cid, []).append(node)

        G_undirected = graph.to_undirected()
        registry: List[Dict] = []

        for cid, members in sorted(communities.items()):
            # Fraud stats (only Transaction nodes carry a fraud label)
            txn_nodes = [
                n for n in members if graph.nodes[n].get("type") == "Transaction"
            ]
            fraud_count = sum(
                1 for n in txn_nodes if graph.nodes[n].get("fraud", 0) == 1
            )
            fraud_pct = fraud_count / max(len(txn_nodes), 1)

            # Subgraph density
            subgraph = G_undirected.subgraph(members)
            density = nx.density(subgraph)

            # Central node (highest degree inside subgraph)
            if len(subgraph) > 0:
                central_node = max(subgraph.nodes(), key=lambda n: subgraph.degree(n))
            else:
                central_node = None

            # Risk tier
            risk_tier = "Low"
            for threshold, tier in self.RISK_TIERS:
                if fraud_pct >= threshold:
                    risk_tier = tier
                    break

            # Explanation
            explanation = self._explain(
                cid, len(members), fraud_pct, density, risk_tier
            )

            registry.append(
                {
                    "community_id": cid,
                    "size": len(members),
                    "transaction_count": len(txn_nodes),
                    "fraud_count": fraud_count,
                    "fraud_percentage": round(fraud_pct, 4),
                    "density": round(density, 6),
                    "central_node": central_node,
                    "risk_tier": risk_tier,
                    "explanation": explanation,
                }
            )

        return registry

    def get_suspicious_communities(
        self,
        registry: List[Dict],
        fraud_threshold: float = 0.30,
    ) -> List[Dict]:
        """Returns communities whose fraud percentage exceeds *fraud_threshold*
        and whose density is above the registry-wide average."""
        avg_density = sum(r["density"] for r in registry) / max(len(registry), 1)
        return [
            r
            for r in registry
            if r["fraud_percentage"] >= fraud_threshold and r["density"] >= avg_density
        ]

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _explain(
        cid: int, size: int, fraud_pct: float, density: float, tier: str
    ) -> str:
        """Generates a human-readable explanation string for a community."""
        return (
            f"Community {cid} contains {size} entities with a "
            f"{fraud_pct * 100:.1f}% fraud concentration and {density:.4f} density. "
            f"Risk tier: {tier}."
        )
