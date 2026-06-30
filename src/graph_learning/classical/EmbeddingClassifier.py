"""
Sentinel AI — Embedding Classifier (Classical Graph ML)

Trains traditional ML classifiers (XGBoost, LightGBM, RandomForest)
on the fusion of graph-derived features and node embeddings.

This module answers the central scientific question of Phase 8:

    "Do graph embeddings improve fraud detection over Phase 5 tabular?"

By training classical models on:
    1. Tabular features only (Phase 5 baseline)
    2. Graph features only (Phase 7 feature store)
    3. Node embeddings only (Node2Vec / DeepWalk)
    4. Tabular + Graph + Embeddings (Full Fusion)

We can isolate exactly where graph intelligence adds value.
"""

import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    average_precision_score,
    balanced_accuracy_score,
    brier_score_loss,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold


class EmbeddingClassifier:
    """Trains classical ML models on graph-enriched feature sets."""

    SUPPORTED_MODELS = ["xgboost", "lightgbm", "random_forest"]

    def __init__(self, model_type: str = "xgboost", random_state: int = 42):
        """
        Args:
            model_type: One of 'xgboost', 'lightgbm', 'random_forest'.
            random_state: Seed for reproducibility.
        """
        if model_type not in self.SUPPORTED_MODELS:
            raise ValueError(
                f"Unsupported model: {model_type}. Choose from {self.SUPPORTED_MODELS}"
            )

        self.model_type = model_type
        self.random_state = random_state
        self.model: Any = None
        self.results: Dict = {}

    def _create_model(self, scale_pos_weight: float = 1.0) -> Any:
        """Instantiates the underlying classifier."""
        if self.model_type == "xgboost":
            import xgboost as xgb

            return xgb.XGBClassifier(
                n_estimators=300,
                max_depth=6,
                learning_rate=0.05,
                scale_pos_weight=scale_pos_weight,
                eval_metric="aucpr",
                use_label_encoder=False,
                random_state=self.random_state,
                n_jobs=-1,
            )
        elif self.model_type == "lightgbm":
            import lightgbm as lgb

            return lgb.LGBMClassifier(
                n_estimators=300,
                max_depth=6,
                learning_rate=0.05,
                scale_pos_weight=scale_pos_weight,
                random_state=self.random_state,
                n_jobs=-1,
                verbose=-1,
            )
        else:
            return RandomForestClassifier(
                n_estimators=300,
                max_depth=10,
                class_weight="balanced",
                random_state=self.random_state,
                n_jobs=-1,
            )

    # ------------------------------------------------------------------
    # Training & Evaluation
    # ------------------------------------------------------------------

    def train_and_evaluate(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        experiment_name: str = "experiment",
        n_folds: int = 5,
    ) -> Dict:
        """Runs stratified k-fold cross-validation and reports metrics.

        Args:
            X: Feature matrix.
            y: Binary target.
            experiment_name: Label for this experiment run.
            n_folds: Number of CV folds.

        Returns:
            Dict of aggregated metrics.
        """
        start = time.time()
        skf = StratifiedKFold(
            n_splits=n_folds, shuffle=True, random_state=self.random_state
        )

        scale_pos_weight = float((y == 0).sum() / max((y == 1).sum(), 1))
        fold_metrics: List[Dict[str, float]] = []

        for fold, (train_idx, val_idx) in enumerate(skf.split(X, y)):
            X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
            y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]

            model = self._create_model(scale_pos_weight)
            model.fit(X_train, y_train)

            y_proba = model.predict_proba(X_val)[:, 1]
            y_pred = (y_proba >= 0.5).astype(int)

            # Inference latency
            inf_start = time.time()
            model.predict_proba(X_val.iloc[:100])  # Sample of 100
            inference_time = (time.time() - inf_start) / min(100, len(X_val))

            # Expected Calibration Error (ECE) approximation
            from sklearn.calibration import calibration_curve

            prob_true, prob_pred = calibration_curve(y_val, y_proba, n_bins=10)
            ece = np.mean(np.abs(prob_true - prob_pred))

            fold_metrics.append(
                {
                    "fold": fold + 1,
                    "pr_auc": average_precision_score(y_val, y_proba),
                    "roc_auc": roc_auc_score(y_val, y_proba),
                    "recall": recall_score(y_val, y_pred, zero_division=0),
                    "precision": precision_score(y_val, y_pred, zero_division=0),
                    "f1": f1_score(y_val, y_pred, zero_division=0),
                    "balanced_accuracy": balanced_accuracy_score(y_val, y_pred),
                    "brier_score": brier_score_loss(y_val, y_proba),
                    "ece": ece,
                    "inference_time": inference_time,
                }
            )

        elapsed = round(time.time() - start, 3)

        # Aggregate
        metric_keys = [k for k in fold_metrics[0] if k != "fold"]
        avg_metrics = {
            k: round(np.mean([f[k] for f in fold_metrics]), 4) for k in metric_keys
        }
        std_metrics = {
            f"{k}_std": round(np.std([f[k] for f in fold_metrics]), 4)
            for k in metric_keys
        }

        # Train final model on full data for later use
        self.model = self._create_model(scale_pos_weight)
        self.model.fit(X, y)

        self.results = {
            "experiment_name": experiment_name,
            "model_type": self.model_type,
            "n_features": X.shape[1],
            "n_samples": X.shape[0],
            "n_folds": n_folds,
            "training_time_seconds": elapsed,
            "inference_time_seconds": avg_metrics.get("inference_time", 0.0),
            "memory_mb_estimate": float(
                X.memory_usage(deep=True).sum() / (1024 * 1024)
            ),
            "metrics": {**avg_metrics, **std_metrics},
            "fold_details": fold_metrics,
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }

        return self.results

    def save_results(self, output_dir: str) -> None:
        """Persists the experiment results as JSON."""
        path = Path(output_dir)
        path.mkdir(parents=True, exist_ok=True)
        name = self.results.get("experiment_name", "experiment")
        with open(path / f"{name}_results.json", "w") as f:
            json.dump(self.results, f, indent=2)
