"""
Sentinel AI — Feature Fusion Engine

Responsible for cleanly projecting, aligning, and concatenating
disparate feature spaces (Tabular, Graph Topology, Embeddings)
into a unified representation for Classical Graph ML and GNNs.
"""

from typing import List, Optional
import pandas as pd


class FeatureFusionEngine:
    """Fuses tabular, graph, and embedding features into a unified dataset."""

    def __init__(self):
        self.feature_manifest = []

    def fuse(
        self,
        df_tabular: pd.DataFrame,
        df_graph: Optional[pd.DataFrame] = None,
        df_embeddings: Optional[pd.DataFrame] = None,
        align_on: str = "index",
    ) -> pd.DataFrame:
        """
        Fuses the provided DataFrames.

        Args:
            df_tabular: The baseline tabular dataset (Phase 5).
            df_graph: Graph topological features (Phase 7).
            df_embeddings: Node embeddings (Node2Vec/DeepWalk).
            align_on: How to align the datasets ('index' or a specific column).

        Returns:
            A unified pandas DataFrame.
        """
        self.feature_manifest = []

        # 1. Base Tabular
        df_fused = df_tabular.copy()
        self.feature_manifest.append({"space": "tabular", "count": df_fused.shape[1]})

        # 2. Graph Topology Projection
        if df_graph is not None:
            if "node_type" in df_graph.columns:
                txn_graph = df_graph[df_graph["node_type"] == "Transaction"].copy()
                txn_graph = txn_graph.drop(columns=["node_type"])
            else:
                txn_graph = df_graph.copy()

            if "node_id" in txn_graph.columns:
                txn_graph = txn_graph.drop(columns=["node_id"])

            txn_graph = txn_graph.reset_index(drop=True)
            df_fused = pd.concat([df_fused, txn_graph], axis=1)
            self.feature_manifest.append(
                {"space": "topology", "count": txn_graph.shape[1]}
            )

        # 3. Embeddings Projection
        if df_embeddings is not None:
            # Assume embeddings have 'node_id' like 'TXN_xxx'
            if "node_id" in df_embeddings.columns:
                txn_emb = df_embeddings[
                    df_embeddings["node_id"].str.startswith("TXN_", na=False)
                ].copy()
                txn_emb = txn_emb.drop(columns=["node_id"])
            else:
                txn_emb = df_embeddings.copy()

            txn_emb = txn_emb.reset_index(drop=True)
            df_fused = pd.concat([df_fused, txn_emb], axis=1)
            self.feature_manifest.append(
                {"space": "embeddings", "count": txn_emb.shape[1]}
            )

        return df_fused

    def get_manifest(self) -> List[dict]:
        """Returns metadata about the fused feature space."""
        return self.feature_manifest
