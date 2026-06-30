"""
Sentinel AI — Experiment Registry

Tracks model experiments across different graph learning strategies.
Generates the enterprise-grade experiment_registry.csv and leaderboard.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List
import pandas as pd


class ExperimentRegistry:
    """Enterprise experiment tracker for Graph Learning."""

    def __init__(self, output_dir: str = "reports/phase_08"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.records: List[Dict] = []

    def log_experiment(
        self,
        experiment_id: str,
        model_type: str,
        graph_version: str,
        dataset_hash: str,
        metrics: Dict[str, float],
        training_time: float,
        inference_time: float,
        memory_mb: float,
        n_features: int,
    ) -> None:
        """Logs a single experiment run."""
        record = {
            "Experiment ID": experiment_id,
            "Timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "Model Type": model_type,
            "Graph Version": graph_version,
            "Dataset Hash": dataset_hash,
            "Features": n_features,
            "PR-AUC": metrics.get("pr_auc", 0.0),
            "F1-Score": metrics.get("f1", 0.0),
            "Recall": metrics.get("recall", 0.0),
            "Precision": metrics.get("precision", 0.0),
            "Expected Calibration Error": metrics.get("ece", 0.0),
            "Training Time (s)": round(training_time, 3),
            "Inference Time (ms)": round(inference_time * 1000, 3),
            "Memory (MB)": round(memory_mb, 2),
        }
        self.records.append(record)

    def export(self) -> pd.DataFrame:
        """Exports the registry to CSV and returns the DataFrame."""
        df = pd.DataFrame(self.records)
        if not df.empty:
            # Sort by PR-AUC (Leaderboard format)
            df = df.sort_values(by="PR-AUC", ascending=False).reset_index(drop=True)
            df.to_csv(self.output_dir / "experiment_registry.csv", index=False)

            # Save Leaderboard
            leaderboard = df[
                [
                    "Experiment ID",
                    "Model Type",
                    "PR-AUC",
                    "F1-Score",
                    "Inference Time (ms)",
                ]
            ]
            leaderboard.to_csv(self.output_dir / "leaderboard.csv", index=False)

        return df
