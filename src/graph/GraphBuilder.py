"""
Sentinel AI — Deterministic Synthetic Graph Builder

Constructs a realistic banking entity-relationship graph from anonymized
transaction data. Uses SHA-256 hashing to deterministically map each
transaction index to synthetic Customer, Device, IP, and Merchant IDs.

The same input always produces the exact same graph. No randomness is used.
"""

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import networkx as nx
import numpy as np
import pandas as pd


class GraphBuilder:
    """Builds a deterministic synthetic knowledge graph from transaction data.

    Every transaction index is hashed to produce stable entity IDs.
    Entity counts are controlled via modular arithmetic over configurable
    pool sizes so that entities are realistically shared across transactions.
    """

    DEFAULT_POOLS = {
        "customers": 5000,
        "devices": 2000,
        "merchants": 500,
        "ips": 300,
    }

    def __init__(
        self, pool_sizes: Optional[Dict[str, int]] = None, seed: str = "sentinel_ai"
    ):
        """
        Args:
            pool_sizes: Dict overriding the default entity pool sizes.
            seed: A static seed string mixed into every hash for reproducibility.
        """
        self.pools = {**self.DEFAULT_POOLS, **(pool_sizes or {})}
        self.seed = seed
        self.graph: Optional[nx.DiGraph] = None
        self._build_timestamp: Optional[str] = None

    # ------------------------------------------------------------------
    # Deterministic hashing helpers
    # ------------------------------------------------------------------

    def _hash_entity(self, txn_index: int, entity_type: str) -> int:
        """Returns a deterministic integer derived from the transaction index
        and entity type, suitable for modular mapping into entity pools."""
        raw = f"{self.seed}:{entity_type}:{txn_index}"
        digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        return int(digest, 16)

    def _map_entity(self, txn_index: int, entity_type: str, pool_size: int) -> str:
        """Maps a transaction index to a specific entity ID deterministically."""
        h = self._hash_entity(txn_index, entity_type)
        entity_num = h % pool_size
        prefix = entity_type.upper()[:3]
        return f"{prefix}_{entity_num:05d}"

    # ------------------------------------------------------------------
    # Graph construction
    # ------------------------------------------------------------------

    def build(self, df: pd.DataFrame, fraud_labels: pd.Series) -> nx.DiGraph:
        """Constructs the full knowledge graph.

        Args:
            df: Feature DataFrame (one row per transaction).
            fraud_labels: Binary Series aligned with df (1 = fraud, 0 = legit).

        Returns:
            A directed NetworkX graph with typed nodes and edges.
        """
        import time

        start_time = time.time()
        self._build_timestamp = datetime.now(timezone.utc).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        )

        # Compute dataset hash for reproducibility audit
        raw_bytes = pd.util.hash_pandas_object(df).values.tobytes()
        raw_bytes += pd.util.hash_pandas_object(fraud_labels).values.tobytes()
        self._dataset_hash = hashlib.sha256(raw_bytes).hexdigest()[:16]

        G = nx.DiGraph()

        for idx in range(len(df)):
            txn_id = f"TXN_{idx:06d}"
            cust_id = self._map_entity(idx, "customer", self.pools["customers"])
            dev_id = self._map_entity(idx, "device", self.pools["devices"])
            ip_id = self._map_entity(idx, "ip", self.pools["ips"])
            merch_id = self._map_entity(idx, "merchant", self.pools["merchants"])

            is_fraud = int(fraud_labels.iloc[idx])

            # --- Nodes ---
            G.add_node(txn_id, type="Transaction", fraud=is_fraud)
            G.add_node(cust_id, type="Customer")
            G.add_node(dev_id, type="Device")
            G.add_node(ip_id, type="IP_Address")
            G.add_node(merch_id, type="Merchant")

            # --- Edges ---
            G.add_edge(cust_id, txn_id, relationship="INITIATED")
            G.add_edge(txn_id, merch_id, relationship="SENT_TO")
            G.add_edge(txn_id, dev_id, relationship="EXECUTED_ON")
            G.add_edge(dev_id, ip_id, relationship="CONNECTED_VIA")

        self.graph = G
        self._build_time_seconds = round(time.time() - start_time, 3)
        return G

    # ------------------------------------------------------------------
    # Metadata
    # ------------------------------------------------------------------

    def get_metadata(self) -> Dict:
        """Returns a metadata dict describing the built graph."""
        if self.graph is None:
            raise ValueError("Graph has not been built yet. Call build() first.")

        G = self.graph
        node_types: Dict[str, int] = {}
        for _, attrs in G.nodes(data=True):
            t = attrs.get("type", "Unknown")
            node_types[t] = node_types.get(t, 0) + 1

        edge_types: Dict[str, int] = {}
        for _, _, attrs in G.edges(data=True):
            r = attrs.get("relationship", "Unknown")
            edge_types[r] = edge_types.get(r, 0) + 1

        return {
            "graph_version": "1.0",
            "builder_version": "DeterministicSyntheticBuilder v1.0",
            "build_strategy": "SHA-256 deterministic hashing with modular entity pools",
            "seed": self.seed,
            "dataset_hash": getattr(self, "_dataset_hash", "N/A"),
            "build_timestamp": self._build_timestamp,
            "execution_time_seconds": getattr(self, "_build_time_seconds", None),
            "total_nodes": G.number_of_nodes(),
            "total_edges": G.number_of_edges(),
            "node_type_counts": node_types,
            "edge_type_counts": edge_types,
            "pool_sizes": self.pools,
        }

    def save_metadata(self, output_dir: str) -> None:
        """Persists the graph metadata as JSON."""
        path = Path(output_dir)
        path.mkdir(parents=True, exist_ok=True)
        with open(path / "graph_metadata.json", "w") as f:
            json.dump(self.get_metadata(), f, indent=2)
