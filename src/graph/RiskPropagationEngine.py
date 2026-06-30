"""
Sentinel AI — Iterative Risk Propagation Engine

Propagates fraud risk through the knowledge graph using an iterative
message-passing scheme inspired by Belief Propagation / PageRank.
Risk flows from known-fraud Transaction nodes outward through shared
Devices, IPs, Merchants, and Customers until convergence.
"""

from typing import Dict, List, Optional, Tuple

import networkx as nx


class RiskPropagationEngine:
    """Propagates transaction-level fraud risk across the full entity graph."""

    RISK_TIERS = [
        (0.75, "Critical"),
        (0.50, "High"),
        (0.25, "Elevated"),
        (0.00, "Low"),
    ]

    def __init__(
        self, damping: float = 0.85, max_iterations: int = 10, epsilon: float = 0.001
    ):
        """
        Args:
            damping: Weight given to neighbour signal vs. prior (0-1).
            max_iterations: Hard cap on propagation rounds.
            epsilon: Convergence threshold (max absolute change).
        """
        self.damping = damping
        self.max_iterations = max_iterations
        self.epsilon = epsilon
        self.risk_scores: Dict[str, float] = {}
        self.iterations_run: int = 0

    # ------------------------------------------------------------------
    # Core propagation
    # ------------------------------------------------------------------

    def propagate(self, graph: nx.DiGraph) -> Dict[str, float]:
        """Runs iterative risk propagation until convergence or max iterations.

        Args:
            graph: The directed knowledge graph with fraud labels on Transaction nodes.

        Returns:
            Dict mapping every node_id to its final risk score in [0, 1].
        """
        G = graph.to_undirected()

        # Initialise: Transaction nodes get their fraud label; others start at 0
        risk: Dict[str, float] = {}
        for node, attrs in graph.nodes(data=True):
            if attrs.get("type") == "Transaction":
                risk[node] = float(attrs.get("fraud", 0))
            else:
                risk[node] = 0.0

        for iteration in range(1, self.max_iterations + 1):
            new_risk: Dict[str, float] = {}
            max_delta = 0.0

            for node in G.nodes():
                node_type = graph.nodes[node].get("type")

                # Transaction nodes keep their ground-truth label (anchors)
                if node_type == "Transaction":
                    new_risk[node] = risk[node]
                    continue

                neighbours = list(G.neighbors(node))
                if not neighbours:
                    new_risk[node] = risk[node]
                    continue

                neighbour_avg = sum(risk.get(n, 0.0) for n in neighbours) / len(
                    neighbours
                )
                updated = (1 - self.damping) * risk[node] + self.damping * neighbour_avg
                new_risk[node] = min(updated, 1.0)

                max_delta = max(max_delta, abs(new_risk[node] - risk[node]))

            risk = new_risk
            self.iterations_run = iteration

            if max_delta < self.epsilon:
                break

        self.risk_scores = risk
        return risk

    # ------------------------------------------------------------------
    # Entity-level aggregation
    # ------------------------------------------------------------------

    def get_entity_risks(self, graph: nx.DiGraph) -> Dict[str, Dict[str, float]]:
        """Groups and averages risk scores by entity type.

        Returns:
            {entity_type: {entity_id: avg_risk}}
        """
        entity_risks: Dict[str, Dict[str, float]] = {}
        for node, attrs in graph.nodes(data=True):
            t = attrs.get("type", "Unknown")
            entity_risks.setdefault(t, {})[node] = self.risk_scores.get(node, 0.0)
        return entity_risks

    def get_community_risks(self, community_map: Dict[str, int]) -> Dict[int, float]:
        """Averages entity risk within each community.

        Args:
            community_map: node_id -> community_id.

        Returns:
            {community_id: average_risk}
        """
        community_totals: Dict[int, List[float]] = {}
        for node, cid in community_map.items():
            community_totals.setdefault(cid, []).append(self.risk_scores.get(node, 0.0))

        return {
            cid: round(sum(vals) / len(vals), 4)
            for cid, vals in community_totals.items()
        }

    # ------------------------------------------------------------------
    # Entity Registry
    # ------------------------------------------------------------------

    def build_entity_registry(
        self,
        graph: nx.DiGraph,
        community_map: Dict[str, int],
    ) -> List[Dict]:
        """Builds the Entity Registry: one row per non-Transaction node.

        Returns:
            List of dicts with entity_id, entity_type, degree, community_id,
            risk_score, risk_tier.
        """
        G_undirected = graph.to_undirected()
        registry: List[Dict] = []

        for node, attrs in graph.nodes(data=True):
            node_type = attrs.get("type", "Unknown")
            if node_type == "Transaction":
                continue

            risk = self.risk_scores.get(node, 0.0)
            tier = "Low"
            for threshold, label in self.RISK_TIERS:
                if risk >= threshold:
                    tier = label
                    break

            registry.append(
                {
                    "entity_id": node,
                    "entity_type": node_type,
                    "degree": G_undirected.degree(node),
                    "community_id": community_map.get(node, -1),
                    "risk_score": round(risk, 4),
                    "risk_tier": tier,
                }
            )

        return registry
