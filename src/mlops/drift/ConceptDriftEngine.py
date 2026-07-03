"""
Sentinel AI — Concept Drift Engine

Tracks target distribution changes and ground-truth degradation (PR-AUC, F1).
"""

import pandas as pd
from sklearn.metrics import average_precision_score, f1_score
from typing import Dict


class ConceptDriftEngine:
    """Detects when the relationship between features and the target changes."""

    def detect_drift(
        self,
        y_ref_true: pd.Series,
        y_ref_pred: pd.Series,
        y_prod_true: pd.Series,
        y_prod_pred: pd.Series,
    ) -> Dict[str, float]:

        try:
            ref_pr = average_precision_score(y_ref_true, y_ref_pred)
            prod_pr = average_precision_score(y_prod_true, y_prod_pred)

            ref_f1 = f1_score(y_ref_true, (y_ref_pred >= 0.5).astype(int))
            prod_f1 = f1_score(y_prod_true, (y_prod_pred >= 0.5).astype(int))
        except ValueError:
            ref_pr, prod_pr, ref_f1, prod_f1 = 0.0, 0.0, 0.0, 0.0

        pr_drop = ref_pr - prod_pr
        f1_drop = ref_f1 - prod_f1

        return {
            "reference_prauc": round(ref_pr, 4),
            "production_prauc": round(prod_pr, 4),
            "prauc_degradation": round(pr_drop, 4),
            "reference_f1": round(ref_f1, 4),
            "production_f1": round(prod_f1, 4),
            "f1_degradation": round(f1_drop, 4),
        }
