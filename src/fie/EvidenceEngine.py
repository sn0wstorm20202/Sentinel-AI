import numpy as np
from typing import List, Dict, Any
from ..models.evidence import Evidence


class EvidenceEngine:
    """
    Converts mathematical ML outputs (SHAP) into structured, purely statistical evidence.
    Contains no business logic or linguistic assumptions.
    """

    def extract_evidence(
        self, shap_values: np.ndarray, feature_names: List[str], top_n: int = 5
    ) -> List[Evidence]:
        """
        Extracts the top N driving features from a local SHAP tensor.
        """
        if len(shap_values.shape) > 1:
            vals = shap_values[0]
        else:
            vals = shap_values

        top_indices = np.argsort(-np.abs(vals))[:top_n]

        evidence_list = []
        rank = 1
        for idx in top_indices:
            importance = float(vals[idx])
            direction = "positive" if importance > 0 else "negative"

            # Simulated confidence metric based on relative magnitude vs total magnitude
            total_abs = np.sum(np.abs(vals))
            confidence = round(
                abs(importance) / (total_abs + 1e-9) * 2.0, 4
            )  # normalized relative weight
            confidence = min(confidence, 0.99)  # Cap at 0.99

            e = Evidence(
                feature_id=feature_names[idx],
                importance_score=round(abs(importance), 4),
                direction=direction,
                rank=rank,
                confidence=confidence,
            )
            evidence_list.append(e)
            rank += 1

        return evidence_list
