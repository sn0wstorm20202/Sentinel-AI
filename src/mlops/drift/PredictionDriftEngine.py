"""
Sentinel AI — Prediction Drift Engine

Monitors output stability: Fraud rate, Risk Tier distributions,
and Average predicted probabilities.
"""

import pandas as pd
from typing import Dict


class PredictionDriftEngine:
    """Detects shifts in the model's output distribution."""

    def detect_drift(
        self, prod_predictions: pd.Series, ref_predictions: pd.Series
    ) -> Dict[str, float]:
        """Compares production prediction statistics to reference."""

        prod_fraud_rate = (prod_predictions >= 0.5).mean()
        ref_fraud_rate = (ref_predictions >= 0.5).mean()

        prod_avg_prob = prod_predictions.mean()
        ref_avg_prob = ref_predictions.mean()

        rate_shift = prod_fraud_rate - ref_fraud_rate
        prob_shift = prod_avg_prob - ref_avg_prob

        return {
            "reference_fraud_rate": round(ref_fraud_rate, 4),
            "production_fraud_rate": round(prod_fraud_rate, 4),
            "fraud_rate_shift_pct": round(rate_shift * 100, 2),
            "reference_avg_prob": round(ref_avg_prob, 4),
            "production_avg_prob": round(prod_avg_prob, 4),
            "prob_shift_pct": round(prob_shift * 100, 2),
        }
