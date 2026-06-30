import os
import json
import pickle
import numpy as np
import pandas as pd
import shap
from pathlib import Path
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class FraudDecisionEngine:
    def __init__(self, models_dir="models", configs_dir="configs"):
        self.models_dir = Path(models_dir)
        self.configs_dir = Path(configs_dir)

        # Load Model Pipeline
        self._load_pipeline()

    def _load_pipeline(self):
        # Load Calibrated Classifier
        with open(self.models_dir / "champion_model_calibrated.pkl", "rb") as f:
            self.model = pickle.load(f)

        # Load SHAP Explainer
        with open(self.models_dir / "shap_explainer.pkl", "rb") as f:
            self.explainer = pickle.load(f)

        # Load Business Threshold Policy
        with open(self.configs_dir / "threshold_policy.json", "r") as f:
            policy = json.load(f)
            self.optimal_threshold = policy["optimal_threshold"]

    def _assign_risk_tier(self, probability):
        if probability >= 0.90:
            return (
                "Critical",
                "Freeze Account & Investigate Immediately",
                "Level 2",
                "Pending Review",
            )
        elif probability >= self.optimal_threshold:
            return (
                "High",
                "Suspend Transaction & Manual Review",
                "Level 1",
                "Pending Review",
            )
        elif probability >= self.optimal_threshold * 0.5:
            return "Elevated", "Monitor for Future Anomalies", "None", "Auto-Approved"
        else:
            return "Approve", "Process Transaction", "None", "Auto-Approved"

    def predict(
        self, transaction_data: dict, transaction_id: str, case_id: str
    ) -> dict:
        """
        Process a single transaction through the Fraud Decision Engine.
        """
        df = pd.DataFrame([transaction_data])

        # 1. Probability Calibration
        probability = self.model.predict_proba(df)[0, 1]

        # 2. Threshold Policy & Risk Tiering
        tier, recommendation, escalation, review_status = self._assign_risk_tier(
            probability
        )
        confidence = (
            "High"
            if probability > 0.9 or probability < (self.optimal_threshold * 0.1)
            else "Standard"
        )

        # 3. SHAP Explainability (Natural Language Generation)
        natural_explanation = "N/A"
        if review_status == "Pending Review":
            sv = self.explainer.shap_values(df)
            if isinstance(sv, list):
                sv = sv[1]
            elif len(np.array(sv).shape) == 3:
                sv = sv[:, :, 1]
            vals = sv[0]
            top_indices = np.argsort(-np.abs(vals))[:5]

            # Format as natural language
            features = [df.columns[t_idx] for t_idx in top_indices if vals[t_idx] > 0]
            if len(features) > 0:
                natural_explanation = f"Main reasons: • {' • '.join(features)}"
            else:
                natural_explanation = "No strong positive contributors."

        # 4. Construct Business JSON Output
        response = {
            "Case_ID": case_id,
            "Transaction_ID": transaction_id,
            "Fraud_Probability": round(probability, 4),
            "Risk_Score": round(probability * 100, 1),
            "Risk_Tier": tier,
            "Confidence": confidence,
            "Decision": "Freeze" if tier in ["Critical", "High"] else "Allow",
            "Escalation_Level": escalation,
            "Review_Status": review_status,
            "Business_Recommendation": recommendation,
            "Natural_Language_Explanation": natural_explanation,
            "Timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "Engine_Version": "3.0",
        }

        return response


if __name__ == "__main__":
    # Example Usage mock
    engine = FraudDecisionEngine(models_dir="../../models", configs_dir="../../configs")
    logger.info("Fraud Decision Engine v3 Initialized.")
