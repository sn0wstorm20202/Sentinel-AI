"""
Sentinel AI — Graph Learning Model Evaluator

Aggregates, compares, and ranks the performance of tabular,
embedding-based, and GNN models to answer the core scientific
question: "Does graph structure improve fraud detection?"
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

import pandas as pd


class ModelEvaluator:
    """Evaluates and compares different graph learning strategies."""

    def __init__(self):
        self.experiments: List[Dict] = []

    def add_experiment(self, results: Dict) -> None:
        """Adds a completed experiment result to the evaluator."""
        self.experiments.append(results)

    def compare(self) -> pd.DataFrame:
        """Generates a comparison DataFrame of all added experiments.

        Returns:
            DataFrame sorted by PR-AUC (descending).
        """
        rows = []
        for exp in self.experiments:
            metrics = exp.get("metrics", {})
            rows.append(
                {
                    "Experiment": exp.get("experiment_name", "Unknown"),
                    "Model": exp.get("model_type", "Unknown"),
                    "PR-AUC": metrics.get("pr_auc", 0.0),
                    "ROC-AUC": metrics.get("roc_auc", 0.0),
                    "F1-Score": metrics.get("f1", 0.0),
                    "Training Time (s)": exp.get("training_time_seconds", 0.0),
                    "Features": exp.get("n_features", 0),
                }
            )

        df = pd.DataFrame(rows)
        if not df.empty:
            df = df.sort_values(by="PR-AUC", ascending=False).reset_index(drop=True)
        return df

    def save_comparison(self, output_dir: str) -> None:
        """Saves the evaluation results to CSV and JSON."""
        path = Path(output_dir)
        path.mkdir(parents=True, exist_ok=True)

        df = self.compare()
        df.to_csv(path / "graph_model_comparison.csv", index=False)

        report = {
            "evaluation_timestamp": datetime.now(timezone.utc).strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            ),
            "total_experiments": len(self.experiments),
            "winner": df.iloc[0]["Experiment"] if not df.empty else None,
            "best_pr_auc": df.iloc[0]["PR-AUC"] if not df.empty else 0.0,
            "experiments": self.experiments,
        }

        with open(path / "graph_evaluation_report.json", "w") as f:
            json.dump(report, f, indent=2)
