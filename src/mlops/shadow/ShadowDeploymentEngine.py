"""
Sentinel AI — Shadow Deployment Engine

Runs a challenger model silently alongside the champion model to evaluate
performance before promotion.
"""

import pandas as pd
from typing import Dict


class ShadowDeploymentEngine:
    """Evaluates Champion vs Challenger in a silent deployment scenario."""

    def evaluate(
        self,
        y_true: pd.Series,
        y_champion_pred: pd.Series,
        y_challenger_pred: pd.Series,
    ) -> pd.DataFrame:
        """Compares performance and computes business impact."""
        from sklearn.metrics import average_precision_score, f1_score

        try:
            champ_pr = average_precision_score(y_true, y_champion_pred)
            chall_pr = average_precision_score(y_true, y_challenger_pred)

            champ_f1 = f1_score(y_true, (y_champion_pred >= 0.5).astype(int))
            chall_f1 = f1_score(y_true, (y_challenger_pred >= 0.5).astype(int))
        except ValueError:
            champ_pr, chall_pr, champ_f1, chall_f1 = 0.0, 0.0, 0.0, 0.0

        results = [
            {
                "Model": "Champion",
                "PR-AUC": round(champ_pr, 4),
                "F1": round(champ_f1, 4),
            },
            {
                "Model": "Challenger",
                "PR-AUC": round(chall_pr, 4),
                "F1": round(chall_f1, 4),
            },
        ]

        df = pd.DataFrame(results)
        return df
