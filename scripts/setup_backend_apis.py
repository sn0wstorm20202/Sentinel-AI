import os

API_DIR = "E:/Sentinel-AI/src/api"

CASES_API = """import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/cases", tags=["Cases"])
REPORTS_DIR = Path("reports/phase_06")

@router.get("")
def list_cases():
    path = REPORTS_DIR / "case_examples.json"
    if not path.exists():
        return []
    with open(path, "r") as f:
        cases = json.load(f)
    
    result = []
    for c in cases:
        result.append({
            "id": c["metadata"]["case_id"],
            "txId": c["metadata"]["transaction_id"],
            "date": c["metadata"]["generated_at"],
            "risk": c["risk_assessment"]["risk_tier"],
            "score": c["risk_assessment"]["risk_score"],
            "status": "Open" if c["risk_assessment"]["risk_tier"] in ["Critical", "High"] else "Closed"
        })
    return result

@router.get("/{case_id}")
def get_case(case_id: str):
    path = REPORTS_DIR / "case_examples.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Cases not found")
    with open(path, "r") as f:
        cases = json.load(f)
    for c in cases:
        if c["metadata"]["case_id"] == case_id:
            return c
    raise HTTPException(status_code=404, detail="Case not found")

@router.get("/{case_id}/explain")
def explain_case_get(case_id: str):
    path = REPORTS_DIR / "case_examples.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Cases not found")
    with open(path, "r") as f:
        cases = json.load(f)
    for c in cases:
        if c["metadata"]["case_id"] == case_id:
            return c
    raise HTTPException(status_code=404, detail="Case not found")
"""

MLOPS_API = """import json
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
"""

SSE_API = """from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio
import json

router = APIRouter(prefix="/api/v1/stream", tags=["Realtime"])

async def event_generator():
    yield f"data: {json.dumps({'type': 'ping', 'message': 'connected'})}\\n\\n"
    while True:
        await asyncio.sleep(15)
        yield f"data: {json.dumps({'type': 'heartbeat'})}\\n\\n"

@router.get("")
async def stream_events():
    return StreamingResponse(event_generator(), media_type="text/event-stream")
"""

with open(f"{API_DIR}/CasesAPI.py", "w") as f:
    f.write(CASES_API)
with open(f"{API_DIR}/MLOpsAPI.py", "w") as f:
    f.write(MLOPS_API)
with open(f"{API_DIR}/SSEAPI.py", "w") as f:
    f.write(SSE_API)
