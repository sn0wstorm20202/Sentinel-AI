"""
Sentinel AI — Data Drift Engine

Calculates Population Stability Index (PSI) between reference
and production datasets.
"""

import numpy as np
import pandas as pd
from typing import Dict


class DataDriftEngine:
    """Detects covariate shift using Population Stability Index (PSI)."""

    def calculate_psi(
        self, expected: pd.Series, actual: pd.Series, bins: int = 10
    ) -> float:
        """Calculates PSI between expected (reference) and actual (production) series."""

        # Handle constants / exact matches quickly
        if expected.equals(actual):
            return 0.0

        # Create decile bins based on expected
        expected_min = expected.min()
        expected_max = expected.max()

        # If no variance, avoid division by zero
        if expected_min == expected_max:
            return 0.0

        bins_arr = np.linspace(expected_min, expected_max, bins + 1)
        bins_arr[0] = -np.inf
        bins_arr[-1] = np.inf

        # Count frequencies
        expected_counts, _ = np.histogram(expected, bins=bins_arr)
        actual_counts, _ = np.histogram(actual, bins=bins_arr)

        # Convert to percentages (avoid zero with small epsilon)
        expected_pct = expected_counts / len(expected)
        actual_pct = actual_counts / len(actual)

        expected_pct = np.clip(expected_pct, 1e-4, None)
        actual_pct = np.clip(actual_pct, 1e-4, None)

        psi_values = (actual_pct - expected_pct) * np.log(actual_pct / expected_pct)
        return float(np.sum(psi_values))

    def detect_drift(
        self, df_reference: pd.DataFrame, df_production: pd.DataFrame, features: list
    ) -> Dict[str, float]:
        """Calculates PSI for all specified features."""
        psi_report = {}
        for feat in features:
            if feat in df_reference.columns and feat in df_production.columns:
                psi = self.calculate_psi(df_reference[feat], df_production[feat])
                psi_report[feat] = round(psi, 4)
        return psi_report
