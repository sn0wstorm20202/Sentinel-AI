"""
Sentinel AI — Embedding Drift Engine

Tracks semantic shifts in graph embeddings by computing the cosine distance
between the reference centroid and the production centroid.
"""

import numpy as np
import pandas as pd
from scipy.spatial.distance import cosine


class EmbeddingDriftEngine:
    """Detects drift in structural graph embeddings."""

    def detect_drift(self, df_ref_emb: pd.DataFrame, df_prod_emb: pd.DataFrame) -> dict:
        """
        Calculates cosine shift of embedding centroids and change in variance.
        """
        ref_matrix = df_ref_emb.select_dtypes(include=[np.number]).values
        prod_matrix = df_prod_emb.select_dtypes(include=[np.number]).values

        if len(ref_matrix) == 0 or len(prod_matrix) == 0:
            return {"cosine_shift": 0.0, "variance_change": 0.0}

        ref_centroid = np.mean(ref_matrix, axis=0)
        prod_centroid = np.mean(prod_matrix, axis=0)

        # Avoid zero vectors
        if np.all(ref_centroid == 0) or np.all(prod_centroid == 0):
            shift = 0.0
        else:
            shift = cosine(ref_centroid, prod_centroid)

        ref_var = np.mean(np.var(ref_matrix, axis=0))
        prod_var = np.mean(np.var(prod_matrix, axis=0))
        var_change = (prod_var - ref_var) / max(ref_var, 1e-6)

        return {
            "cosine_shift": round(float(shift), 4),
            "variance_change_pct": round(float(var_change) * 100, 2),
        }
