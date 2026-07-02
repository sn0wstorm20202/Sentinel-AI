"""
Stage 13 - Frontend-Backend Integration Validation
Verifies that every API endpoint the frontend calls actually works
and returns data matching the TypeScript type contracts.
"""
import json
import sys
import pandas as pd
import numpy as np
from pathlib import Path
from fastapi.testclient import TestClient
from src.api.InvestigatorAPI import app

client = TestClient(app)
results = []

def check(name, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    results.append((name, status, detail))
    print(f"  [{status}] {name}" + (f" -- {detail}" if detail else ""))

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

# ============================================================
# SECTION 1: Health & Readiness (Frontend checks on mount)
# ============================================================
section("1. Health & Readiness Endpoints")

r = client.get("/health")
check("GET /health returns 200", r.status_code == 200)
check("GET /health has 'status' key", "status" in r.json())

r = client.get("/live")
check("GET /live returns 200", r.status_code == 200)

r = client.get("/ready")
check("GET /ready returns 200", r.status_code == 200)

# ============================================================
# SECTION 2: Cases API (use-cases.ts hooks)
# ============================================================
section("2. Cases API (CasesAPI.py <-> use-cases.ts)")

# GET /api/v1/cases -> useCases()
r = client.get("/api/v1/cases")
check("GET /api/v1/cases returns 200", r.status_code == 200)
cases = r.json()
check("GET /api/v1/cases returns list", isinstance(cases, list))

if len(cases) > 0:
    c = cases[0]
    # Validate CaseSummary TypeScript interface
    check("CaseSummary has 'id'", "id" in c)
    check("CaseSummary has 'txId'", "txId" in c)
    check("CaseSummary has 'date'", "date" in c)
    check("CaseSummary has 'risk'", "risk" in c)
    check("CaseSummary has 'score'", "score" in c)
    check("CaseSummary has 'status'", "status" in c)

    # GET /api/v1/cases/{id}/explain -> useCaseExplain()
    case_id = c["id"]
    r2 = client.get(f"/api/v1/cases/{case_id}/explain")
    check(f"GET /api/v1/cases/{case_id}/explain returns 200", r2.status_code == 200)
    explain = r2.json()

    # Validate InvestigationCase TypeScript interface
    check("InvestigationCase has 'metadata'", "metadata" in explain)
    check("InvestigationCase has 'risk_assessment'", "risk_assessment" in explain)
    check("InvestigationCase has 'intelligence'", "intelligence" in explain)
    check("InvestigationCase has 'action_engine'", "action_engine" in explain)

    if "metadata" in explain:
        m = explain["metadata"]
        check("metadata.case_id exists", "case_id" in m)
        check("metadata.transaction_id exists", "transaction_id" in m)
        check("metadata.generated_at exists", "generated_at" in m)
        check("metadata.engine_version exists", "engine_version" in m)

    if "risk_assessment" in explain:
        ra = explain["risk_assessment"]
        check("risk_assessment.probability exists", "probability" in ra)
        check("risk_assessment.risk_score exists", "risk_score" in ra)
        check("risk_assessment.risk_tier exists", "risk_tier" in ra)

    if "intelligence" in explain:
        intel = explain["intelligence"]
        check("intelligence.natural_language_summary exists",
              "natural_language_summary" in intel)
else:
    check("Cases list is non-empty", False, "No cases returned - cannot validate detail endpoints")

# GET /api/v1/cases/{bad_id} -> 404
r3 = client.get("/api/v1/cases/NONEXISTENT_999")
check("GET /api/v1/cases/NONEXISTENT returns 404", r3.status_code == 404)

# ============================================================
# SECTION 3: Graph API (use-cases.ts -> useCaseGraph)
# ============================================================
section("3. Graph API (GraphAPI.py <-> frontend graph hooks)")

# GET /api/v1/graph/statistics
r = client.get("/api/v1/graph/statistics")
check("GET /graph/statistics returns 200", r.status_code == 200)

# GET /api/v1/graph/metadata
r = client.get("/api/v1/graph/metadata")
check("GET /graph/metadata returns 200", r.status_code == 200)

# GET /api/v1/graph/communities
r = client.get("/api/v1/graph/communities")
check("GET /graph/communities returns 200", r.status_code == 200)
comm = r.json()
check("Communities has 'communities' key", "communities" in comm)
check("Communities has 'pagination' key", "pagination" in comm)

# GET /api/v1/graph/community/{id}
r = client.get("/api/v1/graph/community/0")
check("GET /graph/community/0 returns 200", r.status_code == 200)

# GET /api/v1/graph/community/{bad_id} -> 404
r = client.get("/api/v1/graph/community/999999")
check("GET /graph/community/999999 returns 404", r.status_code == 404)

# GET /api/v1/graph/network/{case_id} -> GraphNetwork TypeScript interface
if len(cases) > 0:
    case_id = cases[0]["id"]
    r = client.get(f"/api/v1/graph/network/{case_id}")
    if r.status_code == 200:
        net = r.json()
        check(f"GET /graph/network/{case_id} returns 200", True)
        check("GraphNetwork has 'nodes' array", isinstance(net.get("nodes"), list))
        check("GraphNetwork has 'edges' array", isinstance(net.get("edges"), list))
        if len(net["nodes"]) > 0:
            n = net["nodes"][0]
            check("GraphNode has 'id'", "id" in n)
            check("GraphNode has 'type'", "type" in n)
            check("GraphNode has 'data'", "data" in n)
            if "data" in n:
                check("GraphNode.data has 'label'", "label" in n["data"])
                check("GraphNode.data has 'type'", "type" in n["data"])
        if len(net["edges"]) > 0:
            e = net["edges"][0]
            check("GraphEdge has 'id'", "id" in e)
            check("GraphEdge has 'source'", "source" in e)
            check("GraphEdge has 'target'", "target" in e)
    elif r.status_code == 404:
        check(f"GET /graph/network/{case_id} returns 404 (case not in graph)", True,
              "Case not found in graph - acceptable if case_id doesn't map to a TXN node")
    else:
        check(f"GET /graph/network/{case_id}", False, f"Unexpected status {r.status_code}")

# ============================================================
# SECTION 4: MLOps API (use-mlops.ts -> useMLOpsMetrics)
# ============================================================
section("4. MLOps API (MLOpsAPI.py <-> use-mlops.ts)")

r = client.get("/api/v1/mlops/metrics")
check("GET /mlops/metrics returns 200", r.status_code == 200)
mlops = r.json()

# Validate MLOpsMetrics TypeScript interface
check("MLOpsMetrics has 'champion_model'", "champion_model" in mlops)
check("MLOpsMetrics has 'auc_roc'", "auc_roc" in mlops)
check("MLOpsMetrics has 'feature_store_status'", "feature_store_status" in mlops)
check("MLOpsMetrics has 'experiments'", "experiments" in mlops)
check("MLOpsMetrics has 'drift'", "drift" in mlops)

if "experiments" in mlops:
    check("experiments is a list", isinstance(mlops["experiments"], list))
    if len(mlops["experiments"]) > 0:
        exp = mlops["experiments"][0]
        check("Experiment has 'id'", "id" in exp)
        check("Experiment has 'model'", "model" in exp)
        check("Experiment has 'status'", "status" in exp)
        check("Experiment has 'auc'", "auc" in exp)
        check("Experiment has 'date'", "date" in exp)

if "drift" in mlops:
    check("drift has 'psi'", "psi" in mlops["drift"])
    check("drift has 'retraining'", "retraining" in mlops["drift"])

# ============================================================
# SECTION 5: SSE Stream (use-sse.ts)
# ============================================================
section("5. SSE Stream (SSEAPI.py <-> use-sse.ts)")

r = client.get("/api/v1/stream", timeout=3)
check("GET /stream returns 200", r.status_code == 200)
check("SSE content-type is text/event-stream",
      "text/event-stream" in r.headers.get("content-type", ""))

# ============================================================
# SECTION 6: POST /api/v1/cases/explain (Orchestrator E2E)
# ============================================================
section("6. POST /api/v1/cases/explain (Full Orchestrator)")

df = pd.read_csv("data/selected/approved_features.csv")
fraud_df = df[df["F3924"] == 1].drop(columns=["F3924"])
txn = fraud_df.iloc[0].to_dict()
clean = {}
for k, v in txn.items():
    if pd.isna(v): clean[k] = 0.0
    elif isinstance(v, (np.int64, np.int32)): clean[k] = int(v)
    elif isinstance(v, (np.float64, np.float32)): clean[k] = float(v)
    else: clean[k] = v

payload = {
    "request_id": "INTEGRATION_TEST_001",
    "case_id": "CASE_INTEGRATION",
    "transaction_id": "TXN_INTEGRATION",
    "timestamp": "2026-07-02T23:30:00Z",
    "features": clean
}

r = client.post("/api/v1/cases/explain", json=payload)
check("POST /cases/explain returns 200", r.status_code == 200)
if r.status_code == 200:
    data = r.json()
    check("Response has 'metadata'", "metadata" in data)
    check("Response has 'risk_assessment'", "risk_assessment" in data)
    check("Response has 'intelligence'", "intelligence" in data)
    check("Response has 'action_engine'", "action_engine" in data)

# ============================================================
# SECTION 7: CORS Headers (Frontend can actually call backend)
# ============================================================
section("7. CORS Validation")

r = client.options("/api/v1/cases", headers={
    "Origin": "http://localhost:3000",
    "Access-Control-Request-Method": "GET"
})
cors_header = r.headers.get("access-control-allow-origin", "")
check("CORS allows http://localhost:3000", cors_header in ["*", "http://localhost:3000"])

# ============================================================
# SUMMARY
# ============================================================
print(f"\n{'='*60}")
print(f"  INTEGRATION VALIDATION SUMMARY")
print(f"{'='*60}")

passed = sum(1 for _, s, _ in results if s == "PASS")
failed = sum(1 for _, s, _ in results if s == "FAIL")
total = len(results)

print(f"\n  Total:  {total}")
print(f"  Passed: {passed}")
print(f"  Failed: {failed}")

if failed == 0:
    print(f"\n  VERDICT: ALL CHECKS PASSED")
    print(f"  Frontend-Backend integration is VERIFIED.")
else:
    print(f"\n  VERDICT: {failed} CHECKS FAILED")
    print(f"\n  Failed checks:")
    for name, status, detail in results:
        if status == "FAIL":
            print(f"    - {name}" + (f": {detail}" if detail else ""))

# Write report
report_lines = ["# Stage 13 -- Frontend-Backend Integration Report\n"]
report_lines.append(f"**Date**: 2026-07-02\n")
report_lines.append(f"**Verdict**: {'PASS' if failed == 0 else 'FAIL'} ({passed}/{total})\n")
report_lines.append("\n| Check | Status | Notes |")
report_lines.append("| :--- | :--- | :--- |")
for name, status, detail in results:
    icon = "PASS" if status == "PASS" else "FAIL"
    report_lines.append(f"| {name} | {icon} | {detail} |")

Path("reports").mkdir(exist_ok=True)
with open("reports/Frontend_Backend_Integration_Report.md", "w") as f:
    f.write("\n".join(report_lines))

print(f"\nReport written to reports/Frontend_Backend_Integration_Report.md")
sys.exit(0 if failed == 0 else 1)
