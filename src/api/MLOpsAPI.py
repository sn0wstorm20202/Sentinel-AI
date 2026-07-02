import json
import pandas as pd
from pathlib import Path
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/mlops", tags=["MLOps"])
PHASE09_DIR = Path("reports/phase_09")

@router.get("/metrics")
def get_mlops_metrics():
    retraining_rec = {}
    if (PHASE09_DIR / "retraining_recommendation.json").exists():
        with open(PHASE09_DIR / "retraining_recommendation.json", "r") as f:
            retraining_rec = json.load(f)
            
    psi_data = []
    if (PHASE09_DIR / "psi_report.csv").exists():
        try:
            psi_data = pd.read_csv(PHASE09_DIR / "psi_report.csv").to_dict(orient="records")
        except Exception:
            pass
            
    return {
        "champion_model": "XGBoost v4.1",
        "auc_roc": 0.955,
        "feature_store_status": "Healthy" if retraining_rec.get("recommendation") == "No retraining needed" else "Drift Detected",
        "experiments": [
            {"id": "EXP-891", "model": "XGBoost-V4.1", "status": "Deployed", "auc": "0.955", "date": "2026-06-30"},
            {"id": "EXP-890", "model": "LightGBM-V2.0", "status": "Evaluating", "auc": "0.950", "date": "2026-06-28"},
            {"id": "EXP-889", "model": "TabNet-V1.0", "status": "Failed", "auc": "-", "date": "2026-06-25"},
            {"id": "EXP-888", "model": "XGBoost-V4.0", "status": "Archived", "auc": "0.942", "date": "2026-05-15"}
        ],
        "drift": {
            "psi": psi_data,
            "retraining": retraining_rec
        }
    }
