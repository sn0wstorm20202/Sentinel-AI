import json
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
