"""
Sentinel AI — MLOps Orchestrator

Coordinates the full Phase 9 monitoring pipeline:
Loads ref/prod data, computes all drifts, generates alerts,
and advises on retraining.
"""

import json
from pathlib import Path
import pandas as pd

from .drift.DataDriftEngine import DataDriftEngine
from .drift.FeatureDriftEngine import FeatureDriftEngine
from .drift.PredictionDriftEngine import PredictionDriftEngine
from .drift.ConceptDriftEngine import ConceptDriftEngine
from .drift.EmbeddingDriftEngine import EmbeddingDriftEngine
from .alerting.AlertEngine import AlertEngine
from .retraining.RetrainingEngine import RetrainingEngine
from .shadow.ShadowDeploymentEngine import ShadowDeploymentEngine
import logging

logger = logging.getLogger(__name__)


class MLOpsOrchestrator:
    """Executes the enterprise MLOps drift and monitoring pipeline."""

    def __init__(self, output_dir: str = "reports/phase_09"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.feature_drift = FeatureDriftEngine()
        self.pred_drift = PredictionDriftEngine()
        self.concept_drift = ConceptDriftEngine()
        self.emb_drift = EmbeddingDriftEngine()
        self.alert_engine = AlertEngine(output_dir)
        self.retraining = RetrainingEngine()
        self.shadow = ShadowDeploymentEngine()

    def run_daily_monitoring(
        self,
        df_ref: pd.DataFrame,
        df_prod: pd.DataFrame,
        top_features: list,
        target_col: str,
        pred_col: str,
    ) -> None:
        """Runs all drift checks and generates alerts/reports."""
        logger.info("Running daily MLOps monitoring pipeline...")

        # 1. Feature Drift
        logger.info("- Checking Feature Drift (PSI)...")
        psi_df = self.feature_drift.detect_drift(df_ref, df_prod, top_features)
        psi_df.to_csv(self.output_dir / "psi_report.csv", index=False)

        # Alert on top features
        for _, row in psi_df.iterrows():
            self.alert_engine.evaluate_psi(row["PSI"], row["Feature"])

        # 2. Prediction Drift
        logger.info("- Checking Prediction Drift...")
        pred_report = self.pred_drift.detect_drift(df_prod[pred_col], df_ref[pred_col])
        pd.DataFrame([pred_report]).to_csv(
            self.output_dir / "prediction_drift.csv", index=False
        )

        # 3. Concept Drift (Requires Ground Truth)
        if target_col in df_prod.columns:
            logger.info("- Checking Concept Drift (requires settled ground truth)...")
            concept_report = self.concept_drift.detect_drift(
                df_ref[target_col],
                df_ref[pred_col],
                df_prod[target_col],
                df_prod[pred_col],
            )
            pd.DataFrame([concept_report]).to_csv(
                self.output_dir / "concept_drift.csv", index=False
            )
            self.alert_engine.evaluate_concept_drift(
                concept_report["prauc_degradation"]
            )

        # 4. Embedding Drift (If embeddings exist in the data)
        emb_cols = [
            c for c in df_ref.columns if c.startswith("emb_") or c.startswith("dw_")
        ]
        if emb_cols:
            logger.info("- Checking Embedding Drift...")
            emb_report = self.emb_drift.detect_drift(
                df_ref[emb_cols], df_prod[emb_cols]
            )
            with open(self.output_dir / "embedding_drift.json", "w") as f:
                json.dump(emb_report, f, indent=2)

        # 5. Alerting & Retraining
        logger.info("- Generating Alerts & Retraining Recommendations...")
        self.alert_engine.export()
        retrain_rec = self.retraining.evaluate_retraining_need(self.alert_engine.alerts)

        with open(self.output_dir / "retraining_recommendation.json", "w") as f:
            json.dump(retrain_rec, f, indent=2)

        logger.info(f"Pipeline complete. Status: {retrain_rec['recommendation']}")

    def run_shadow_deployment(self, y_true, y_champ, y_chall):
        logger.info("Running Shadow Deployment evaluation...")
        df_shadow = self.shadow.evaluate(y_true, y_champ, y_chall)
        df_shadow.to_csv(self.output_dir / "shadow_comparison.csv", index=False)
        return df_shadow
