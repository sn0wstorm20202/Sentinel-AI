"""
Sentinel AI — Node2Vec-Lite Embedding Engine

Generates node embeddings using a deterministic approximation of the Node2Vec algorithm:
biased random walks on the graph followed by matrix factorization (SVD).

NOTE: This is NOT canonical Node2Vec (which uses Skip-Gram with Negative Sampling).
This 'Lite' version uses sklearn's TruncatedSVD as a lightweight, zero-dependency
alternative when Gensim/PyG is unavailable. It produces identical, deterministic
embeddings on every run, which is highly desirable for reproducibility audits.
"""

import hashlib
import json
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import networkx as nx
import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import normalize


class Node2VecLiteEngine:
    """Generates deterministic node embeddings via biased random walks + SVD approximation."""

    def __init__(
        self,
        dimensions: int = 64,
        walk_length: int = 30,
        num_walks: int = 10,
        p: float = 1.0,
        q: float = 1.0,
        seed: int = 42,
    ):
        """
        Args:
            dimensions: Embedding vector dimensionality.
            walk_length: Length of each random walk.
            num_walks: Number of walks per node.
            p: Return parameter (controls revisiting nodes).
            q: In-out parameter (controls search breadth vs depth).
            seed: Random seed for reproducibility.
        """
        self.dimensions = dimensions
        self.walk_length = walk_length
        self.num_walks = num_walks
        self.p = p
        self.q = q
        self.seed = seed

        self.embeddings: Optional[np.ndarray] = None
        self.node_list: Optional[List[str]] = None
        self._metadata: Dict = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fit(self, graph: nx.DiGraph) -> np.ndarray:
        """Generates embeddings for all nodes in the graph.

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

        # Step 1: Generate biased random walks
        walks = self._generate_walks(G, rng)

        # Step 2: Build co-occurrence matrix from walks
        cooccurrence = self._build_cooccurrence(walks, node_to_idx, window=5)

        # Step 3: Matrix factorisation (SVD) to produce embeddings
        n_components = min(self.dimensions, cooccurrence.shape[0] - 1)
        svd = TruncatedSVD(n_components=n_components, random_state=self.seed)
        embeddings = svd.fit_transform(cooccurrence)
        embeddings = normalize(embeddings, norm="l2")

        # Pad if n_components < dimensions
        if embeddings.shape[1] < self.dimensions:
            pad = np.zeros((embeddings.shape[0], self.dimensions - embeddings.shape[1]))
            embeddings = np.hstack([embeddings, pad])

        self.embeddings = embeddings
        elapsed = round(time.time() - start, 3)

        self._metadata = {
            "engine": "Node2VecLiteEngine",
            "type": "Deterministic Approximation (SVD)",
            "dimensions": self.dimensions,
            "walk_length": self.walk_length,
            "num_walks": self.num_walks,
            "p": self.p,
            "q": self.q,
            "seed": self.seed,
            "total_nodes": len(self.node_list),
            "total_walks": len(walks),
            "training_time_seconds": elapsed,
            "variance_explained": round(float(svd.explained_variance_ratio_.sum()), 4),
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }

        return embeddings

    def get_embedding(self, node_id: str) -> Optional[np.ndarray]:
        """Returns the embedding vector for a single node."""
        if self.node_list is None or self.embeddings is None:
            return None
        try:
            idx = self.node_list.index(node_id)
            return self.embeddings[idx]
        except ValueError:
            return None

    def to_dataframe(self) -> pd.DataFrame:
        """Returns embeddings as a DataFrame with node_id as the first column."""
        cols = [f"emb_{i}" for i in range(self.embeddings.shape[1])]
        df = pd.DataFrame(self.embeddings, columns=cols)
        df.insert(0, "node_id", self.node_list)
        return df

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def save(self, output_dir: str) -> None:
        """Saves embeddings as Parquet + numpy, and metadata as JSON."""
        path = Path(output_dir)
        path.mkdir(parents=True, exist_ok=True)

        self.to_dataframe().to_parquet(path / "embeddings.parquet", index=False)
        np.save(path / "embeddings.npy", self.embeddings)

        with open(path / "embedding_metadata.json", "w") as f:
            json.dump(self._metadata, f, indent=2)

    # ------------------------------------------------------------------
    # Internal: Random Walk Generation
    # ------------------------------------------------------------------

    def _generate_walks(
        self, G: nx.Graph, rng: np.random.RandomState
    ) -> List[List[str]]:
        """Generates biased random walks from every node."""
        nodes = list(G.nodes())
        walks = []

        for _ in range(self.num_walks):
            rng.shuffle(nodes)
            for start_node in nodes:
                walk = self._single_walk(G, start_node, rng)
                walks.append(walk)

        return walks

    def _single_walk(
        self, G: nx.Graph, start: str, rng: np.random.RandomState
    ) -> List[str]:
        """Performs one biased random walk of length walk_length."""
        walk = [start]

        for step in range(self.walk_length - 1):
            cur = walk[-1]
            neighbors = list(G.neighbors(cur))
            if not neighbors:
                break

            if len(walk) < 2:
                walk.append(neighbors[rng.randint(len(neighbors))])
            else:
                prev = walk[-2]
                probs = []
                for nbr in neighbors:
                    if nbr == prev:
                        probs.append(1.0 / self.p)
                    elif G.has_edge(nbr, prev):
                        probs.append(1.0)
                    else:
                        probs.append(1.0 / self.q)

                probs = np.array(probs)
                probs /= probs.sum()
                walk.append(neighbors[rng.choice(len(neighbors), p=probs)])

        return walk

    # ------------------------------------------------------------------
    # Internal: Co-occurrence Matrix
    # ------------------------------------------------------------------

    def _build_cooccurrence(
        self, walks: List[List[str]], node_to_idx: Dict[str, int], window: int = 5
    ) -> np.ndarray:
        """Builds a node co-occurrence matrix from random walks."""
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

        # Apply PPMI (Positive Pointwise Mutual Information)
        matrix = matrix.tocsr()
        matrix.data = np.log1p(matrix.data)

        return matrix
