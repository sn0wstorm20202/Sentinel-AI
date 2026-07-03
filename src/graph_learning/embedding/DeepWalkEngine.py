"""
Sentinel AI — DeepWalk Embedding Engine

Implements DeepWalk: uniform random walks + matrix factorisation.
DeepWalk is equivalent to Node2Vec with p=1, q=1 (unbiased walks).
We keep it as a separate module for scientific comparison.
"""

import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import networkx as nx
import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import normalize


class DeepWalkEngine:
    """Generates node embeddings via uniform random walks + SVD."""

    def __init__(
        self,
        dimensions: int = 64,
        walk_length: int = 40,
        num_walks: int = 10,
        seed: int = 42,
    ):
        self.dimensions = dimensions
        self.walk_length = walk_length
        self.num_walks = num_walks
        self.seed = seed

        self.embeddings: Optional[np.ndarray] = None
        self.node_list: Optional[List[str]] = None
        self._metadata: Dict = {}

    def fit(self, graph: nx.DiGraph) -> np.ndarray:
        """Generates DeepWalk embeddings for all nodes.

        Args:
            graph: The Sentinel knowledge graph.

        Returns:
            np.ndarray of shape (num_nodes, dimensions).
        """
        start = time.time()
        G = graph.to_undirected()
        self.node_list = list(G.nodes())
        node_to_idx = {n: i for i, n in enumerate(self.node_list)}
        rng = np.random.RandomState(self.seed)

        # Uniform random walks
        walks = self._generate_walks(G, rng)

        # Co-occurrence + SVD
        cooccurrence = self._build_cooccurrence(walks, node_to_idx, window=5)
        n_components = min(self.dimensions, cooccurrence.shape[0] - 1)
        svd = TruncatedSVD(n_components=n_components, random_state=self.seed)
        embeddings = svd.fit_transform(cooccurrence)
        embeddings = normalize(embeddings, norm="l2")

        if embeddings.shape[1] < self.dimensions:
            pad = np.zeros((embeddings.shape[0], self.dimensions - embeddings.shape[1]))
            embeddings = np.hstack([embeddings, pad])

        self.embeddings = embeddings
        elapsed = round(time.time() - start, 3)

        self._metadata = {
            "engine": "DeepWalkEngine",
            "dimensions": self.dimensions,
            "walk_length": self.walk_length,
            "num_walks": self.num_walks,
            "seed": self.seed,
            "total_nodes": len(self.node_list),
            "total_walks": len(walks),
            "training_time_seconds": elapsed,
            "variance_explained": round(float(svd.explained_variance_ratio_.sum()), 4),
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }

        return embeddings

    def to_dataframe(self) -> pd.DataFrame:
        """Returns embeddings as a DataFrame."""
        cols = [f"dw_emb_{i}" for i in range(self.embeddings.shape[1])]
        df = pd.DataFrame(self.embeddings, columns=cols)
        df.insert(0, "node_id", self.node_list)
        return df

    def save(self, output_dir: str) -> None:
        """Saves embeddings and metadata."""
        path = Path(output_dir)
        path.mkdir(parents=True, exist_ok=True)
        self.to_dataframe().to_parquet(
            path / "deepwalk_embeddings.parquet", index=False
        )
        np.save(path / "deepwalk_embeddings.npy", self.embeddings)
        with open(path / "deepwalk_metadata.json", "w") as f:
            json.dump(self._metadata, f, indent=2)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _generate_walks(
        self, G: nx.Graph, rng: np.random.RandomState
    ) -> List[List[str]]:
        nodes = list(G.nodes())
        walks = []
        for _ in range(self.num_walks):
            rng.shuffle(nodes)
            for start in nodes:
                walk = [start]
                for _ in range(self.walk_length - 1):
                    cur = walk[-1]
                    neighbors = list(G.neighbors(cur))
                    if not neighbors:
                        break
                    walk.append(neighbors[rng.randint(len(neighbors))])
                walks.append(walk)
        return walks

    def _build_cooccurrence(
        self, walks: List[List[str]], node_to_idx: Dict[str, int], window: int = 5
    ) -> np.ndarray:
        n = len(node_to_idx)
        from scipy.sparse import lil_matrix

        matrix = lil_matrix((n, n), dtype=np.float32)
        for walk in walks:
            for i, node in enumerate(walk):
                idx_i = node_to_idx[node]
                start = max(0, i - window)
                end = min(len(walk), i + window + 1)
                for j in range(start, end):
                    if i != j:
                        idx_j = node_to_idx[walk[j]]
                        matrix[idx_i, idx_j] += 1.0
        matrix = matrix.tocsr()
        matrix.data = np.log1p(matrix.data)
        return matrix
