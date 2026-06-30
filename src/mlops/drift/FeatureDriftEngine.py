"""
Sentinel AI — Feature Drift Engine

Monitors drift specifically on the Top 50 approved features,
which is computationally much cheaper than scanning 600+ columns daily.
"""

from typing import Dict, List
import pandas as pd
from .DataDriftEngine import DataDriftEngine


class FeatureDriftEngine:
    """Monitors drift specifically on highly important features."""

    def __init__(self):
        self.data_drift_engine = DataDriftEngine()

    def detect_drift(
        self,
        df_reference: pd.DataFrame,
        df_production: pd.DataFrame,
        top_features: List[str],
    ) -> pd.DataFrame:
        """Calculates PSI only for the most important features."""
        psi_report = self.data_drift_engine.detect_drift(
            df_reference, df_production, top_features
        )

        df = pd.DataFrame(list(psi_report.items()), columns=["Feature", "PSI"])
        df = df.sort_values(by="PSI", ascending=False).reset_index(drop=True)
        return df
